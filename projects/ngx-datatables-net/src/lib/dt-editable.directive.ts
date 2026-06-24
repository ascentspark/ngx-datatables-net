import {
  afterRenderEffect,
  ApplicationRef,
  ChangeDetectorRef,
  DestroyRef,
  Directive,
  ElementRef,
  type EmbeddedViewRef,
  inject,
  input,
  NgZone,
  output,
  untracked,
} from '@angular/core';
import { isObservable, type Observable } from 'rxjs';
import type { Api } from 'datatables.net';
import { DtTableDirective } from './dt-table.directive';
import type { DtColumn } from './dt-cell-template';
import type {
  DtCellEditCancel,
  DtCellEditCancelReason,
  DtCellEditCommit,
  DtCellEditError,
  DtCellSaveHandler,
  DtEditContext,
  DtEditorConfig,
  DtEditorOption,
  DtEditorTemplateContext,
} from './dt-editable.types';

/** Imperative handle over a mounted editor control (native or custom-template). */
interface EditorControl {
  /** The element inserted into the cell. */
  readonly root: HTMLElement;
  /** Read the control's current value in the editor's native value type. */
  read(): unknown;
  /** Move focus into the control. */
  focus(): void;
  /** Enable/disable the control while an async save is in flight. */
  setBusy(busy: boolean): void;
  /** Remove listeners / release resources. Does NOT touch the cell DOM. */
  destroy(): void;
  /** For `custom` editors, the backing EmbeddedView (so it can be detached + destroyed). */
  readonly view?: EmbeddedViewRef<DtEditorTemplateContext<unknown>>;
}

/** Bookkeeping for the single in-flight edit. */
interface ActiveEdit<T> {
  readonly td: HTMLTableCellElement;
  readonly cell: ReturnType<Api<T>['cell']>;
  readonly config: DtEditorConfig<T>;
  readonly ctx: DtEditContext<T>;
  /** Original cell child nodes, preserved so cancel restores them (incl. live cell-template views). */
  readonly savedNodes: ChildNode[];
  readonly control: EditorControl;
  /** Wrapper element hosting the control (and any error/busy affordances). */
  readonly wrapper: HTMLElement;
  /** True while an async save handler is pending; blocks further commit/cancel. */
  saving: boolean;
  /** Inline error element (validation or save failure), if currently shown. */
  errorEl: HTMLElement | null;
  /** Monotonic token so a stale async save can't write after the editor moved on. */
  saveToken: number;
  /** Tears down an in-flight async save subscription (Observable) on teardown/destroy. */
  saveCleanup: (() => void) | null;
}

/**
 * `[dtEditable]` — double-click-to-edit-in-place companion to `[dtTable]`.
 *
 * Put it on the same `<table>` as `dtTable`. Columns opt in by carrying an `editor` config
 * (`DtColumn.editor`); a column with no `editor` is read-only. Double-clicking an editable cell
 * opens the configured control (text, textarea, number, date, checkbox, select, multiselect, or a
 * custom `<ng-template>`). Enter / blur commits, Escape cancels.
 *
 * Design mirrors `DtTableDirective`:
 * - The dblclick listener is delegated on the persistent `<tbody>` and (re)attached via an
 *   `afterRenderEffect` keyed on the host's `instance()` signal, so it survives table recreation.
 * - Native controls are built as real DOM elements (full control over parsing, keyboard and a11y);
 *   only `custom` editors use `createEmbeddedView`, attached to `ApplicationRef` like cell templates.
 * - Zoneless-correct: DataTables writes run via `runOutsideAngular`; output emissions re-enter
 *   Angular and `markForCheck()`. Native control listeners fire outside Angular and re-enter on emit.
 * - Commit writes through the DataTables `Api` (`cell().data(v).draw(false)`), keeping sort, filter
 *   and search correct. Cancel restores the exact original cell nodes without a redraw.
 *
 * @typeParam T row data shape (matched to the host `dtTable`).
 */
