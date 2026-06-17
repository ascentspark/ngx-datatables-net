import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { withOptions } from 'ngx-datatables-net';
import { withBootstrap5 } from 'ngx-datatables-net/bs5';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { StyledTable } from './styled-table';

/**
 * Bootstrap 5 styling. Importing the adapter here (in this lazy route) keeps its global DataTables
 * class changes off every other page. Bootstrap and the DataTables-bs5 CSS are lazy bundles loaded
 * only while this page is open.
 *
 * Unlike the dt / Tailwind / Material adapters (which use the core constructor and scoped CSS), the
 * Bootstrap 5 adapter rewrites DataTables' global markup classes on import, and DataTables offers no
 * way to undo that. So when leaving this page we do a full reload, which returns every other page to
 * the default styling cleanly.
 */
@Component({
  selector: 'demo-bs5-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleCard, StyledTable],
  providers: [...withBootstrap5().providers, ...withOptions({ pageLength: 10 }).providers],
  template: `
    <demo-example
      title="Bootstrap 5 styling"
      description="Wraps the official datatables.net-bs5 package so the table uses Bootstrap 5 markup and classes."
      docsUrl="https://datatables.net/manual/styling/bootstrap"
      [sources]="sources"
    >
      <demo-styled-table [lazyStyles]="['bootstrap.css', 'datatables-bs5.css']" />
    </demo-example>
  `,
})
export class Bs5Page {
  constructor() {
    const win = inject(DOCUMENT).defaultView;
    inject(DestroyRef).onDestroy(() => win?.location.reload());
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'install',
      lang: 'bash',
      code: `npm install ngx-datatables-net datatables.net datatables.net-bs5 bootstrap

# angular.json -> styles:
#   "node_modules/bootstrap/dist/css/bootstrap.min.css"
#   "node_modules/datatables.net-bs5/css/dataTables.bootstrap5.css"`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `import { provideDataTables } from 'ngx-datatables-net';
import { withBootstrap5 } from 'ngx-datatables-net/bs5';

providers: [provideDataTables(withBootstrap5())];`,
    },
  ];
}
