import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config, type ConfigColumns } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-fixedheader';
import 'datatables.net-fixedcolumns';

/**
 * FixedHeader keeps the header visible while scrolling the page; FixedColumns pins leading columns
 * while scrolling horizontally. Shown together with a horizontally-scrolling, many-column table.
 */
@Component({
  selector: 'demo-ext-fixed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="FixedHeader & FixedColumns"
      description="FixedHeader floats the header on page scroll; FixedColumns pins the first column during horizontal scroll. Scroll the table sideways to see the pinned ID/Name columns stay put."
      [sources]="sources"
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
            <th>Email</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class ExtFixed {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns: ConfigColumns[] = [
    { title: 'ID', data: 'id' },
    { title: 'Name', data: 'name' },
    { title: 'Position', data: 'position' },
    { title: 'Office', data: 'office' },
    { title: 'Age', data: 'age' },
    { title: 'Start date', data: 'startDate' },
    { title: 'Salary', data: 'salary' },
    { title: 'Status', data: 'status' },
    { title: 'Email', data: 'email' },
  ];
  protected readonly options: Config = {
    scrollX: true,
    fixedHeader: true,
    fixedColumns: { start: 2 },
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-fixedheader';
import 'datatables.net-fixedcolumns';

options: Config = {
  scrollX: true,
  fixedHeader: true,
  fixedColumns: { start: 2 }, // pin first 2 columns
};`,
    },
  ];
}
