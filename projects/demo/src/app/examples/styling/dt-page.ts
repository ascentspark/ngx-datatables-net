import { ChangeDetectionStrategy, Component } from '@angular/core';
import { withOptions } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { StyledTable } from './styled-table';

@Component({
  selector: 'demo-dt-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleCard, StyledTable],
  providers: [...withDefaultStyling().providers, ...withOptions({ pageLength: 10 }).providers],
  template: `
    <demo-example
      title="Default (dt) styling"
      description="DataTables' own default theme, wrapped as the dt adapter. The same [dtTable] directive renders under any adapter with no per-style code."
      docsUrl="https://datatables.net/manual/styling/"
      [sources]="sources"
    >
      <demo-styled-table />
    </demo-example>
  `,
})
export class DtPage {
  protected readonly sources: ExampleSource[] = [
    {
      label: 'install',
      lang: 'bash',
      code: `npm install ngx-datatables-net datatables.net datatables.net-dt

# angular.json -> styles:
#   "node_modules/datatables.net-dt/css/dataTables.dataTables.css"`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `import { provideDataTables } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

providers: [provideDataTables(withDefaultStyling())];`,
    },
  ];
}
