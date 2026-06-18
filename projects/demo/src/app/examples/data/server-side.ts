import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
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
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Server-side processing"
      description="serverSide: true delegates paging/sorting/filtering to the backend. This demo's ajax is a function simulating a server over 500 rows, only the current page is ever sent to the browser."
      [sources]="sources"
    >
      <table dtTable class="display" style="width:100%" [dtOptions]="options">
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

    <section class="ss-backends">
      <h2 class="ss-backends__title">Server-side backends</h2>
      <p class="ss-backends__lead">
        Server-side processing is a documented JSON contract: DataTables sends paging, ordering and
        search parameters, and your endpoint returns
        <code>draw, recordsTotal, recordsFiltered, data</code>. The shape is the same regardless of
        frontend, so libraries that implement it for other stacks work unchanged with
        <code>ngx-datatables-net</code>:
      </p>
      <ul class="ss-backends__list">
        @for (b of backends; track b.name) {
          <li>
            <a [href]="b.url" target="_blank" rel="noopener">{{ b.name }}</a>
            <span class="ss-backends__stack">{{ b.stack }}</span>
            <span class="ss-backends__desc">{{ b.desc }}</span>
          </li>
        }
      </ul>
      <p class="ss-backends__note">
        No package for your stack? Implement the
        <a href="https://datatables.net/manual/server-side" target="_blank" rel="noopener"
          >server-side protocol</a
        >
        directly, it is just the request/response shape above.
      </p>
    </section>
  `,
  styles: `
    .ss-backends {
      margin-top: 2.5rem;
      padding-top: 1.75rem;
      border-top: 1px solid var(--demo-border);
    }
    .ss-backends__title {
      font-family: var(--font-primary);
      font-size: 1.4rem;
      font-weight: 500;
      margin: 0 0 0.75rem;
    }
    .ss-backends__lead,
    .ss-backends__note {
      color: var(--demo-muted);
      line-height: 1.6;
      max-width: 70ch;
    }
    .ss-backends__list {
      list-style: none;
      padding: 0;
      margin: 1.25rem 0;
    }
    .ss-backends__list li {
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--demo-border);
    }
    .ss-backends__list a {
      color: var(--asc-spark-orange);
      font-weight: 600;
      text-decoration: none;
    }
    .ss-backends__list a:hover {
      text-decoration: underline;
    }
    .ss-backends__stack {
      display: inline-block;
      margin-left: 0.6rem;
      padding: 0.05rem 0.5rem;
      border: 1px solid var(--demo-border);
      border-radius: 999px;
      font-size: 0.78rem;
      color: var(--demo-muted);
    }
    .ss-backends__desc {
      display: block;
      color: var(--demo-muted);
      margin-top: 0.2rem;
    }
  `,
})
export class DataServerSide {
  protected readonly backends = [
    {
      name: 'yajra/laravel-datatables',
      stack: 'Laravel / PHP',
      url: 'https://github.com/yajra/laravel-datatables',
      desc: 'The standard Laravel + Eloquent server-side package.',
    },
    {
      name: 'node-datatable',
      stack: 'Node / Express',
      url: 'https://github.com/jpravetz/node-datatable',
      desc: 'Builds the SQL query for server-side processing; you run it against your DB.',
    },
    {
      name: 'datatables-query',
      stack: 'Node / MongoDB',
      url: 'https://www.npmjs.com/package/datatables-query',
      desc: 'Express + Mongoose/MongoDB server-side processing.',
    },
    {
      name: 'datatables-flask-serverside',
      stack: 'Python / Flask',
      url: 'https://github.com/SergioLlana/datatables-flask-serverside',
      desc: 'A reusable ServerSideTable class for Flask back-ends.',
    },
    {
      name: 'django-ajax-datatable',
      stack: 'Python / Django',
      url: 'https://pypi.org/project/django-ajax-datatable/',
      desc: 'Server-side processing view for Django models (verify current maintenance).',
    },
  ];

  protected readonly options: Config = {
    serverSide: true,
    processing: true,
    columns: FIELDS.map((f) => ({ data: f, title: String(f) })),
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
  ];
}
