import {
  afterNextRender,
  afterRenderEffect,
  ApplicationRef,
  ChangeDetectorRef,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  type EmbeddedViewRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  type TemplateRef,
  untracked,
} from '@angular/core';
import DataTableCore from 'datatables.net';
import type { Api, Config, ConfigColumns } from 'datatables.net';
import {
  DATA_TABLE,
  DT_DEFAULT_OPTIONS,
  DT_ESCAPE_DEFAULTS,
  DT_STYLE_SCOPE,
} from './datatables.tokens';
import type { DtCellContext, DtColumn } from './dt-cell-template';
import { escapeHtmlRenderer } from './dt-render';
import type { DtEvent, DtRowClickEvent, DtSelectEvent } from './dt-events';

/**
 * `[dtTable]`, wraps a native `<table>` as a DataTables instance using the non-jQuery API.
 *
 * Design (see `docs/ARCHITECTURE.md`):
 * - Init happens in `afterNextRender` (browser-only), so SSR renders plain HTML and the table is
 *   enhanced only on the client (no `document`/layout access on the server).
 * - Reconciliation runs in an `afterRenderEffect`: a new `dtData` reference takes the cheap path
 *   (`clear -> rows.add -> draw`); a new `dtOptions`/`dtColumns` reference recreates the table.
 * - Zoneless-correct: construction and data writes run via `runOutsideAngular`; event callbacks
 *   re-enter Angular and `markForCheck()`. Selection/instance are also exposed as signals.
 * - Angular cell templates: columns may carry a `dtTemplate` (`DtColumn`), rendered as live
 *   EmbeddedViews into the cells so pipes, `routerLink`, components and bindings work.
 * - Teardown via `DestroyRef`: detaches listeners, destroys cell views, and calls `destroy()`.
 *
 * @typeParam T row data shape.
 */
