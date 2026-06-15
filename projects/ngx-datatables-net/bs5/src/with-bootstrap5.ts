import DataTable from 'datatables.net-bs5';
import { DATA_TABLE, type DataTablesFeature } from 'ngx-datatables-net';

/**
 * Use Bootstrap 5 styling.
 *
 * Importing `datatables.net-bs5` registers the Bootstrap 5 styling classes as a side-effect and
 * re-exports the same constructor, which we bind to the `DATA_TABLE` token.
 *
 * Include both Bootstrap's CSS and the DataTables Bootstrap 5 CSS in your application.
 *
 * @example
 * provideDataTables(withBootstrap5())
 */
export function withBootstrap5(): DataTablesFeature {
  return { providers: [{ provide: DATA_TABLE, useValue: DataTable }] };
}
