import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';

type PagingType = 'simple' | 'simple_numbers' | 'full' | 'full_numbers' | 'numbers';

/**
 * Pagination variants: pagingType, pageLength and lengthMenu. Changing pagingType rebuilds the
 * options object (new reference) so the directive recreates the table with the new chrome.
 */
@Component({
  selector: 'demo-features-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Pagination"
      description="Switch pagingType, pageLength and lengthMenu. Reassigning the dtOptions reference recreates the table with the chosen pagination control."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <label
          >pagingType:
          <select (change)="setType($any($event.target).value)" data-testid="paging-type">
            @for (t of types; track t) {
              <option [value]="t" [selected]="t === type()">{{ t }}</option>
            }
          </select>
        </label>
        <label
          >pageLength:
          <select (change)="setLength(+$any($event.target).value)" data-testid="page-length">
            @for (n of [5, 10, 25]; track n) {
              <option [value]="n" [selected]="n === length()">{{ n }}</option>
            }
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
export class FeaturesPagination {
  protected readonly types: PagingType[] = [
    'simple',
    'simple_numbers',
    'full',
    'full_numbers',
    'numbers',
  ];
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly type = signal<PagingType>('full_numbers');
  protected readonly length = signal(10);

  // New object reference whenever type/length change → directive recreates.
  protected readonly options = computed<Config>(() => ({
    pagingType: this.type(),
    pageLength: this.length(),
    lengthMenu: [5, 10, 25, 50],
  }));

  protected setType(t: PagingType): void {
    this.type.set(t);
  }
  protected setLength(n: number): void {
    this.length.set(n);
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `type = signal<PagingType>('full_numbers');
length = signal(10);

// computed → new reference recreates the table with new chrome
options = computed<Config>(() => ({
  pagingType: this.type(),
  pageLength: this.length(),
  lengthMenu: [5, 10, 25, 50],
}));`,
    },
  ];
}
