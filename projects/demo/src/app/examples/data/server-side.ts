import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DtEditableDirective,
  DtTableDirective,
  type Config,
  type DtCellSaveHandler,
  type DtColumn,
} from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { makeEmployees, type Employee } from '../../data/employees';

/** A 500-row dataset that stands in for a database for the server-side simulation. */
const DATASET: Employee[] = makeEmployees(500);
const FIELDS: (keyof Employee)[] = [
  'id',
  'name',
  'position',
  'office',
  'age',
  'startDate',
  'salary',
  'status',
];

/**
 * Server-side processing: paging, ordering and filtering are delegated to "the server". Here the
 * `ajax` option is a FUNCTION that simulates a backend over a 500-row dataset (so the demo needs no
 * real server), returning the DataTables server-side response shape.
 */
@Component({
  selector: 'demo-data-server-side',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, DtEditableDirective, ExampleCard],
  template: `
    <demo-example
      title="Server-side processing"
      description="serverSide: true delegates paging/sorting/filtering to the backend. This demo's ajax is a function simulating a server over 500 rows, only the current page is ever sent to the browser. The Name column is editable in place (double-click): the save handler persists to the simulated server, and the commit re-renders only that cell — no page re-fetch."
      [sources]="sources"
    >
      <table
        dtTable
        dtEditable
        class="display"
        style="width:100%"
        [dtOptions]="options"
        [dtSave]="save"
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
export class DataServerSide {
  protected readonly options: Config = {
    serverSide: true,
    processing: true,
    columns: FIELDS.map<DtColumn<Employee>>((f) => ({
      data: f,
      title: String(f),
      // Editing works in serverSide mode: the commit re-renders only the edited cell instead of
      // drawing (a draw would re-fetch the whole page over ajax).
      ...(f === 'name' ? { editor: { type: 'text' as const } } : {}),
    })),
    // The ajax FUNCTION form, no jQuery. In a real app this would be an HttpClient call.
    ajax: (request: any, callback: (res: any) => void) => {
      const { start = 0, length = 10, search, order } = request;
      const term = (search?.value ?? '').toLowerCase();

      let rows = DATASET;
      if (term) {
        rows = rows.filter((r) => FIELDS.some((f) => String(r[f]).toLowerCase().includes(term)));
      }
      if (order?.length) {
        const { column, dir } = order[0];
        const field = FIELDS[column];
        const sign = dir === 'desc' ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          return (av < bv ? -1 : av > bv ? 1 : 0) * sign;
        });
      }

      const page = rows.slice(start, start + length);
      callback({
        draw: request.draw,
        recordsTotal: DATASET.length,
        recordsFiltered: rows.length,
        data: page,
      });
    },
  };

  /**
   * Pessimistic save for the inline edit: "PATCH" the simulated server before the cell is written.
   * The delay makes the busy state visible; a real app would call its API here.
   */
  protected readonly save: DtCellSaveHandler<Employee> = (commit) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        const row = DATASET.find((r) => r.id === commit.row.id);
        if (row && commit.columnKey != null) {
          (row as unknown as Record<string, unknown>)[String(commit.columnKey)] = commit.newValue;
        }
        resolve();
      }, 400);
    });

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Config } from 'ngx-datatables-net';

interface ServerResponse {
  recordsTotal: number;
  recordsFiltered: number;
  data: unknown[];
}

private http = inject(HttpClient);

options: Config = {
  serverSide: true,
  processing: true,
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'position', title: 'Position' },
    { data: 'office', title: 'Office' },
  ],
  // DataTables puts paging, sort and search into \`request\`. Post it to your
  // API and call back with the response. Only the current page is fetched.
  ajax: (request, callback) => {
    this.http.post<ServerResponse>('/api/employees', request).subscribe((res) =>
      callback({
        draw: request.draw,
        recordsTotal: res.recordsTotal,
        recordsFiltered: res.recordsFiltered,
        data: res.data,
      }),
    );
  },
};`,
    },
    {
      label: 'inline-editing.ts',
      lang: 'ts',
      code: `// Editing works with serverSide: true. Add dtEditable + a save handler that
// PATCHes your API; the commit re-renders only the edited cell (no page
// re-fetch), and the next natural draw (page/sort/filter) re-fetches and shows
// the server's persisted value.
//
// <table dtTable dtEditable [dtOptions]="options" [dtSave]="save">

columns: [
  { data: 'name', title: 'Name', editor: { type: 'text' } },
  // ...
],

save: DtCellSaveHandler<Employee> = (commit) =>
  firstValueFrom(
    this.http.patch(\`/api/employees/\${commit.row.id}\`, {
      [String(commit.columnKey)]: commit.newValue,
    }),
  );`,
    },
  ];
}
