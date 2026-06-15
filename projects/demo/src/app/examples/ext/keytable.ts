import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-keytable';
import 'datatables.net-autofill';

/**
 * KeyTable adds Excel-like keyboard navigation (arrow keys move a focused cell). AutoFill adds a
 * drag handle to fill a selection across cells. (DateTime — a date picker — pairs with the Editor
 * extension for inline date editing; see the note.)
 */
@Component({
  selector: 'demo-ext-keytable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="KeyTable, AutoFill & DateTime"
      description="Click a cell, then use the arrow keys to move the focus cell (KeyTable). Drag the AutoFill handle from a selected cell to fill across cells. DateTime provides a date picker for inline editing."
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
      <p class="demo-note">
        DateTime (<code>datatables.net-datetime</code>) is a standalone date/time picker most useful
        with the Editor extension for inline date editing — see the Editor (compatibility) page.
      </p>
    </demo-example>
  `,
})
export class ExtKeyTable {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    keys: true,
    autoFill: true,
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-keytable';
import 'datatables.net-autofill';

options: Config = {
  keys: true,      // KeyTable: keyboard cell navigation
  autoFill: true,  // AutoFill: drag-to-fill handle
};`,
    },
  ];
}
