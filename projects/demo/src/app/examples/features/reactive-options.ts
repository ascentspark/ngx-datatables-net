import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Reactive options: toggling feature flags rebuilds the `dtOptions` object (new reference), which
 * the directive detects and uses to recreate the table (the "expensive" reconcile path).
 */
@Component({
  selector: 'demo-features-reactive-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Reactive options"
      description="Toggle paging / ordering / searching / info. Each toggle produces a new dtOptions reference, so the directive recreates the table with the new configuration."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <label
          ><input
            type="checkbox"
            [checked]="paging()"
            (change)="paging.set($any($event.target).checked)"
            data-testid="t-paging"
          />
          paging</label
        >
        <label
          ><input
            type="checkbox"
            [checked]="ordering()"
            (change)="ordering.set($any($event.target).checked)"
            data-testid="t-ordering"
          />
          ordering</label
        >
        <label
          ><input
            type="checkbox"
            [checked]="searching()"
            (change)="searching.set($any($event.target).checked)"
            data-testid="t-searching"
          />
          searching</label
        >
        <label
          ><input
            type="checkbox"
            [checked]="info()"
            (change)="info.set($any($event.target).checked)"
            data-testid="t-info"
          />
          info</label
        >
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
export class FeaturesReactiveOptions {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;

  protected readonly paging = signal(true);
  protected readonly ordering = signal(true);
  protected readonly searching = signal(true);
  protected readonly info = signal(true);

  protected readonly options = computed<Config>(() => ({
    paging: this.paging(),
    ordering: this.ordering(),
    searching: this.searching(),
    info: this.info(),
  }));

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `paging = signal(true);
ordering = signal(true);
searching = signal(true);

// New reference on any toggle → directive recreates the table.
options = computed<Config>(() => ({
  paging: this.paging(),
  ordering: this.ordering(),
  searching: this.searching(),
}));`,
    },
  ];
}
