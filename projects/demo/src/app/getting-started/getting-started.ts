import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Landing / getting-started page. Written for someone who is new to both Angular and DataTables:
 * each step is copy-paste, in order, with a one-line explanation of what it does and where it goes.
 */
@Component({
  selector: 'demo-getting-started',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="gs-hero">
      <h1 class="gs-title">ngx-datatables-net</h1>
      <p class="gs-tagline">
        Modern Angular wrapper for
        <a href="https://datatables.net" target="_blank" rel="noopener">DataTables.net</a>
      </p>
      <p class="gs-lead">
        DataTables.net is a popular JavaScript library that turns a plain HTML table into one with
        sorting, search and pagination. This package lets you use it in an Angular app: you add the
        <code>dtTable</code> directive to a <code>&lt;table&gt;</code> and pass your data in. No
        jQuery to write, no setup beyond the steps below.
      </p>
      <p class="gs-maintainer">
        Angular wrapper maintained by
        <a href="https://ascentspark.com" target="_blank" rel="noopener">Ascentspark</a>.
      </p>
    </section>

    <section class="gs-steps">
      <h2 class="gs-h2">Get started in five steps</h2>

      <p class="gs-note">
        New to Angular? First create an app:
        <code>npm install -g &#64;angular/cli</code> then <code>ng new my-app</code>. Run every
        command below inside that project folder.
      </p>

      <ol class="gs-list">
        <li class="gs-step">
          <div class="gs-step__num">1</div>
          <div class="gs-step__body">
            <h3 class="gs-step__title">Install the packages</h3>
            <p>
              <code>ngx-datatables-net</code> is the wrapper. <code>datatables.net</code> is the
              underlying library, and <code>datatables.net-dt</code> is its default theme.
            </p>
            <p>
              Pick the line that matches your Angular version. The package API is the same across all
              three, so everything below works unchanged.
            </p>
            <div class="gs-vers" role="group" aria-label="Angular version">
              @for (v of ngVersions; track v) {
                <button
                  type="button"
                  class="gs-vers__btn"
                  [class.gs-vers__btn--active]="ngVersion() === v"
                  (click)="ngVersion.set(v)"
                >
                  Angular {{ v }}
                </button>
              }
            </div>
            <pre
              class="gs-code"
            ><code>npm install ngx-datatables-net&#64;{{ ngVersion() }} datatables.net datatables.net-dt</code></pre>
          </div>
        </li>

        <li class="gs-step">
          <div class="gs-step__num">2</div>
          <div class="gs-step__body">
            <h3 class="gs-step__title">Add the table stylesheet</h3>
            <p>
              Open <code>angular.json</code>, find your app's <code>"styles"</code> array, and add
              the DataTables theme so the table looks right.
            </p>
            <pre class="gs-code"><code>"styles": [
  "node_modules/datatables.net-dt/css/dataTables.dataTables.css",
  "src/styles.scss"
]</code></pre>
          </div>
        </li>

        <li class="gs-step">
          <div class="gs-step__num">3</div>
          <div class="gs-step__body">
            <h3 class="gs-step__title">Register it in your app</h3>
            <p>
              In <code>src/app/app.config.ts</code>, add the two providers below to the
              <code>providers</code> array. <code>withSafeDefaults()</code> escapes cell text so
              user data cannot inject HTML.
            </p>
            <pre
              class="gs-code"
            ><code>import {{ '{' }} ApplicationConfig, provideZonelessChangeDetection {{ '}' }} from '&#64;angular/core';
import {{ '{' }} provideDataTables, withSafeDefaults {{ '}' }} from 'ngx-datatables-net';
import {{ '{' }} withDefaultStyling {{ '}' }} from 'ngx-datatables-net/dt';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideZonelessChangeDetection(),
    provideDataTables(withDefaultStyling(), withSafeDefaults()),
  ],
{{ '}' }};</code></pre>
          </div>
        </li>

        <li class="gs-step">
          <div class="gs-step__num">4</div>
          <div class="gs-step__body">
            <h3 class="gs-step__title">Add a table to a component</h3>
            <p>
              Import <code>DtTableDirective</code>, put your rows in a <code>signal</code>, describe
              the columns, and add <code>dtTable</code> to a <code>&lt;table&gt;</code>.
            </p>
            <pre
              class="gs-code"
            ><code>import {{ '{' }} Component, signal {{ '}' }} from '&#64;angular/core';
import {{ '{' }} DtTableDirective, type ConfigColumns {{ '}' }} from 'ngx-datatables-net';

&#64;Component({{ '{' }}
  selector: 'app-people',
  imports: [DtTableDirective],
  template: \`
    &lt;table dtTable [dtData]="people()" [dtColumns]="columns"
           class="display" style="width:100%"&gt;
      &lt;thead&gt;
        &lt;tr&gt;&lt;th&gt;Name&lt;/th&gt;&lt;th&gt;Role&lt;/th&gt;&lt;th&gt;City&lt;/th&gt;&lt;/tr&gt;
      &lt;/thead&gt;
    &lt;/table&gt;
  \`,
{{ '}' }})
export class PeopleComponent {{ '{' }}
  people = signal([
    {{ '{' }} name: 'Ada Lovelace', role: 'Engineer', city: 'London' {{ '}' }},
    {{ '{' }} name: 'Linus Torvalds', role: 'Maintainer', city: 'Portland' {{ '}' }},
  ]);
  columns: ConfigColumns[] = [
    {{ '{' }} data: 'name', title: 'Name' {{ '}' }},
    {{ '{' }} data: 'role', title: 'Role' {{ '}' }},
    {{ '{' }} data: 'city', title: 'City' {{ '}' }},
  ];
{{ '}' }}</code></pre>
          </div>
        </li>

        <li class="gs-step">
          <div class="gs-step__num">5</div>
          <div class="gs-step__body">
            <h3 class="gs-step__title">Run it</h3>
            <p>
              Start the app with <code>ng serve</code>. You now have a sortable, searchable, paged
              table. To load different data later, just set a new array on the <code>people</code>
              signal. There is no manual refresh step.
            </p>
          </div>
        </li>
      </ol>

      <div class="gs-next">
        <a class="demo-btn" routerLink="/basic">See the live basic table</a>
        <span class="gs-next__hint">
          or browse the examples in the sidebar for data sources, features, styling and every
          DataTables extension.
        </span>
      </div>
    </section>

    <section class="gs-faq">
      <h2 class="gs-h2">Frequently asked questions</h2>
      @for (item of faqs; track item.q) {
        <div class="gs-faq__item">
          <h3 class="gs-faq__q">{{ item.q }}</h3>
          <p class="gs-faq__a">{{ item.a }}</p>
        </div>
      }
    </section>
  `,
  styleUrl: './getting-started.scss',
})
export class GettingStarted {
  protected readonly ngVersions = ['22', '21', '20'] as const;
  protected readonly ngVersion = signal<'22' | '21' | '20'>('22');

