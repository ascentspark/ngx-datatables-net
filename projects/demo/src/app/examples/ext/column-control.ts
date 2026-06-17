import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
// ColumnControl adds per-column header controls (ordering buttons + search dropdowns).
import 'datatables.net-columncontrol';

/**
 * ColumnControl extension: rich per-column header controls. Here each header gets an order control
 * plus a search dropdown, configured purely through the pass-through `columnControl` option.
 */
@Component({
  selector: 'demo-ext-column-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="ColumnControl"
      description="Per-column header controls, an order toggle plus a search dropdown in every column header. Click a column's ▾ to filter that column. Configured via the columnControl option (pass-through, no library code)."
      [sources]="sources"
      docsUrl="https://datatables.net/extensions/columncontrol/"
    >
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
        [dtOptions]="options"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Age</th>
            <th>Start date</th>
            <th>Salary</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class ExtColumnControl {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    ordering: { indicators: false },
    // Each header shows an order control and a dropdown containing a per-column search box.
    columnControl: ['order', ['searchDropdown']],
  } as Config;

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-columncontrol';

options: Config = {
  ordering: { indicators: false },
  columnControl: ['order', ['searchDropdown']],
};`,
    },
    {
      label: 'install',
      lang: 'bash',
      code: `npm i datatables.net-columncontrol datatables.net-columncontrol-dt
# angular.json styles:
#   "node_modules/datatables.net-columncontrol-dt/css/columnControl.dataTables.css"`,
    },
  ];
}
