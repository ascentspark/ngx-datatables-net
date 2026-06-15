import type { Api } from 'datatables.net';

/** Base payload emitted for DataTables lifecycle events. */
export interface DtEvent<T = unknown> {
  /** The live DataTables `Api` instance for the table. */
  readonly api: Api<T>;
  /** The originating DOM event from DataTables. */
  readonly event: Event;
  /** Any extra positional arguments DataTables passed to the event handler. */
  readonly args: readonly unknown[];
}

/** Payload emitted when a row is clicked (delegated listener on `<tbody>`). */
export interface DtRowClickEvent<T = unknown> {
  readonly api: Api<T>;
  /** The row's data object. */
  readonly row: T;
  /** The row's index in the DataTables data set. */
  readonly index: number;
  /** The `<tr>` element that was clicked. */
  readonly element: HTMLTableRowElement;
  /** The originating click event. */
  readonly event: MouseEvent;
}

/** Payload emitted on `select` / `deselect` (requires the Select extension). */
export interface DtSelectEvent<T = unknown> {
  readonly api: Api<T>;
  readonly event: Event;
  /** `'row'`, `'column'` or `'cell'` — the type of items affected. */
  readonly itemType: 'row' | 'column' | 'cell' | string;
  /** Indexes affected by the (de)selection. */
  readonly indexes: unknown;
  /** The full current selection (row data), recomputed after the event. */
  readonly selected: readonly T[];
}