@Directive({
  selector: 'table[dtTable]',
  exportAs: 'dtTable',
})
export class DtTableDirective<T = unknown> {
  private readonly host = inject<ElementRef<HTMLTableElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ctor = inject(DATA_TABLE, { optional: true }) ?? DataTableCore;
  private readonly appDefaults = inject(DT_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly styleScope = inject(DT_STYLE_SCOPE, { optional: true }) ?? null;
  private readonly escapeDefaults = inject(DT_ESCAPE_DEFAULTS, { optional: true }) ?? false;

  // ---- Inputs -------------------------------------------------------------------------------
  /** DataTables options object (`Config`). A new reference recreates the table. */
  readonly options = input<Config>({}, { alias: 'dtOptions' });
  /** Row data. A new array reference reconciles via the cheap `clear/rows.add/draw` path. */
  readonly data = input<readonly T[] | undefined>(undefined, { alias: 'dtData' });
  /**
   * Column definitions. A new reference recreates the table. Convenience for `options.columns`.
   * Columns may carry a `dtTemplate` (`DtColumn`) to render the cell with an Angular template.
   */
  readonly columns = input<DtColumn<T>[] | undefined>(undefined, { alias: 'dtColumns' });

  // ---- State (signals, the zoneless-native read channel) -----------------------------------
  private readonly _instance = signal<Api<T> | undefined>(undefined);
  /** The live DataTables `Api` instance, or `undefined` until initialized (SSR / pre-render). */
  readonly instance = this._instance.asReadonly();
  /** `true` once the table has been constructed on the client. */
  readonly ready = computed(() => this._instance() !== undefined);

  private readonly _selected = signal<readonly T[]>([]);
  /** Current selection (row data). Requires the Select extension; otherwise stays empty. */
  readonly selected = this._selected.asReadonly();

  // ---- Outputs ------------------------------------------------------------------------------
  /** Emits the `Api` instance once, immediately after the table is created. */
  readonly initialized = output<Api<T>>({ alias: 'dtInit' });
  /** DataTables `draw` event. */
  readonly draw = output<DtEvent<T>>({ alias: 'dtDraw' });
  /** DataTables `page` event. */
  readonly page = output<DtEvent<T>>({ alias: 'dtPage' });
  /** DataTables `xhr` event (Ajax/server-side data load). */
  readonly xhr = output<DtEvent<T>>({ alias: 'dtXhr' });
  /** Select extension `select` event. */
  readonly select = output<DtSelectEvent<T>>({ alias: 'dtSelect' });
  /** Select extension `deselect` event. */
  readonly deselect = output<DtSelectEvent<T>>({ alias: 'dtDeselect' });
  /** Row click (delegated listener on `<tbody>`), with resolved row data. */
  readonly rowClick = output<DtRowClickEvent<T>>({ alias: 'dtRowClick' });

  // ---- Reconciliation bookkeeping ----------------------------------------------------------
  // Options/columns use a STRUCTURAL key (not reference identity) so that passing an inline object
  // literal does NOT trigger an endless recreate loop. Functions (render/ajax) and TemplateRefs are
  // compared by presence, not identity.
  private lastOptionsKey = '';
  private lastColumnsKey = '';
  private lastData: readonly T[] | undefined;
  private rowClickCleanup?: () => void;

  // Angular cell templates: colIndex -> TemplateRef, plus the live EmbeddedViews currently mounted
  // into cells (rebuilt on every draw, torn down on redraw/destroy to avoid leaks). Keyed by
  // `${rowIndex}:${colIndex}` so a single cell's view can be replaced without a full redraw.
  private cellTemplates = new Map<number, TemplateRef<DtCellContext<T>>>();
  private readonly cellViews = new Map<string, EmbeddedViewRef<DtCellContext<T>>>();

  /** Stable structural key; functions and TemplateRefs collapse to markers so the key serializes. */
  private structuralKey(value: unknown): string {
    try {
      return (
        JSON.stringify(value, (_k, v) => {
          if (typeof v === 'function') return ' fn';
          // TemplateRef / ViewRef instances are circular; collapse to a stable marker.
          if (v && typeof v === 'object' && typeof v.createEmbeddedView === 'function') return ' tpl';
          return v;
        }) ?? ''
      );
    } catch {
      return ''; // circular / non-serializable, treat as unchanged to avoid loops
    }
  }

  constructor() {
    // Create once after the first render, browser only (skipped during SSR).
    afterNextRender(() => this.create());

    // React to input changes after each render commit.
    afterRenderEffect(() => {
      const options = this.options();
      const columns = this.columns();
      const data = this.data();
      const api = untracked(this._instance);
      if (!api) {
        return; // Not yet created; create() will pick up the current values.
      }
      const optionsKey = this.structuralKey(options);
      const columnsKey = this.structuralKey(columns);
      if (optionsKey !== this.lastOptionsKey || columnsKey !== this.lastColumnsKey) {
        this.recreate();
        return;
      }
      if (data !== this.lastData) {
        this.lastData = data;
        this.applyData(api, data);
      }
    });

    this.destroyRef.onDestroy(() => this.destroy());
  }

  /** Build the merged DataTables config from app defaults + inputs. */
  private buildConfig(): Config {
    const config: Config = { ...this.appDefaults, ...this.options() };
    const cols = this.columns();
    if (cols) {
      config.columns = cols;
    }
    const data = this.data();
    if (data !== undefined) {
      config.data = data as unknown[];
    }
    // Pull Angular cell templates off the columns (handles both the dtColumns input and
    // options.columns) and replace them with a display-empty render shim.
    config.columns = this.extractCellTemplates(config.columns as DtColumn<T>[] | undefined);
    if (this.escapeDefaults) {
      // Append a lowest-priority `_all` escaping renderer. DataTables precedence means any
      // explicit `columns[].render` or earlier `columnDefs` entry wins, so only columns WITHOUT a
      // custom renderer are escaped, neutralising DataTables' unsafe HTML-by-default behavior.
      config.columnDefs = [
        ...(config.columnDefs ?? []),
        { targets: '_all', render: escapeHtmlRenderer() },
      ];
    }
    return config;
  }

  /**
   * Pull any `dtTemplate` off the columns into `this.cellTemplates`, returning DataTables-safe
   * column clones. A templated column without its own `render` gets a shim that renders empty for
   * `display` (the Angular template fills the cell) while keeping the raw value for sort/filter/type
   * so ordering and search stay correct.
   */
  private extractCellTemplates(cols: DtColumn<T>[] | undefined): ConfigColumns[] | undefined {
    this.cellTemplates = new Map();
    if (!cols) {
      return undefined;
    }
    return cols.map((col, index) => {
      if (!col.dtTemplate) {
        return col as ConfigColumns;
      }
      this.cellTemplates.set(index, col.dtTemplate);
      const { dtTemplate: _omit, ...rest } = col;
      const shimmed = { ...rest } as ConfigColumns;
      if (shimmed.render === undefined) {
        shimmed.render = (data: unknown, type: string) => (type === 'display' ? '' : data);
      }
      return shimmed;
    });
  }

  /** Construct the DataTables instance and wire events. */
  private create(): void {
    const el = this.host.nativeElement;
    const config = this.buildConfig();
    this.lastOptionsKey = this.structuralKey(this.options());
    this.lastColumnsKey = this.structuralKey(this.columns());
    this.lastData = this.data();

    let api: Api<T>;
    try {
      api = this.zone.runOutsideAngular(() => new this.ctor<T>(el, config));
    } catch (error) {
      // A failed DataTables init (bad option, missing extension, etc.) must not silently swallow
      // the table, surface it and leave the plain markup in place.
      console.error('[ngx-datatables-net] Failed to initialize DataTable:', error);
      return;
    }
    // Adapter-supplied style scope (Tailwind/Material): tag the DataTables container so the
    // adapter's self-contained, scoped stylesheet applies.
    if (this.styleScope) {
      const container = api.table().container() as HTMLElement | null;
      container?.classList.add(this.styleScope);
    }
    this._instance.set(api);
    this.bindEvents(api);
    // The initial draw fired during construction (before the draw handler was attached), so mount
    // any cell templates for the first page now.
    this.renderCellTemplates(api);
    // Emit init inside the zone so template (dtInit) handlers schedule change detection.
    this.zone.run(() => {
      this.initialized.emit(api);
      this.cdr.markForCheck();
    });
  }

  /** Destroy and rebuild, used when options/columns change. */
  private recreate(): void {
    this.teardownInstance();
    this.create();
  }

  /** Cheap data reconciliation: replace rows without a full re-init. */
  private applyData(api: Api<T>, data: readonly T[] | undefined): void {
    this.zone.runOutsideAngular(() => {
      api.clear();
      if (data && data.length) {
        api.rows.add(data as T[]);
      }
      api.draw(false); // false -> keep the current paging position
    });
  }

  private bindEvents(api: Api<T>): void {
    api.on('draw.ngxdt', (event) => {
      // Re-mount cell templates for the page that was just drawn (paging/sort/filter/data change).
      this.renderCellTemplates(api);
      this.emitInZone(() => this.draw.emit({ api, event, args: [] }));
    });
    api.on('page.ngxdt', (event) =>
      this.emitInZone(() => this.page.emit({ api, event, args: [] })),
    );
    api.on('xhr.ngxdt', (event, settings, json) =>
      this.emitInZone(() => this.xhr.emit({ api, event, args: [settings, json] })),
    );
    api.on('select.ngxdt', (event, _dt, itemType, indexes) => {
      const selected = this.readSelection(api);
      this._selected.set(selected);
      this.emitInZone(() =>
        this.select.emit({ api, event, itemType: itemType as string, indexes, selected }),
      );
    });
    api.on('deselect.ngxdt', (event, _dt, itemType, indexes) => {
      const selected = this.readSelection(api);
      this._selected.set(selected);
      this.emitInZone(() =>
        this.deselect.emit({ api, event, itemType: itemType as string, indexes, selected }),
      );
    });
    this.bindRowClick(api);
  }

  /** Delegated row-click listener on the persistent `<tbody>` element. */
  private bindRowClick(api: Api<T>): void {
    const tbody = this.host.nativeElement.querySelector('tbody');
    if (!tbody) {
      return;
    }
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const tr = target?.closest('tr') as HTMLTableRowElement | null;
      if (!tr || !tbody.contains(tr)) {
        return;
      }
      const row = api.row(tr);
      const rowData = row.data() as T | undefined;
      if (rowData === undefined) {
        return; // header/footer or detached row
      }
      this.emitInZone(() =>
        this.rowClick.emit({
          api,
          row: rowData,
          index: row.index() as number,
          element: tr,
          event: event as MouseEvent,
        }),
      );
    };
    tbody.addEventListener('click', handler);
    this.rowClickCleanup = () => tbody.removeEventListener('click', handler);
  }

