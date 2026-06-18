import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import DataTable from 'datatables.net';
import { DtTableDirective, type Api, type ConfigColumns } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Custom range filtering: a numeric min/max salary filter on top of the built-in search. It uses
 * DataTables' `ext.search` (a custom row predicate) plus two signal-bound number inputs, and
 * redraws when either bound changes. The predicate is scoped to this table's node so it is safe
 * even though `ext.search` is global, and it is removed on destroy.
 */
@Component({
  selector: 'demo-features-range-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Custom range filter"
      description="A numeric min/max salary filter via DataTables ext.search, driven by signals. Sorting and the built-in search keep working; the range predicate is scoped to this table and removed on destroy."
      [sources]="sources"
    >
      <div class="demo-toolbar rf-toolbar">
        <label>
          Min salary
          <input
            type="number"
            data-testid="rf-min"
            [value]="min() ?? ''"
            (input)="min.set(toNum($event))"
          />
        </label>
        <label>
          Max salary
          <input
            type="number"
            data-testid="rf-max"
            [value]="max() ?? ''"
            (input)="max.set(toNum($event))"
          />
        </label>
      </div>
      <table
        dtTable
        class="display"
        style="width: 100%"
        [dtData]="data"
        [dtColumns]="columns"
        (dtInit)="onInit($event)"
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Office</th>
            <th>Salary</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
  styles: `
    .rf-toolbar {
      display: flex;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }
    .rf-toolbar label {
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
      color: var(--demo-muted);
      gap: 0.25rem;
    }
    .rf-toolbar input {
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--demo-border);
      border-radius: var(--radius-sm, 6px);
      background: var(--demo-bg, transparent);
      color: var(--demo-text);
      width: 9rem;
    }
  `,
})
export class FeaturesRangeFilter {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly data = EMPLOYEES;
  protected readonly min = signal<number | null>(null);
  protected readonly max = signal<number | null>(null);

  private api?: Api<Employee>;
  private readonly SALARY_COL = 2;

  // ext.search is global, so the predicate must (a) ignore other tables and (b) be removed on
  // destroy. It reads the signals directly, so a redraw applies the current bounds.
  private readonly predicate = (settings: { nTable: HTMLElement }, rowData: string[]): boolean => {
    if (!this.api || settings.nTable !== this.api.table().node()) {
      return true; // not our table
    }
    const salary = Number(String(rowData[this.SALARY_COL]).replace(/[^0-9.-]/g, '')) || 0;
    const min = this.min();
    const max = this.max();
    if (min !== null && salary < min) return false;
    if (max !== null && salary > max) return false;
    return true;
  };

  constructor() {
    DataTable.ext.search.push(this.predicate as never);
    this.destroyRef.onDestroy(() => {
      const i = DataTable.ext.search.indexOf(this.predicate as never);
      if (i >= 0) {
        DataTable.ext.search.splice(i, 1);
      }
    });
    // Redraw whenever a bound changes (no-op until the table exists).
    effect(() => {
      this.min();
      this.max();
      this.api?.draw();
    });
  }

  protected onInit(api: Api<Employee>): void {
    this.api = api;
  }

  protected toNum(event: Event): number | null {
    const value = (event.target as HTMLInputElement).value;
    return value === '' ? null : Number(value);
  }

  protected readonly columns: ConfigColumns[] = [
    { data: 'name', title: 'Name' },
    { data: 'office', title: 'Office' },
    { data: 'salary', title: 'Salary' },
  ];

  protected readonly sources: ExampleSource[] = [
    {
      label: 'range-filter.ts',
      lang: 'ts',
      code: `import { DestroyRef, effect, inject, signal } from '@angular/core';
import DataTable from 'datatables.net';
import { type Api } from 'ngx-datatables-net';

min = signal<number | null>(null);
max = signal<number | null>(null);
private api?: Api;

// A custom row predicate. ext.search is global, so scope it to this table and remove it on destroy.
private predicate = (settings: any, rowData: string[]) => {
  if (settings.nTable !== this.api?.table().node()) return true;
  const salary = Number(String(rowData[2]).replace(/[^0-9.-]/g, '')) || 0;
  if (this.min() !== null && salary < this.min()!) return false;
  if (this.max() !== null && salary > this.max()!) return false;
  return true;
};

constructor() {
  DataTable.ext.search.push(this.predicate);
  inject(DestroyRef).onDestroy(() => {
    const i = DataTable.ext.search.indexOf(this.predicate);
    if (i >= 0) DataTable.ext.search.splice(i, 1);
  });
  effect(() => { this.min(); this.max(); this.api?.draw(); });
}

onInit(api: Api) { this.api = api; }`,
    },
  ];
}
