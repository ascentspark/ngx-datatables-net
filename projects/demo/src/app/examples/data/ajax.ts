import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Client-side Ajax: DataTables fetches the full dataset once from a URL, then does paging,
 * sorting and searching in the browser. No jQuery at the call site, just the `ajax` option.
 */
@Component({
  selector: 'demo-data-ajax',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Client-side Ajax"
      description="DataTables loads the whole dataset from a URL once (here a 200-row JSON file), then pages/sorts/searches client-side. Configure it purely through the ajax option."
      [sources]="sources"
    >
      <table dtTable class="display" style="width:100%" [dtOptions]="options">
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
export class DataAjax {
  protected readonly options: Config = {
    ajax: 'data/employees.json',
    columns: [
      { data: 'id', title: 'ID' },
      { data: 'name', title: 'Name' },
      { data: 'position', title: 'Position' },
      { data: 'office', title: 'Office' },
      { data: 'age', title: 'Age' },
      { data: 'startDate', title: 'Start date' },
      { data: 'salary', title: 'Salary' },
      { data: 'status', title: 'Status' },
    ],
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `options: Config = {
  ajax: 'data/employees.json',        // string URL, an object, or a function
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'position', title: 'Position' },
    { data: 'office', title: 'Office' },
    { data: 'age', title: 'Age' },
    { data: 'startDate', title: 'Start date' },
    { data: 'salary', title: 'Salary' },
    { data: 'status', title: 'Status' },
  ],
};`,
    },
    {
      label: 'template.html',
      lang: 'html',
      code: `<table dtTable class="display" style="width:100%" [dtOptions]="options">
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
</table>`,
    },
  ];
}
