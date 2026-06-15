import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DtTableDirective } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { EMPLOYEES, EMPLOYEE_COLUMNS, makeEmployees, type Employee } from '../../data/employees';

/**
 * Signal-driven reload — no manual `dtTrigger.next()` (the old library's #1 pain point).
 * Assigning a NEW array reference to the `dtData` input reconciles via the cheap
 * `clear → rows.add → draw` path, keeping the current page/sort.
 */
@Component({
  selector: 'demo-data-live-reload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Signal-driven reload"
      description="Reassign the dtData signal to reload — the table reconciles automatically with no manual trigger. This is the modern replacement for the old dtTrigger Subject dance."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <button type="button" class="demo-btn" (click)="shuffle()" data-testid="shuffle">
          Load new data set
        </button>
        <button
          type="button"
          class="demo-btn demo-btn--ghost"
          (click)="addRow()"
          data-testid="add-row"
        >
          Add a row
        </button>
        <span class="demo-sub" style="margin:0">{{ data().length }} rows</span>
      </div>

      <table dtTable class="display" style="width:100%" [dtData]="data()" [dtColumns]="columns">
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
export class DataLiveReload {
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly data = signal<readonly Employee[]>(EMPLOYEES.slice(0, 15));
  private nextSeed = 1;

  protected shuffle(): void {
    // A brand-new array reference triggers the cheap reconcile path.
    this.data.set(makeEmployees(10 + Math.floor(Math.random() * 25)));
  }

  protected addRow(): void {
    const extra = makeEmployees(1)[0];
    extra.id = 1000 + this.nextSeed++;
    extra.name = `New Hire ${this.nextSeed}`;
    this.data.update((rows) => [extra, ...rows]);
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `data = signal<Employee[]>(initialRows);

// Reassign a NEW array reference — the directive reconciles
// via clear() + rows.add() + draw(), keeping page & sort.
reload() {
  this.data.set(fetchedRows);
}
addRow() {
  this.data.update(rows => [newRow, ...rows]);
}`,
    },
    {
      label: 'template.html',
      lang: 'html',
      code: `<table dtTable [dtData]="data()" [dtColumns]="columns">
  <thead>…</thead>
</table>`,
    },
  ];
}
