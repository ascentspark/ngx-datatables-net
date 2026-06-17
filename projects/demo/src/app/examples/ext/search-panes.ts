import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
// SearchPanes depends on the Select extension; SearchBuilder depends on DateTime.
import 'datatables.net-select';
import 'datatables.net-datetime';
import 'datatables.net-searchpanes';
import 'datatables.net-searchbuilder';

/**
 * SearchPanes shows faceted filter panes (counts per value, click to filter). SearchBuilder adds a
 * visual query builder for complex AND/OR conditions. Both are placed via the `layout` option.
 */
@Component({
  selector: 'demo-ext-search-panes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="SearchPanes & SearchBuilder"
      description="Faceted filtering: SearchPanes shows clickable value panes (with counts) for Office and Status; SearchBuilder lets you compose complex conditions. Both are positioned through the layout option."
      [sources]="sources"
      docsUrl="https://datatables.net/extensions/searchpanes/"
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
export class ExtSearchPanes {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    layout: {
      top: 'searchBuilder',
      top1: 'searchPanes',
    },
    searchPanes: { cascadePanes: true, columns: [2, 3, 7] },
  } as Config;

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-select';       // SearchPanes needs Select
import 'datatables.net-searchpanes';
import 'datatables.net-searchbuilder';

options: Config = {
  layout: { top: 'searchBuilder', top1: 'searchPanes' },
  searchPanes: { cascadePanes: true, columns: [2, 3, 7] },
};`,
    },
  ];
}