  protected readonly faqs = [
    {
      q: 'Does ngx-datatables-net require jQuery?',
      a: 'You never write jQuery. The library uses DataTables’ non-jQuery API. DataTables itself still uses jQuery internally, so it sits in your dependency tree as a transitive dependency of datatables.net, but it never appears in your own code.',
    },
    {
      q: 'Which Angular versions are supported?',
      a: 'Angular 20, 21 and 22. There is one package major per Angular major: install 22.x for Angular 22 (npm tag latest), 21.x for Angular 21 (ng21), and 20.x for Angular 20 (ng20).',
    },
    {
      q: 'How do I reload the table with new data?',
      a: 'Assign a new array to the dtData signal input. The directive reconciles the table automatically (clear, add rows, redraw) and keeps the current page and sort. There is no manual trigger like the old dtTrigger Subject.',
    },
    {
      q: 'Do I need NgModules or Zone.js?',
      a: 'No. The directive is standalone and works under zoneless change detection, which is the default in Angular 21 and 22. It also runs fine in zoned apps.',
    },
    {
      q: 'How do I avoid XSS when showing user data?',
      a: 'Add withSafeDefaults() to provideDataTables(). It escapes every column that has no explicit renderer, which overrides DataTables’ unsafe HTML-by-default behavior. To render HTML on purpose, use the DomSanitizer-backed renderer the library provides.',
    },
    {
      q: 'Does it support Ajax and server-side processing?',
      a: 'Yes. Set the ajax option for client-side loading, or serverSide: true with an ajax function that posts the paging, sort and search parameters to your API. The directive passes the full DataTables config through.',
    },
    {
      q: 'Which DataTables extensions work?',
      a: 'All of them, with no library-specific code: Buttons, Select, ColumnControl, Responsive, FixedHeader, FixedColumns, Scroller, RowGroup, RowReorder, ColReorder, SearchPanes, SearchBuilder, KeyTable, AutoFill, DateTime and StateRestore. Import the extension package and configure it through dtOptions. The commercial Editor is compatible via the exposed Api.',
    },
    {
      q: 'Can I use it with server-side rendering (SSR)?',
      a: 'Yes. The table initialises in the browser only (via afterNextRender), so the server renders plain table markup and the table is enhanced on the client during hydration.',
    },
  ];
}
