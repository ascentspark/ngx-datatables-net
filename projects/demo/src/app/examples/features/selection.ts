import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
// Side-effect import registers the Select extension's behavior with DataTables.
import 'datatables.net-select';

/**
 * Multi-row selection via the Select extension. The directive exposes the live selection as the
 * `selected()` signal (zoneless-native), so the consumer just reads it, no manual event wiring.
 */
@Component({
  selector: 'demo-features-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Selection (two-way)"
      description="Click rows to select (Ctrl/Shift for multi). The directive's selected() signal reflects the current selection reactively, read it directly, no event plumbing."
      [sources]="sources"
    >
      <p class="demo-note" data-testid="selection-summary">
        Selected {{ table().selected().length }} row(s):
        {{ selectedNames() || '-' }}
      </p>

      <table
        dtTable
        #t="dtTable"
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
export class FeaturesSelection {
  protected readonly table = viewChild.required(DtTableDirective<Employee>);
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = { select: { style: 'multi' } };

  protected selectedNames(): string {
    return this.table()
      .selected()
      .map((e) => e.name)
      .join(', ');
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-select'; // register the Select extension

table = viewChild.required(DtTableDirective<Employee>);
options: Config = { select: { style: 'multi' } };

// The directive surfaces the selection as a signal:
selectedNames = () => this.table().selected().map(e => e.name).join(', ');`,
    },
    {
      label: 'template.html',
      lang: 'html',
      code: `<p>Selected {{ table().selected().length }} row(s)</p>
<table dtTable #t="dtTable" class="display" style="width:100%"
       [dtData]="data" [dtColumns]="columns" [dtOptions]="options">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Position</th>
      <th>Office</th>
    </tr>
  </thead>
</table>`,
    },
  ];
}
