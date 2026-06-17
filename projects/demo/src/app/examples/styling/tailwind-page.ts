import { ChangeDetectionStrategy, Component } from '@angular/core';
import { withOptions } from 'ngx-datatables-net';
import { withTailwind } from 'ngx-datatables-net/tailwind';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import { StyledTable } from './styled-table';

@Component({
  selector: 'demo-tailwind-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleCard, StyledTable],
  providers: [...withTailwind().providers, ...withOptions({ pageLength: 10 }).providers],
  template: `
    <demo-example
      title="Tailwind styling"
      description="A Tailwind-flavoured theme we ship ourselves, since DataTables has no official Tailwind package. It uses the core constructor plus a self-contained stylesheet, so it does not affect any other styling on the page."
      [sources]="sources"
    >
      <demo-styled-table />
    </demo-example>
  `,
})
export class TailwindPage {
  protected readonly sources: ExampleSource[] = [
    {
      label: 'install',
      lang: 'bash',
      code: `npm install ngx-datatables-net datatables.net

# angular.json -> styles:
#   "node_modules/ngx-datatables-net/tailwind/styles/ngx-datatables-net.tailwind.css"`,
    },
    {
      label: 'app.config.ts',
      lang: 'ts',
      code: `import { provideDataTables } from 'ngx-datatables-net';
import { withTailwind } from 'ngx-datatables-net/tailwind';

providers: [provideDataTables(withTailwind())];`,
    },
  ];
}
