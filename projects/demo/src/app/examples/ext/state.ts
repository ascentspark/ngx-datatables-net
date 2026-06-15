import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Api, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
// stateSave persists to localStorage; the StateRestore extension adds named saved states via Buttons.
import 'datatables.net-buttons';
import 'datatables.net-staterestore';

/**
 * State persistence. `stateSave: true` remembers paging / sort / search across page reloads
 * (localStorage) — change the sort or search, reload the page, and your view is restored. The
 * StateRestore extension layers named, savable states on top via Buttons (see the source note).
 */
@Component({
  selector: 'demo-ext-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="State persistence (stateSave & StateRestore)"
      description="stateSave: true persists the table state (page/sort/search) to localStorage. Sort a column or type a search, then reload — your view is restored. StateRestore adds named saved states (see source)."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <button type="button" class="demo-btn" (click)="reload()" data-testid="reload">
          Reload page
        </button>
        <button
          type="button"
          class="demo-btn demo-btn--ghost"
          (click)="clearState()"
          data-testid="clear-state"
        >
          Clear saved state
        </button>
      </div>
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
        [dtOptions]="options"
        (dtInit)="onInit($event)"
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
export class ExtState {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = { stateSave: true };
  private api?: Api<Employee>;

  protected onInit(api: Api<Employee>): void {
    this.api = api;
  }

  protected reload(): void {
    location.reload();
  }

  protected clearState(): void {
    this.api?.state.clear();
    location.reload();
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `// Persist page/sort/search to localStorage across reloads:
options: Config = { stateSave: true };`,
    },
    {
      label: 'StateRestore (named states)',
      lang: 'ts',
      code: `// StateRestore adds savable, named states via Buttons:
import 'datatables.net-buttons';
import 'datatables.net-staterestore';

options: Config = {
  stateSave: true,
  layout: { topStart: { buttons: ['createState', 'savedStates'] } },
};
// Requires the StateRestore + Buttons CSS to be included.`,
    },
  ];
}
