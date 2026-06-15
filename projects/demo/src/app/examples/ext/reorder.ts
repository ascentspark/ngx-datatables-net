import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config, type ConfigColumns } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-rowgroup';
import 'datatables.net-colreorder';
import 'datatables.net-rowreorder';

/**
 * RowGroup groups rows by a column (Office) with group headers; ColReorder lets you drag column
 * headers to reorder them; RowReorder enables drag-to-reorder rows on a sequence column.
 */
@Component({
  selector: 'demo-ext-reorder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="RowGroup, ColReorder & RowReorder"
      description="Rows grouped by Office with group headers (RowGroup). Drag a column header to reorder columns (ColReorder). Drag the ⠿ handle to reorder rows (RowReorder)."
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
            <th></th>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Age</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class ExtReorder {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns: ConfigColumns[] = [
    { title: '', data: null as never, orderable: true, className: 'reorder', defaultContent: '⠿' },
    { title: 'Name', data: 'name' },
    { title: 'Position', data: 'position' },
    { title: 'Office', data: 'office' },
    { title: 'Age', data: 'age' },
  ];
  protected readonly options: Config = {
    colReorder: true,
    rowReorder: { selector: 'td.reorder' },
    rowGroup: { dataSrc: 'office' },
    order: [[3, 'asc']],
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-rowgroup';
import 'datatables.net-colreorder';
import 'datatables.net-rowreorder';

options: Config = {
  colReorder: true,
  rowReorder: { selector: 'td.reorder' },
  rowGroup: { dataSrc: 'office' },
  order: [[3, 'asc']],   // group by Office
};`,
    },
  ];
}
