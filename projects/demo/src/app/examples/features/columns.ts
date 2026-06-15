import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { DtTableDirective, type ConfigColumns } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { EMPLOYEES, type Employee } from '../../data/employees';

/**
 * Column definitions + runtime visibility toggling via the escape-hatch `Api`.
 * Some columns are non-orderable / non-searchable to show per-column control.
 */
@Component({
  selector: 'demo-features-columns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Columns & visibility"
      description="Configure columns (titles, ordering, searchable flags) and toggle visibility at runtime through the DataTables Api exposed by the directive."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        @for (c of columns; track c.data; let i = $index) {
          <button
            type="button"
            class="demo-btn demo-btn--ghost"
            [attr.data-testid]="'toggle-' + c.data"
            (click)="toggle(i)"
          >
            Toggle {{ c.title }}
          </button>
        }
      </div>

      <table
        dtTable
        #t="dtTable"
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
      >
        <thead>
          <tr>
            @for (c of columns; track c.data) {
              <th>{{ c.title }}</th>
            }
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class FeaturesColumns {
  protected readonly table = viewChild.required(DtTableDirective);
  protected readonly data: readonly Employee[] = EMPLOYEES;

  protected readonly columns: ConfigColumns[] = [
    { title: 'ID', data: 'id', searchable: false },
    { title: 'Name', data: 'name' },
    { title: 'Position', data: 'position' },
    { title: 'Office', data: 'office' },
    { title: 'Email', data: 'email', orderable: false },
  ];

  protected toggle(index: number): void {
    const api = this.table().instance();
    if (!api) return;
    const col = api.column(index);
    col.visible(!col.visible());
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `columns: ConfigColumns[] = [
  { title: 'ID', data: 'id', searchable: false },
  { title: 'Name', data: 'name' },
  { title: 'Email', data: 'email', orderable: false },
];

// #t="dtTable" exposes the directive; .instance() is the Api.
table = viewChild.required(DtTableDirective);
toggle(i: number) {
  const col = this.table().instance()!.column(i);
  col.visible(!col.visible());
}`,
    },
  ];
}
