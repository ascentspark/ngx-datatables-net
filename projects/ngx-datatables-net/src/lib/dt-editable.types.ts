import type { TemplateRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Api } from 'datatables.net';

/**
 * Edit-in-place public contract for `[dtEditable]`.
 *
 * A column opts into editing by carrying an {@link DtEditorConfig} on its `editor` field (see
 * `DtColumn` in `dt-cell-template.ts`). A column with no `editor` is read-only. Double-clicking an
 * editable cell opens the configured editor; committing writes back through the DataTables `Api`
 * (`cell().data()`), keeping sort/filter/search correct.
 *
 * SECURITY: editor controls are rendered through Angular templates (bindings, never `innerHTML`),
 * and the committed value flows back to the cell's normal display path, which still runs through
 * the library's escaping/sanitising renderers. No edit path introduces an HTML sink.
 */

/** A single option for `select` / `multiselect` editors. */
export interface DtEditorOption {
  /** The underlying value written to the cell when this option is chosen. */
  readonly value: unknown;
  /** Human-readable label shown in the control. */
  readonly label: string;
  /** When true the option is shown but cannot be picked. */
  readonly disabled?: boolean;
}

/**
 * Options for a choice editor: either a static list or a function resolved per cell (so the choice
 * set can depend on the row being edited).
 */
export type DtEditorOptions<T = unknown> =
  | readonly DtEditorOption[]
  | ((ctx: DtEditContext<T>) => readonly DtEditorOption[]);

/**
 * Context describing the cell being edited. Passed to `disabled`, option providers, and carried by
 * every edit event. `value` is always the cell's CURRENT underlying value (pre-edit).
 */
export interface DtEditContext<T = unknown> {
  /** The live DataTables `Api` for the table. */
  readonly api: Api<T>;
  /** The full row object being edited. */
  readonly row: T;
  /** Row index in the DataTables data set. */
  readonly rowIndex: number;
  /** Column index (DataTables column order). */
  readonly colIndex: number;
  /** The column's `data` key (e.g. `'name'`), or `null` for a `data: null` column. */
  readonly columnKey: string | number | null;
  /** The cell's current underlying value (what `cell().data()` returns). */
  readonly value: unknown;
  /** The `<td>` element hosting the cell. */
  readonly cell: HTMLTableCellElement;
}

/** Payload for a committed edit: the old and new underlying values plus the cell context. */
export interface DtCellEditCommit<T = unknown> extends DtEditContext<T> {
  /** Value before the edit (same as `value`). */
  readonly oldValue: unknown;
  /** Value the user committed. */
  readonly newValue: unknown;
}

/** Why an in-progress edit was cancelled without committing. */
export type DtCellEditCancelReason =
  | 'escape' // user pressed Escape
  | 'blur' // editor lost focus (and blur-cancels for this control)
  | 'unchanged' // committed value equals the original — nothing written
  | 'invalid' // failed `validate` and the user dismissed
  | 'programmatic'; // closed by the directive (e.g. a redraw) or `cancel()` API

/** Payload emitted when an edit is cancelled. */
export interface DtCellEditCancel<T = unknown> extends DtEditContext<T> {
  readonly reason: DtCellEditCancelReason;
}

/** Payload emitted when an async save handler rejects; the cell has been reverted to `oldValue`. */
export interface DtCellEditError<T = unknown> extends DtCellEditCommit<T> {
  /** The rejection reason / thrown error from the save handler. */
  readonly error: unknown;
}

/**
 * Optional save handler bound via the `dtSave` input. Runs on commit BEFORE the cell is written
 * (pessimistic). Return:
 * - `void` / a resolved value — synchronous success, the cell is written immediately;
 * - a `Promise` / `Observable` — the cell shows a busy state until it settles, then is written on
 *   success or left unchanged on failure (a `dtCellEditError` is emitted).
 *
 * Throwing (or rejecting) reverts the edit. This is the async contract Angular `output()`s cannot
 * express (an output's return value is discarded), which is why saving uses a callback input.
 */
