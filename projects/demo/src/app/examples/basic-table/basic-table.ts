import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DtTableDirective, type Api } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';

/**
 * The simplest possible usage: bind `dtData` + `dtColumns` to `[dtTable]`.
 * Paging, sorting and global search come for free from DataTables.
 */
@Component({
  selector: 'demo-basic-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Basic table"
      description="Bind dtData and dtColumns to the [dtTable] directive — paging, sorting and search are built in. Click a row to see the typed row-click output."
      [sources]="sources"
    >
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data()"
        [dtColumns]="columns"
        (dtInit)="onInit($event)"
        (dtRowClick)="onRowClick($event.row)"
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

      @if (lastClicked(); as row) {
        <p class="demo-note" data-testid="row-click-note">
          Last clicked: <strong>{{ row.name }}</strong> ({{ row.position }})
        </p>
      }
    </demo-example>
  `,
})
export class BasicTable {
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly data = signal<readonly Employee[]>(EMPLOYEES);
  protected readonly lastClicked = signal<Employee | null>(null);

  protected onInit(api: Api<Employee>): void {
    // Escape hatch: full DataTables Api is available for imperative use.
    // eslint-disable-next-line no-console
    console.log(`[basic-table] initialized with ${api.rows().count()} rows`);
  }

  protected onRowClick(row: Employee): void {
    this.lastClicked.set(row);
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import { Component, signal } from '@angular/core';
import { DtTableDirective, type Api } from 'ngx-datatables-net';

@Component({
  selector: 'app-basic',
  imports: [DtTableDirective],
  template: \`
    <table dtTable class="display" style="width:100%"
           [dtData]="data()" [dtColumns]="columns"
           (dtInit)="onInit($event)"
           (dtRowClick)="onRowClick($event.row)">
      <thead><tr><th>ID</th><th>Name</th>…</tr></thead>
    </table>\`,
})
export class BasicComponent {
  columns = EMPLOYEE_COLUMNS;
  data = signal(EMPLOYEES);
  onInit(api: Api<Employee>) { /* escape hatch to the DataTables Api */ }
  onRowClick(row: Employee) { /* typed row data */ }
}`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `import { provideDataTables, withOptions } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

providers: [
  provideZonelessChangeDetection(),
  provideDataTables(withDefaultStyling(), withOptions({ pageLength: 10 })),
]`,
    },
    {
      label: 'install',
      lang: 'bash',
      code: `npm i ngx-datatables-net datatables.net datatables.net-dt
# angular.json styles:
#   "node_modules/datatables.net-dt/css/dataTables.dataTables.css"`,
    },
  ];
}
