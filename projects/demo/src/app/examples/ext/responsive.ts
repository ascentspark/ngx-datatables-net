import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import 'datatables.net-responsive';

/**
 * Responsive extension: columns that don't fit collapse into an expandable child row. The table is
 * constrained to a narrow width here so the collapse behavior is visible, click the + to expand.
 */
@Component({
  selector: 'demo-ext-responsive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Responsive extension"
      description="With responsive: true, columns that don't fit collapse into an expandable child row (click the + control). The table below is constrained to 560px so the collapse is visible on a wide screen."
      [sources]="sources"
      docsUrl="https://datatables.net/extensions/responsive/"
    >
      <div
        style="max-width:560px;border:1px dashed var(--demo-border);padding:0.5rem;border-radius:8px"
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
      </div>
    </demo-example>
  `,
})
export class ExtResponsive {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = { responsive: true };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import 'datatables.net-responsive';
options: Config = { responsive: true };`,
    },
  ];
}