  /** Read the current Select-extension selection as row data; empty if Select isn't loaded. */
  private readSelection(api: Api<T>): readonly T[] {
    try {
      return (api.rows({ selected: true } as never).data().toArray() as T[]) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * (Re)mount Angular cell templates into the current page's cells. Old views are destroyed first
   * so paging/sort/filter/data redraws never leak EmbeddedViews. No-op when no column uses a
   * template.
   */
  private renderCellTemplates(api: Api<T>): void {
    if (!this.cellTemplates.size) {
      return;
    }
    this.destroyCellViews();
    const appRef = this.appRef;
    const views = this.cellViews;
    this.cellTemplates.forEach((template, colIndex) => {
      const cells = api.cells(null as never, colIndex, { page: 'current' } as never) as unknown as {
        every(
          cb: (this: { node(): HTMLElement | null; data(): unknown; index(): { row: number } }) => void,
        ): void;
      };
      cells.every(function () {
        const cell = this.node();
        if (!cell) {
          return;
        }
        const cellData = this.data();
        const rowIndex = this.index().row;
        const row = api.row(rowIndex).data() as T;
        const view = template.createEmbeddedView({
          $implicit: cellData,
          cellData,
          row,
          rowIndex,
          colIndex,
        });
        appRef.attachView(view);
        view.detectChanges();
        cell.replaceChildren(...(view.rootNodes as Node[]));
        views.set(`${rowIndex}:${colIndex}`, view);
      });
    });
  }

  /** Detach and destroy all mounted cell-template views. */
  private destroyCellViews(): void {
    this.cellViews.forEach((view) => {
      this.appRef.detachView(view);
      view.destroy();
    });
    this.cellViews.clear();
  }

  /**
   * Re-render a single cell's display from its current (possibly just-updated) row data WITHOUT a
   * draw. `[dtEditable]` uses this to commit in `serverSide: true` mode, where `draw()` would
   * trigger a full ajax re-fetch of the page for a one-cell change. Templated columns get a fresh
   * EmbeddedView; plain columns are written the same way DataTables writes display data on draw
   * (the column's `render` pipeline — including the escaping defaults — still applies).
   */
  rerenderCell(rowIndex: number, colIndex: number): void {
    const api = untracked(this._instance);
    if (!api) {
      return;
    }
    const cell = api.cell(rowIndex, colIndex);
    const td = (cell.node() as HTMLElement | null) ?? null;
    if (!td) {
      return; // cell not on the current page
    }
    const template = this.cellTemplates.get(colIndex);
    if (!template) {
      const display = cell.render('display') as unknown;
      if (display instanceof Node) {
        td.replaceChildren(display);
      } else {
        td.innerHTML = display == null ? '' : String(display);
      }
      return;
    }
    const key = `${rowIndex}:${colIndex}`;
    const old = this.cellViews.get(key);
    if (old) {
      this.appRef.detachView(old);
      old.destroy();
      this.cellViews.delete(key);
    }
    const cellData = cell.data();
    const row = api.row(rowIndex).data() as T;
    const view = template.createEmbeddedView({
      $implicit: cellData,
      cellData,
      row,
      rowIndex,
      colIndex,
    });
    this.appRef.attachView(view);
    view.detectChanges();
    td.replaceChildren(...(view.rootNodes as Node[]));
    this.cellViews.set(key, view);
  }

  /** Re-enter Angular for an event emission so zoned and zoneless consumers both update. */
  private emitInZone(fn: () => void): void {
    this.zone.run(() => {
      fn();
      this.cdr.markForCheck();
    });
  }

  private teardownInstance(): void {
    this.destroyCellViews();
    this.rowClickCleanup?.();
    this.rowClickCleanup = undefined;
    const api = untracked(this._instance);
    if (api) {
      this.zone.runOutsideAngular(() => {
        api.off('.ngxdt');
        api.destroy();
      });
    }
    this._instance.set(undefined);
    this._selected.set([]);
  }

  private destroy(): void {
    this.teardownInstance();
  }
}
