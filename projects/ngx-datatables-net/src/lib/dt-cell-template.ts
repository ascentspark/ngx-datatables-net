import type { TemplateRef } from '@angular/core';
import type { ConfigColumns } from 'datatables.net';

/**
 * Context handed to a cell's Angular template. In the `<ng-template>` these are the `let-` vars:
 *
 * ```html
 * <ng-template #cell let-value let-row="row">
 *   <a [routerLink]="['/user', row.id]">{{ value | titlecase }}</a>
 * </ng-template>
 * ```
 *
 * - `$implicit` / `cellData`, the column's data value (what `columns.data` points at).
 * - `row`, the full row object.
 * - `rowIndex` / `colIndex`, the DataTables row/column indices.
 */
export interface DtCellContext<T = unknown> {
  $implicit: unknown;
  cellData: unknown;
  row: T;
  rowIndex: number;
  colIndex: number;
}

/**
 * A DataTables column that can render its cell with an Angular `<ng-template>` instead of an HTML
 * string. Set `dtTemplate` to a `TemplateRef` and the cell renders with full Angular context:
 * pipes, `routerLink`, child components, and event bindings all work, because the template keeps
 * the injector and change-detection of the component that declared it.
 *
 * Sorting, filtering and global search still operate on the column's underlying `data` (the
 * template only controls what is displayed), so ordering and search stay correct.
 *
 * ```ts
 * columns: DtColumn<User>[] = [
 *   { data: 'name', title: 'Name', dtTemplate: this.nameTpl },
 *   { data: null, title: '', orderable: false, dtTemplate: this.actionsTpl },
 * ];
 * ```
 */
export type DtColumn<T = unknown> = ConfigColumns & {
  dtTemplate?: TemplateRef<DtCellContext<T>>;
};