@Directive({
  selector: 'table[dtEditable]',
  exportAs: 'dtEditable',
})
export class DtEditableDirective<T = unknown> {
  private readonly host = inject(DtTableDirective) as unknown as DtTableDirective<T>;
  private readonly hostEl = inject<ElementRef<HTMLTableElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly destroyRef = inject(DestroyRef);

  // ---- Inputs -------------------------------------------------------------------------------
  /**
   * Type-inference anchor ONLY. `[dtData]` is owned by `dtTable`; declaring the same alias here
   * lets Angular's template type-checker infer this directive's row type `T` from the bound data
   * (sibling directives can't otherwise share a generic), so `(dtCellEdit)` etc. are typed. The
   * value is never read here — `dtTable` is the single source of truth for the data.
   */
  readonly dataTypeAnchor = input<readonly T[] | undefined>(undefined, { alias: 'dtData' });

  /**
   * Optional pessimistic save handler. Runs on commit BEFORE the cell is written. Return a Promise
   * or Observable to defer the write until it settles (the control shows a busy state); reject/throw
   * to keep the cell unchanged, surface `dtCellEditError`, and leave the editor open for retry.
   * Return `void` (or any non-thenable) for a synchronous commit.
   */
  readonly save = input<DtCellSaveHandler<T> | undefined>(undefined, { alias: 'dtSave' });

  // ---- Outputs ------------------------------------------------------------------------------
  /** Emitted when an edit begins (editor opened). */
  readonly editStart = output<DtEditContext<T>>({ alias: 'dtCellEditStart' });
  /** Emitted after a changed value is validated, saved and written to the cell. */
  readonly edit = output<DtCellEditCommit<T>>({ alias: 'dtCellEdit' });
  /** Emitted when an edit is abandoned (Escape, blur-with-no-change, programmatic close, …). */
  readonly editCancel = output<DtCellEditCancel<T>>({ alias: 'dtCellEditCancel' });
  /** Emitted when an async/sync save handler fails; the cell is left unchanged. */
  readonly editError = output<DtCellEditError<T>>({ alias: 'dtCellEditError' });

  // ---- State --------------------------------------------------------------------------------
  private active: ActiveEdit<T> | null = null;
  /** Guard against re-entrant commit/cancel from blur events fired while the cell DOM is changing. */
  private finishing = false;
  /** When the next close was keyboard-initiated, return focus to the cell (not on blur/redraw). */
  private refocusCell = false;
  /** Set once the directive is destroyed, so a late async save resolution does nothing. */
  private destroyed = false;
  /** A Tab move queued behind an in-flight async save, applied once the save commits. */
  private pendingAdvance: { rowIndex: number; fromCol: number; direction: 1 | -1 } | null = null;
  private listenerCleanup?: () => void;

