import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Editor compatibility (documentation only). DataTables Editor is a COMMERCIAL extension — we never
 * bundle it. This page shows how a license holder wires Editor through the directive's escape-hatch
 * `Api` (via the `dtInit` output), without any special support in ngx-datatables-net.
 */
@Component({
  selector: 'demo-ext-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Editor (compatibility)"
      description="DataTables Editor is a commercial extension, so it is NOT bundled. If you hold a license, wire it through the directive's escape-hatch Api in the (dtInit) handler — no library changes needed. The table below is a plain ngx-datatables-net table for reference."
      [sources]="sources"
    >
      <p class="demo-note">
        Editor requires a paid license from datatables.net. ngx-datatables-net stays compatible by
        exposing the underlying <code>Api</code> — construct Editor against the same table element /
        Api you receive from <code>(dtInit)</code>.
      </p>
      <table dtTable class="display" style="width:100%" [dtData]="data" [dtColumns]="columns">
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
export class ExtEditor {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `// Editor is commercial — install it from your datatables.net account.
import Editor from 'datatables.net-editor';

onInit(api: Api<Employee>) {
  // Wire Editor to the same table via the escape-hatch Api.
  const editor = new Editor({
    table: api.table().node() as HTMLElement,
    fields: [
      { label: 'Name', name: 'name' },
      { label: 'Office', name: 'office' },
      // …
    ],
  });
  // inline editing, create/edit/remove buttons, etc.
}`,
    },
    {
      label: 'template.html',
      lang: 'html',
      code: `<table dtTable [dtData]="data" [dtColumns]="columns"
       (dtInit)="onInit($event)">
  <thead>…</thead>
</table>`,
    },
  ];
}
