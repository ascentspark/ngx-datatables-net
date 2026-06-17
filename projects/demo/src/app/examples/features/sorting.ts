import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config, type ConfigColumns } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Sorting: a multi-column initial order, a non-orderable column, and orthogonal sort data
 * (salary sorts on its raw number while displaying formatted currency). Shift-click headers to
 * sort by multiple columns.
 */
@Component({
  selector: 'demo-features-sorting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Sorting"
      description="Initial multi-column order (Office asc, then Salary desc). Salary uses orthogonal data, sorted as a number, displayed as currency. Shift-click headers to add secondary sorts."
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
            <th>Name</th>
            <th>Office</th>
            <th>Age</th>
            <th>Salary</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class FeaturesSorting {
  protected readonly data: readonly Employee[] = EMPLOYEES;

  protected readonly columns: ConfigColumns[] = [
    { title: 'Name', data: 'name' },
    { title: 'Office', data: 'office' },
    { title: 'Age', data: 'age' },
    {
      title: 'Salary',
      data: 'salary',
      // Orthogonal data: display formatted, sort/filter on the raw number.
      render: (d: unknown, type: string) =>
        type === 'display'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(Number(d))
          : (d as number),
    },
  ];

  protected readonly options: Config = {
    // Office ascending, then Salary descending.
    order: [
      [1, 'asc'],
      [3, 'desc'],
    ],
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `columns: ConfigColumns[] = [
  { title: 'Name', data: 'name' },
  { title: 'Office', data: 'office' },
  { title: 'Salary', data: 'salary',
    // orthogonal: display currency, sort the raw number
    render: (d, type) => type === 'display' ? formatCurrency(d) : d },
];

options: Config = { order: [[1, 'asc'], [3, 'desc']] };`,
    },
  ];
}
