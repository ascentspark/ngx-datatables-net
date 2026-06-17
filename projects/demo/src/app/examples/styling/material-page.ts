import { ChangeDetectionStrategy, Component } from '@angular/core';
import { withOptions } from 'ngx-datatables-net';
import { withMaterial } from 'ngx-datatables-net/material';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { StyledTable } from './styled-table';

@Component({
  selector: 'demo-material-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleCard, StyledTable],
  providers: [...withMaterial().providers, ...withOptions({ pageLength: 10 }).providers],
  template: `
    <demo-example
      title="Material styling"
      description="A Material Design theme we ship ourselves, since DataTables has no official Material package. Like the Tailwind theme it uses the core constructor plus a self-contained stylesheet."
      [sources]="sources"
    >
      <demo-styled-table />
    </demo-example>
  `,
})
export class MaterialPage {
  protected readonly sources: ExampleSource[] = [
    {
      label: 'install',
      lang: 'bash',
      code: `npm install ngx-datatables-net datatables.net

# angular.json -> styles:
#   "node_modules/ngx-datatables-net/material/styles/ngx-datatables-net.material.css"`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `import { provideDataTables } from 'ngx-datatables-net';
import { withMaterial } from 'ngx-datatables-net/material';

providers: [provideDataTables(withMaterial())];`,
    },
  ];
}
