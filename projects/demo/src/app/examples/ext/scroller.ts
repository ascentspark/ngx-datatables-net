import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEE_COLUMNS, makeEmployees, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-scroller';

/** A 10,000-row dataset rendered with the Scroller extension (virtual scrolling + deferRender). */
const BIG_DATA: Employee[] = makeEmployees(10_000);

/**
 * Scroller: virtual scrolling for huge datasets. Only the visible rows are in the DOM, so 10,000
 * rows scroll smoothly. `deferRender` + `scroller: true` + a fixed `scrollY` enable it.
 */
@Component({
  selector: 'demo-ext-scroller',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Scroller (virtual scrolling)"
      description="10,000 rows, but only the visible ones are rendered to the DOM. Scroll the table body — Scroller virtualises rows for smooth performance on large datasets."
      [sources]="sources"
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
export class ExtScroller {
  protected readonly data = BIG_DATA;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    deferRender: true,
    scrollY: '400px',
    scroller: true,
    scrollCollapse: true,
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-scroller';

data = makeEmployees(10_000);
options: Config = {
  deferRender: true,
  scrollY: 400,
  scroller: true,
};`,
    },
  ];
}
