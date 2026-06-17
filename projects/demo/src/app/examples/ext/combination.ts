import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
// Several extensions composed on one table, all configured through pass-through dtOptions.
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.print';
import 'datatables.net-buttons/js/buttons.colVis';
import 'datatables.net-select';
import 'datatables.net-searchpanes';
import 'datatables.net-responsive';
import 'datatables.net-fixedheader';

/**
 * Combination showcase: Buttons + Select + SearchPanes + Responsive + FixedHeader on a single
 * table, proving extensions compose purely through the pass-through `Config`, with no per-extension
 * code in the directive.
 */
@Component({
  selector: 'demo-ext-combination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Combination showcase"
      description="Buttons (print/colvis) + Select (multi) + SearchPanes + Responsive + FixedHeader, all on one table, composed entirely through dtOptions. This proves the directive forwards the full Config so extensions just work together."
      [sources]="sources"
      docsUrl="https://datatables.net/extensions/"
    >
      <table
        dtTable
        class="display nowrap"
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
export class ExtCombination {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    select: { style: 'multi' },
    responsive: true,
    fixedHeader: true,
    layout: {
      topStart: { buttons: ['print', 'colvis'] },
      top1: 'searchPanes',
    },
    searchPanes: { cascadePanes: true, columns: [3, 7] },
  } as Config;

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-buttons';
import 'datatables.net-select';
import 'datatables.net-searchpanes';
import 'datatables.net-responsive';
import 'datatables.net-fixedheader';

options: Config = {
  select: { style: 'multi' },
  responsive: true,
  fixedHeader: true,
  layout: {
    topStart: { buttons: ['print', 'colvis'] },
    top1: 'searchPanes',
  },
  searchPanes: { cascadePanes: true, columns: [3, 7] },
};`,
    },
  ];
}