  constructor() {
    // (Re)attach the delegated dblclick listener whenever the table instance appears or changes.
    // A change of instance means the table was (re)created or destroyed; any editor still open
    // belongs to now-orphaned DOM, so discard it (silently — the table itself is being rebuilt).
    afterRenderEffect(() => {
      const api = this.host.instance();
      untracked(() => {
        this.discardActive();
        this.detachListener();
        if (api) {
          this.attachListener(api);
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.discardActive();
      this.detachListener();
    });
  }

  // ---- Listener wiring ----------------------------------------------------------------------
  private attachListener(api: Api<T>): void {
    const tbody = this.hostEl.nativeElement.querySelector('tbody');
    if (!tbody) {
      return;
    }
    const dblHandler = (event: Event) => this.onDblClick(event, api, tbody);
    tbody.addEventListener('dblclick', dblHandler);
    // Any redraw NOT caused by our own commit (sort/page/filter/external data change) invalidates an
    // open editor. We hook `preDraw` (fires BEFORE DataTables touches the DOM) so the editor is
    // cleanly removed and the cell restored before the redraw re-renders it. Our own commit sets
    // `finishing`, so this no-ops during that draw.
    const preDrawHandler = () => this.onPreDraw();
    api.on('preDraw.ngxedit', preDrawHandler);
    this.listenerCleanup = () => {
      tbody.removeEventListener('dblclick', dblHandler);
      api.off('preDraw.ngxedit', preDrawHandler);
    };
  }

  private detachListener(): void {
    this.listenerCleanup?.();
    this.listenerCleanup = undefined;
  }

  private onPreDraw(): void {
    // An in-flight save (`saving`) can't be cancelled, so we let it settle. DataTables reuses cached
    // row nodes, so the busy editor survives the external redraw, and the save's own commit-draw then
    // re-renders the cell cleanly — no orphaned editor is left behind.
    if (this.active && !this.finishing && !this.active.saving) {
      this.zone.run(() => this.cancel('programmatic'));
    }
  }

  // ---- Open ---------------------------------------------------------------------------------
  private onDblClick(event: Event, api: Api<T>, tbody: Element): void {
    const target = event.target as HTMLElement | null;
    const td = target?.closest('td') as HTMLTableCellElement | null;
    if (!td || !tbody.contains(td)) {
      return;
    }
    let index: { row: number; column: number } | undefined;
    let cell: ReturnType<Api<T>['cell']>;
    try {
      cell = api.cell(td);
      index = cell.index() as { row: number; column: number } | undefined;
    } catch {
      return; // not a data cell (header/footer/child row)
    }
    if (!index) {
      return;
    }
    const colIndex = index.column;
    const rowIndex = index.row;
    const config = this.editorFor(colIndex);
    if (!config) {
      return; // read-only column
    }
    const ctx = this.buildContext(api, cell, rowIndex, colIndex, td);
    if (config.disabled?.(ctx)) {
      return;
    }
    // Finalize any currently-open editor before opening another.
    if (this.active && !this.finalizeActive()) {
      return; // current editor refused to close (e.g. failed validation or an in-flight save)
    }
    this.openEditor(td, cell, config, ctx);
  }

  private buildContext(
    api: Api<T>,
    cell: ReturnType<Api<T>['cell']>,
    rowIndex: number,
    colIndex: number,
    td: HTMLTableCellElement,
  ): DtEditContext<T> {
    return {
      api,
      row: api.row(rowIndex).data() as T,
      rowIndex,
      colIndex,
      columnKey: this.columnKey(colIndex),
      value: cell.data(),
      cell: td,
    };
  }

  /** Open the editor for an explicit (rowIndex, colIndex) — used by Tab navigation. */
  private openCellByIndex(api: Api<T>, rowIndex: number, colIndex: number): void {
    const config = this.editorFor(colIndex);
    if (!config) {
      return;
    }
    const cell = api.cell(rowIndex, colIndex);
    const td = (cell.node?.() as HTMLTableCellElement | null) ?? null;
    if (!td) {
      return; // cell not on the current page
    }
    const ctx = this.buildContext(api, cell, rowIndex, colIndex, td);
    if (config.disabled?.(ctx)) {
      return;
    }
    this.openEditor(td, cell, config, ctx);
  }

  /**
   * Tab / Shift+Tab: commit the current cell, then open the next/previous editable cell in the SAME
   * row. Cross-row movement is intentionally not performed (it would be ambiguous under paging and
   * sorting); Tab from the last editable cell simply commits and lets focus leave the table.
   */
  private handleTab(direction: 1 | -1): void {
    const a = this.active;
    if (!a || a.saving) {
      return;
    }
    const api = a.ctx.api;
    const rowIndex = a.ctx.rowIndex;
    const fromCol = a.ctx.colIndex;
    this.requestCommit('explicit');
    if (this.active) {
      // Commit blocked (validation failed) or deferred (async save). Queue the move for after an
      // async save commits; for a validation block we stay put.
      if (this.active.saving) {
        this.pendingAdvance = { rowIndex, fromCol, direction };
      }
      return;
    }
    this.advanceTo(api, rowIndex, fromCol, direction);
  }

  /** Open the next/previous editable cell in the row, if any. */
  private advanceTo(api: Api<T>, rowIndex: number, fromCol: number, direction: 1 | -1): void {
    const nextCol = this.findEditableColumn(api, rowIndex, fromCol, direction);
    if (nextCol != null) {
      this.openCellByIndex(api, rowIndex, nextCol);
    }
  }

  private findEditableColumn(
    api: Api<T>,
    rowIndex: number,
    fromCol: number,
    direction: 1 | -1,
  ): number | null {
    const cols = this.resolvedColumns();
    if (!cols) {
      return null;
    }
    for (let c = fromCol + direction; c >= 0 && c < cols.length; c += direction) {
      const editor = cols[c]?.editor;
      if (!editor) {
        continue;
      }
      const cell = api.cell(rowIndex, c);
      const td = (cell.node?.() as HTMLTableCellElement | null) ?? null;
      if (!td) {
        continue;
      }
      if (editor.disabled && editor.disabled(this.buildContext(api, cell, rowIndex, c, td))) {
        continue;
      }
      return c;
    }
    return null;
  }

  private openEditor(
    td: HTMLTableCellElement,
    cell: ReturnType<Api<T>['cell']>,
    config: DtEditorConfig<T>,
    ctx: DtEditContext<T>,
  ): void {
    const savedNodes = Array.from(td.childNodes);
    const control = this.buildControl(config, ctx);
    const wrapper = document.createElement('div');
    wrapper.className = 'ngxdt-editor';
    wrapper.appendChild(control.root);
    td.replaceChildren(wrapper);
    td.classList.add('ngxdt-editing');

    this.active = {
      td,
      cell,
      config,
      ctx,
      savedNodes,
      control,
      wrapper,
      saving: false,
      errorEl: null,
      saveToken: 0,
      saveCleanup: null,
    };
    control.focus();
    this.emitInZone(() => this.editStart.emit(ctx));
  }

  // ---- Commit / cancel ----------------------------------------------------------------------
  /** Native commit trigger (Enter / blur / Tab): read the control and commit. */
  private requestCommit(trigger: 'explicit' | 'blur'): void {
    const a = this.active;
    if (!a || this.finishing || a.saving) {
      return;
    }
    this.doCommit(a.control.read(), trigger);
  }

  private doCommit(newValue: unknown, trigger: 'explicit' | 'blur'): void {
    const a = this.active;
    if (!a || this.finishing || a.saving) {
      return;
    }
    const oldValue = a.ctx.value;
    if (this.valuesEqual(oldValue, newValue)) {
      this.cancel('unchanged');
      return;
    }
    // Synchronous validation gate.
    const error = a.config.validate?.(newValue, a.ctx.row);
    if (error) {
      if (trigger === 'blur') {
        // Don't trap focus on blur: discard the invalid value and revert.
        this.cancel('invalid');
      } else {
        this.showError(a, error);
        this.refocusCell = false; // editor stays open; keep focus in the control
        a.control.focus();
      }
      return;
    }
    this.clearError(a);
    const commit: DtCellEditCommit<T> = { ...a.ctx, oldValue, newValue };
    const save = this.save();
    if (!save) {
      this.write(a, commit);
      return;
    }

    // Run the (possibly async) save before writing — pessimistic.
    let result: ReturnType<DtCellSaveHandler<T>>;
    try {
      result = save(commit);
    } catch (error) {
      this.handleSaveError(a, commit, error);
      return;
    }
    if (!this.isAsync(result)) {
      this.write(a, commit);
      return;
    }
    const token = ++a.saveToken;
    this.beginSaving(a);
    this.toPromise(result, a).then(
      () =>
        this.zone.run(() => {
          a.saveCleanup = null;
          if (!this.destroyed && this.active === a && a.saveToken === token) {
            a.saving = false;
            this.write(a, commit);
          }
        }),
      (error: unknown) =>
        this.zone.run(() => {
          a.saveCleanup = null;
          if (!this.destroyed && this.active === a && a.saveToken === token) {
            a.saving = false;
            this.handleSaveError(a, commit, error);
          }
        }),
    );
  }

  /** Write the committed value through the Api, close the editor, and emit `dtCellEdit`. */
  private write(a: ActiveEdit<T>, commit: DtCellEditCommit<T>): void {
    this.finishing = true;
    // Tear the editor down BEFORE the redraw: detach/destroy our view and drop listeners while the
    // cell DOM is still ours, so the `draw(false)` below re-renders a clean cell (and the host
    // directive's cell-template rebuild never races a half-destroyed control).
    this.teardownControl(a);
    const api = a.ctx.api;
    this.zone.runOutsideAngular(() => {
      a.cell.data(commit.newValue as never);
      api.draw(false); // re-renders the cell from data; keeps the current page
    });
    a.td.classList.remove('ngxdt-editing');
    this.active = null;
    this.finishing = false;
    this.maybeRefocus(a.td);
    this.emitInZone(() => this.edit.emit(commit));
    // A Tab move that was queued behind an async save: advance now that the cell has committed.
    if (this.pendingAdvance) {
      const adv = this.pendingAdvance;
      this.pendingAdvance = null;
      this.advanceTo(api, adv.rowIndex, adv.fromCol, adv.direction);
    }
  }

  /** A save handler failed: keep the cell unchanged, show the error, and leave the editor open. */
  private handleSaveError(a: ActiveEdit<T>, commit: DtCellEditCommit<T>, error: unknown): void {
    this.pendingAdvance = null; // a failed save cancels any queued Tab advance
    this.endSaving(a);
    this.showError(a, this.errorMessage(error));
    a.control.focus();
    const evt: DtCellEditError<T> = { ...commit, error };
    this.emitInZone(() => this.editError.emit(evt));
  }

  private cancel(reason: DtCellEditCancelReason): void {
    const a = this.active;
    if (!a || this.finishing || a.saving) {
      return; // ignore cancel while a save is in flight
    }
    this.finishing = true;
    // Put the original cell nodes back (preserves any live cell-template view). When a redraw is
    // imminent (preDraw), this restores the cell to its pre-edit state so the redraw re-renders it
    // cleanly rather than over a dangling editor control.
    a.td.replaceChildren(...a.savedNodes);
    a.td.classList.remove('ngxdt-editing');
    this.teardownControl(a);
    this.active = null;
    this.finishing = false;
    this.maybeRefocus(a.td);
    const evt: DtCellEditCancel<T> = { ...a.ctx, reason };
    this.emitInZone(() => this.editCancel.emit(evt));
  }

  /** Close any open editor on destroy WITHOUT emitting (the component is going away). */
  private discardActive(): void {
    const a = this.active;
    if (!a) {
      return;
    }
    this.finishing = true;
    this.pendingAdvance = null;
    a.td.replaceChildren(...a.savedNodes);
    this.teardownControl(a);
    this.active = null;
    this.finishing = false;
  }

  /** Commit the active editor (used before opening another). Returns true if it closed. */
  private finalizeActive(): boolean {
    const a = this.active;
    if (!a) {
      return true;
    }
    if (a.config.type === 'custom') {
      this.cancel('programmatic');
      return this.active === null;
    }
    this.doCommit(a.control.read(), 'explicit');
    return this.active === null;
  }

  private teardownControl(a: ActiveEdit<T>): void {
    a.saveCleanup?.(); // unsubscribe an in-flight Observable save, if any
    a.saveCleanup = null;
    a.control.destroy();
    const view = a.control.view;
    if (view) {
      this.appRef.detachView(view);
      view.destroy();
    }
  }

  // ---- Async save plumbing ------------------------------------------------------------------
  private isAsync(result: unknown): result is Promise<unknown> | Observable<unknown> {
    return (
      !!result &&
      (typeof (result as { then?: unknown }).then === 'function' || isObservable(result))
    );
  }

  /**
   * Normalize a Promise/Observable save result to a Promise that resolves on first value/complete.
   * For an Observable, registers `a.saveCleanup` so an in-flight subscription is torn down if the
   * editor closes or the directive is destroyed before it settles (no leaked subscriptions).
   */
  private toPromise(
    result: Promise<unknown> | Observable<unknown>,
    a: ActiveEdit<T>,
  ): Promise<void> {
    if (isObservable(result)) {
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const sub = result.subscribe({
          next: () => {
            if (!settled) {
              settled = true;
              resolve();
              // Defer: for a synchronous Observable `sub` is not assigned yet when `next` fires.
              queueMicrotask(() => sub.unsubscribe());
            }
          },
          error: (err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          },
          complete: () => {
            if (!settled) {
              settled = true;
              resolve();
            }
          },
        });
        a.saveCleanup = () => sub.unsubscribe();
      });
    }
    return Promise.resolve(result).then(() => undefined);
  }

  private beginSaving(a: ActiveEdit<T>): void {
    a.saving = true;
    a.td.classList.add('ngxdt-editing--busy');
    a.control.setBusy(true);
  }

  private endSaving(a: ActiveEdit<T>): void {
    a.saving = false;
    a.td.classList.remove('ngxdt-editing--busy');
    a.control.setBusy(false);
  }

  private showError(a: ActiveEdit<T>, message: string): void {
    if (!a.errorEl) {
      const el = document.createElement('div');
      el.className = 'ngxdt-editor__error';
      el.setAttribute('role', 'alert');
      // Minimal inline styling so the message is legible without any consumer CSS; everything is
      // overridable via the `.ngxdt-editor__error` class.
      el.style.color = '#b00020';
      el.style.fontSize = '0.8em';
      el.style.lineHeight = '1.3';
      el.style.marginTop = '2px';
      a.wrapper.appendChild(el);
      a.errorEl = el;
    }
    a.errorEl.textContent = message;
  }

  private clearError(a: ActiveEdit<T>): void {
    if (a.errorEl) {
      a.errorEl.remove();
      a.errorEl = null;
    }
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Save failed';
  }

  // ---- Control factories --------------------------------------------------------------------
  private buildControl(config: DtEditorConfig<T>, ctx: DtEditContext<T>): EditorControl {
    switch (config.type) {
      case 'text':
        return this.inputControl(config, ctx, 'text');
      case 'number':
        return this.inputControl(config, ctx, 'number');
      case 'date':
        return this.inputControl(config, ctx, 'date');
      case 'textarea':
        return this.textareaControl(config, ctx);
      case 'checkbox':
        return this.checkboxControl(config, ctx);
      case 'select':
        return this.selectControl(config, ctx, false);
      case 'multiselect':
        return this.selectControl(config, ctx, true);
      case 'custom':
        return this.customControl(config, ctx);
    }
  }

  private inputControl(
    config: Extract<DtEditorConfig<T>, { type: 'text' | 'number' | 'date' }>,
    ctx: DtEditContext<T>,
    domType: 'text' | 'number' | 'date',
  ): EditorControl {
    const input = document.createElement('input');
    input.type = domType;
    input.className = `ngxdt-editor__input ngxdt-editor__input--${domType}`;
    this.styleFill(input);
    input.value = ctx.value == null ? '' : String(ctx.value);
    this.applyAria(input, config, ctx);
    if ('placeholder' in config && config.placeholder) {
      input.placeholder = config.placeholder;
    }
    if (config.type === 'text' && config.maxLength != null) {
      input.maxLength = config.maxLength;
    }
    if (config.type === 'number') {
      if (config.min != null) input.min = String(config.min);
      if (config.max != null) input.max = String(config.max);
      if (config.step != null) input.step = String(config.step);
    }
    if (config.type === 'date') {
      if (config.min) input.min = config.min;
      if (config.max) input.max = config.max;
    }

    const read = (): unknown => {
      const raw = input.value;
      if (domType === 'number') {
        if (raw.trim() === '') return null;
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
      }
      if (domType === 'date') {
        return raw === '' ? null : raw;
      }
      return raw;
    };
    return this.wireControl(input, read);
  }

  private textareaControl(
    config: Extract<DtEditorConfig<T>, { type: 'textarea' }>,
    ctx: DtEditContext<T>,
  ): EditorControl {
    const ta = document.createElement('textarea');
    ta.className = 'ngxdt-editor__input ngxdt-editor__input--textarea';
    this.styleFill(ta);
    ta.rows = config.rows ?? 3;
    ta.value = ctx.value == null ? '' : String(ctx.value);
    this.applyAria(ta, config, ctx);
    if (config.placeholder) ta.placeholder = config.placeholder;
    if (config.maxLength != null) ta.maxLength = config.maxLength;
    // In a textarea plain Enter inserts a newline; commit on Ctrl/Cmd+Enter (and blur).
    return this.wireControl(ta, () => ta.value, { commitOnPlainEnter: false });
  }

  private checkboxControl(
    config: Extract<DtEditorConfig<T>, { type: 'checkbox' }>,
    ctx: DtEditContext<T>,
  ): EditorControl {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'ngxdt-editor__input ngxdt-editor__input--checkbox';
    box.checked = ctx.value === true || ctx.value === 'true' || ctx.value === 1;
    this.applyAria(box, config, ctx);
    return this.wireControl(box, () => box.checked);
  }

  private selectControl(
    config: Extract<DtEditorConfig<T>, { type: 'select' | 'multiselect' }>,
    ctx: DtEditContext<T>,
    multiple: boolean,
  ): EditorControl {
    const select = document.createElement('select');
    select.className = `ngxdt-editor__input ngxdt-editor__input--${config.type}`;
    this.styleFill(select);
    select.multiple = multiple;
    this.applyAria(select, config, ctx);

    const options: readonly DtEditorOption[] =
      typeof config.options === 'function' ? config.options(ctx) : config.options;

    const currentArray: unknown[] = multiple
      ? Array.isArray(ctx.value)
        ? (ctx.value as unknown[])
        : []
      : [];

    if (!multiple && 'placeholder' in config && config.placeholder) {
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = config.placeholder;
      if (ctx.value == null) ph.selected = true;
      select.appendChild(ph);
    }

    options.forEach((opt, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = opt.label;
      if (opt.disabled) o.disabled = true;
      if (multiple) {
        o.selected = currentArray.some((v) => v === opt.value);
      } else {
        o.selected = ctx.value === opt.value;
      }
      select.appendChild(o);
    });

    const read = (): unknown => {
      if (multiple) {
        return Array.from(select.selectedOptions)
          .filter((o) => o.value !== '')
          .map((o) => options[Number(o.value)]?.value)
          .filter((v) => v !== undefined);
      }
      const sel = select.selectedOptions[0];
      if (!sel || sel.value === '') return null;
      return options[Number(sel.value)]?.value ?? null;
    };
    return this.wireControl(select, read);
  }

  private customControl(
    config: Extract<DtEditorConfig<T>, { type: 'custom' }>,
    ctx: DtEditContext<T>,
  ): EditorControl {
    const view = config.template.createEmbeddedView({
      $implicit: ctx.value,
      value: ctx.value,
      row: ctx.row,
      rowIndex: ctx.rowIndex,
      colIndex: ctx.colIndex,
      commit: (v: unknown) => this.zone.run(() => this.doCommit(v, 'explicit')),
      cancel: () => this.zone.run(() => this.cancel('programmatic')),
    }) as EmbeddedViewRef<DtEditorTemplateContext<unknown>>;
    this.appRef.attachView(view);
    view.detectChanges();
    const root = document.createElement('div');
    root.className = 'ngxdt-editor__custom';
    root.append(...(view.rootNodes as Node[]));
    return {
      root,
      read: () => ctx.value,
      focus: () => this.focusFirst(root),
      setBusy: (busy: boolean) => root.classList.toggle('ngxdt-editor__custom--busy', busy),
      destroy: () => {},
      view,
    };
  }

  /** Attach Enter/Escape/blur handling shared by every native control. */
  private wireControl(
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    read: () => unknown,
    opts: { commitOnPlainEnter?: boolean } = {},
  ): EditorControl {
    const commitOnPlainEnter = opts.commitOnPlainEnter ?? true;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.refocusCell = true;
        this.zone.run(() => this.cancel('escape'));
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        this.refocusCell = false;
        this.zone.run(() => this.handleTab(event.shiftKey ? -1 : 1));
        return;
      }
      if (event.key === 'Enter') {
        const withMod = event.ctrlKey || event.metaKey;
        if (commitOnPlainEnter || withMod) {
          event.preventDefault();
          this.refocusCell = true;
          this.zone.run(() => this.requestCommit('explicit'));
        }
      }
    };
    const onBlur = () => {
      // Commit on blur, unless we're already tearing down (avoids re-entrancy on DOM removal).
      if (!this.finishing && this.active && !this.active.saving) {
        this.zone.run(() => this.requestCommit('blur'));
      }
    };
    el.addEventListener('keydown', onKeydown as EventListener);
    el.addEventListener('blur', onBlur);
    return {
      root: el,
      read,
      focus: () => {
        el.focus();
        if (el instanceof HTMLInputElement && (el.type === 'text' || el.type === 'number')) {
          el.select();
        }
      },
      setBusy: (busy: boolean) => {
        el.disabled = busy;
      },
      destroy: () => {
        el.removeEventListener('keydown', onKeydown as EventListener);
        el.removeEventListener('blur', onBlur);
      },
    };
  }

  // ---- Helpers ------------------------------------------------------------------------------
  private editorFor(colIndex: number): DtEditorConfig<T> | undefined {
    return this.resolvedColumns()?.[colIndex]?.editor;
  }

  private resolvedColumns(): DtColumn<T>[] | undefined {
    const cols = this.host.columns();
    if (cols) {
      return cols;
    }
    return this.host.options().columns as DtColumn<T>[] | undefined;
  }

  private columnKey(colIndex: number): string | number | null {
    const data = this.resolvedColumns()?.[colIndex]?.data;
    return typeof data === 'string' || typeof data === 'number' ? data : null;
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      const sa = [...a].map((x) => JSON.stringify(x)).sort();
      const sb = [...b].map((x) => JSON.stringify(x)).sort();
      return sa.every((x, i) => x === sb[i]);
    }
    return false;
  }

  private applyAria(el: HTMLElement, config: DtEditorConfig<T>, ctx: DtEditContext<T>): void {
    const label = config.ariaLabel ?? this.columnTitle(ctx.colIndex);
    if (label) {
      el.setAttribute('aria-label', label);
    }
  }

  private columnTitle(colIndex: number): string | undefined {
    const title = this.resolvedColumns()?.[colIndex]?.title;
    return typeof title === 'string' ? title : undefined;
  }

  private styleFill(el: HTMLElement): void {
    el.style.width = '100%';
    el.style.boxSizing = 'border-box';
  }

  private focusFirst(root: HTMLElement): void {
    const focusable = root.querySelector<HTMLElement>(
      'input, textarea, select, button, [tabindex]',
    );
    focusable?.focus();
  }

  /** Return focus to the edited cell after a keyboard-initiated close, for keyboard continuity. */
  private maybeRefocus(td: HTMLTableCellElement): void {
    if (!this.refocusCell) {
      return;
    }
    this.refocusCell = false;
    if (!td.isConnected) {
      return;
    }
    if (!td.hasAttribute('tabindex')) {
      td.setAttribute('tabindex', '-1'); // focusable programmatically, but not in the tab order
    }
    td.focus();
  }

  private emitInZone(fn: () => void): void {
    this.zone.run(() => {
      fn();
      this.cdr.markForCheck();
    });
  }
}
