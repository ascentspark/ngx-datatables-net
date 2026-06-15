import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DtTableDirective, type Api } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import DataTable from 'datatables.net';

/**
 * Community / custom plugin example. DataTables plugins are just code that registers against
 * `DataTable.ext.*` — exactly how packages from `datatables.net-plugins` work. Here we register a
 * custom range-search plugin (filter by minimum age) and drive it from a signal, proving the
 * directive's pass-through model accommodates any plugin with zero library changes.
 */
@Component({
  selector: 'demo-ext-plugin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Community / custom plugin"
      description="A custom range-search plugin registered via DataTable.ext.search — the same mechanism every datatables.net-plugins package uses. Drag the slider to filter by minimum age; the plugin re-filters on draw()."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <label
          >Minimum age: {{ minAge() }}
          <input
            type="range"
            min="22"
            max="62"
            [value]="minAge()"
            (input)="setMinAge(+$any($event.target).value)"
            data-testid="min-age"
          />
        </label>
      </div>
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
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
export class ExtPlugin {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly minAge = signal(22);
  private api?: Api<Employee>;

  constructor() {
    // Register the custom search plugin (column index 4 = Age). Stored so we can unregister it.
    const searchFn = (_settings: unknown, rowData: string[]): boolean => {
      const age = Number(rowData[4]);
      return Number.isNaN(age) ? true : age >= this.minAge();
    };
    afterNextRender(() => {
      DataTable.ext.search.push(searchFn as never);
    });
    this.destroyRef.onDestroy(() => {
      const idx = DataTable.ext.search.indexOf(searchFn as never);
      if (idx >= 0) DataTable.ext.search.splice(idx, 1);
    });
  }

  protected onInit(api: Api<Employee>): void {
    this.api = api;
  }

  protected setMinAge(value: number): void {
    this.minAge.set(value);
    this.api?.draw();
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import DataTable from 'datatables.net';

// A custom range-search plugin — the same API datatables.net-plugins use.
const searchFn = (settings, rowData) =>
  Number(rowData[4]) >= this.minAge();

DataTable.ext.search.push(searchFn);     // register
this.api.draw();                          // re-filter on change
// …remove from DataTable.ext.search on destroy.`,
    },
  ];
}
