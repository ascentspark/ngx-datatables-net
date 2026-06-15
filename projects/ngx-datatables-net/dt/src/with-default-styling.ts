import DataTable from 'datatables.net-dt';
import { DATA_TABLE, type DataTablesFeature } from 'ngx-datatables-net';

/**
 * Use DataTables' default ("dt") styling.
 *
 * Importing `datatables.net-dt` registers the default styling classes as a side-effect and
 * re-exports the same constructor, which we bind to the `DATA_TABLE` token.
 *
 * Remember to also include the stylesheet in your application, e.g. in `angular.json`:
 * `"node_modules/datatables.net-dt/css/dataTables.dataTables.css"`.
 *
 * @example
 * provideDataTables(withDefaultStyling())
 */
export function withDefaultStyling(): DataTablesFeature {
  return { providers: [{ provide: DATA_TABLE, useValue: DataTable }] };
}