export type DtCellSaveHandler<T = unknown> = (
  commit: DtCellEditCommit<T>,
) => void | unknown | Promise<unknown> | Observable<unknown>;

/**
 * Context handed to a `custom` editor's `<ng-template>`. In the template these are the `let-` vars,
 * plus `commit` / `cancel` callbacks the custom control invokes to report its result:
 *
 * ```html
 * <ng-template #myEditor let-value let-commit="commit" let-cancel="cancel">
 *   <my-fancy-picker [value]="value" (picked)="commit($event)" (dismissed)="cancel()" />
 * </ng-template>
 * ```
 */
export interface DtEditorTemplateContext<T = unknown> {
  /** Current underlying value (alias of `value`). */
  $implicit: unknown;
  /** Current underlying value. */
  value: unknown;
  /** The full row being edited. */
  row: T;
  /** Row index in the data set. */
  rowIndex: number;
  /** Column index. */
  colIndex: number;
  /** Commit the edit with a new value (runs validation + save). */
  commit: (value: unknown) => void;
  /** Abandon the edit, restoring the cell. */
  cancel: () => void;
}

/** Fields shared by every editor variant. */
export interface DtEditorBase<T = unknown> {
  /** Accessible label for the generated control (falls back to the column title). */
  readonly ariaLabel?: string;
  /**
   * Per-cell guard. Return `true` to make a specific cell non-editable even though the column has
   * an editor (e.g. terminated employees). Omit to keep every cell in the column editable.
   */
  readonly disabled?: (ctx: DtEditContext<T>) => boolean;
  /**
   * Synchronous validation run on the candidate value before commit. Return an error message to
   * block the commit (shown inline), or `null`/`undefined` to allow it.
   */
  readonly validate?: (value: unknown, row: T) => string | null | undefined;
}

/** Single-line text editor. */
export interface DtTextEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'text';
  readonly placeholder?: string;
  readonly maxLength?: number;
}

/** Multi-line text editor. */
export interface DtTextareaEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'textarea';
  readonly placeholder?: string;
  readonly rows?: number;
  readonly maxLength?: number;
}

/** Numeric editor backed by `<input type="number">`. Commits a `number` (or `null` when blank). */
export interface DtNumberEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
}

/** Date editor backed by `<input type="date">`. Commits an ISO `yyyy-mm-dd` string (or `null`). */
export interface DtDateEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'date';
  /** ISO `yyyy-mm-dd` lower bound. */
  readonly min?: string;
  /** ISO `yyyy-mm-dd` upper bound. */
  readonly max?: string;
}

/** Boolean toggle editor. Commits a `boolean`. */
export interface DtCheckboxEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'checkbox';
}

/** Single-choice editor backed by `<select>`. Commits the chosen option's `value`. */
export interface DtSelectEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'select';
  readonly options: DtEditorOptions<T>;
  /** Optional placeholder shown as a leading empty option. */
  readonly placeholder?: string;
}

/**
 * Multi-choice editor backed by `<select multiple>`. Commits an ARRAY of the chosen option values.
 * The column's display/sort value is the array joined by {@link separator} (default `', '`).
 */
export interface DtMultiSelectEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'multiselect';
  readonly options: DtEditorOptions<T>;
  /** Separator used to render the chosen array as text. Defaults to `', '`. */
  readonly separator?: string;
}

/** Escape-hatch editor: the consumer supplies any Angular control via a `<ng-template>`. */
export interface DtCustomEditor<T = unknown> extends DtEditorBase<T> {
  readonly type: 'custom';
  readonly template: TemplateRef<DtEditorTemplateContext<T>>;
}

/** Discriminated union of every supported in-place editor. */
export type DtEditorConfig<T = unknown> =
  | DtTextEditor<T>
  | DtTextareaEditor<T>
  | DtNumberEditor<T>
  | DtDateEditor<T>
  | DtCheckboxEditor<T>
  | DtSelectEditor<T>
  | DtMultiSelectEditor<T>
  | DtCustomEditor<T>;
