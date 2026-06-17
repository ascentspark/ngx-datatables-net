import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-select';

type SelectItems = 'row' | 'column' | 'cell';

/** Select extension: switch between row / column / cell selection styles at runtime. */
@Component({
  selector: 'demo-ext-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Select extension"
      description="Row, column or cell selection. Switch the selection granularity, each change rebuilds the options so the directive recreates the table with the new select config."
      [sources]="sources"
      docsUrl="https://datatables.net/extensions/select/"
    >
      <div class="demo-toolbar">
        <label
          >Select items:
          <select (change)="items.set($any($event.target).value)" data-testid="select-items">
            <option value="row">row</option>
            <option value="column">column</option>
            <option value="cell">cell</option>
          </select>
        </label>
      </div>
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
        [dtOptions]="options()"
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
export class ExtSelect {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly items = signal<SelectItems>('row');
  // computed → stable reference (recomputed only when items() changes). A plain method returning a
  // new object every call would make the directive recreate the table on every change-detection
  // pass (infinite loop), so memoise it.
  protected readonly options = computed<Config>(() => ({
    select: { style: 'multi', items: this.items() },
  }));

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-select';

options = () => ({ select: { style: 'multi', items: this.items() } });
// items: 'row' | 'column' | 'cell'`,
    },
  ];
}
