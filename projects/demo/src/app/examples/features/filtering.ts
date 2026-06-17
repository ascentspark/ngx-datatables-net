import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DtTableDirective, type Api, type ConfigColumns } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Filtering: the built-in global search, a debounced signal-driven search box, and per-column
 * search inputs wired through the Api.
 *
 * NOTE: the per-column inputs live in a toolbar ABOVE the table, not in `<tfoot>`. DataTables
 * wraps/clones header & footer cell content, which detaches Angular event listeners, so interactive
 * Angular controls must sit outside the table DataTables manages, calling the Api imperatively.
 */
@Component({
  selector: 'demo-features-filtering',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Filtering"
      description="Built-in global search, a debounced signal-driven search box, and per-column search inputs wired to api.column(i).search(). Per-column inputs sit above the table, DataTables rewrites footer/header DOM, so interactive controls belong outside it."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <label
          >Debounced global:
          <input
            type="search"
            placeholder="Type to filter"
            data-testid="debounced-search"
            (input)="onDebounced($any($event.target).value)"
          />
        </label>
      </div>
      <div class="demo-toolbar">
        @for (c of columns; track c.data; let i = $index) {
          <label style="font-size:0.8rem">
            {{ c.title }}:
            <input
              type="search"
              [placeholder]="'Filter ' + c.title"
              [attr.data-testid]="'col-search-' + i"
              (input)="onColumnSearch(i, $any($event.target).value)"
            />
          </label>
        }
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
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class FeaturesFiltering {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns: ConfigColumns[] = [
    { title: 'Name', data: 'name' },
    { title: 'Position', data: 'position' },
    { title: 'Office', data: 'office' },
    { title: 'Status', data: 'status' },
  ];

  private api?: Api<Employee>;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  protected onInit(api: Api<Employee>): void {
    this.api = api;
  }

  protected onDebounced(value: string): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.api?.search(value).draw();
    }, 250);
  }

  protected onColumnSearch(index: number, value: string): void {
    this.api?.column(index).search(value).draw();
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `private api?: Api<Employee>;
onInit(api: Api<Employee>) { this.api = api; }

// Debounced global search
onDebounced(value: string) {
  clearTimeout(this.timer);
  this.timer = setTimeout(() => this.api?.search(value).draw(), 250);
}

// Per-column search, inputs live OUTSIDE the table (DataTables
// rewrites footer/header DOM and would detach Angular listeners).
onColumnSearch(i: number, value: string) {
  this.api?.column(i).search(value).draw();
}`,
    },
  ];
}
