import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * SSR & hydration safety. The directive initialises DataTables inside `afterNextRender`, which runs
 * ONLY in the browser, so server-side rendering emits the plain `<table>` markup (great for SEO and
 * fast first paint) and the table is enhanced on the client during hydration. No `document`/layout
 * access ever happens on the server, so SSR never crashes.
 */
@Component({
  selector: 'demo-advanced-ssr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="SSR & hydration"
      description="The directive initialises DataTables in afterNextRender (browser-only). On the server the plain table HTML is rendered; on the client it's enhanced during hydration. No isPlatformBrowser guard needed, afterNextRender never runs on the server."
      [sources]="sources"
    >
      <p class="demo-note">
        Why it's safe: DataTables touches <code>document</code> and measures layout. Running init in
        <code>afterNextRender</code> means that code is skipped entirely during SSR, so the server
        renders semantic table markup and the browser upgrades it after hydration.
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
export class AdvancedSsr {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;

  protected readonly sources: ExampleSource[] = [
    {
      label: 'how it works',
      lang: 'ts',
      code: `// Inside the directive (simplified):
constructor() {
  afterNextRender(() => {
    // browser-only, never runs during SSR
    this.table = new DataTable(this.host.nativeElement, config);
  });
}

// Server render: plain <table> markup (SEO-friendly, fast paint).
// Client hydration: afterNextRender fires → DataTables enhances it.`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `// For a real SSR app, add Angular SSR + hydration:
providers: [
  provideClientHydration(withIncrementalHydration()),
  provideDataTables(withDefaultStyling(), withSafeDefaults()),
]`,
    },
  ];
}
