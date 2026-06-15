import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DtTableDirective,
  injectSanitizedHtmlRenderer,
  type ConfigColumns,
} from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

interface Person {
  name: string;
  /** Untrusted HTML containing a script-injection attempt. */
  note: string;
}

const PEOPLE: Person[] = [
  { name: 'Aisha Khan', note: '<strong>VIP</strong> client <img src=x onerror="alert(\'xss\')">' },
  { name: 'Liam Smith', note: '<em>Trial</em> <script>alert(1)</script> account' },
  { name: 'Sofia Garcia', note: '<a href="https://example.com" onclick="steal()">profile</a>' },
  { name: 'Noah Müller', note: 'Plain text, nothing fancy' },
];

/**
 * Renderers & XSS safety. DataTables writes cells to the DOM directly, BYPASSING Angular's
 * template sanitizer — so HTML renderers are an XSS sink. This example shows the two safe paths:
 * the default escaped text renderer, and the library's `createSanitizedHtmlRenderer` /
 * `injectSanitizedHtmlRenderer` hook which funnels HTML through Angular's DomSanitizer.
 */
@Component({
  selector: 'demo-features-renderers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Renderers & XSS safety"
      description="DataTables writes cells as innerHTML and does NOT escape by default — an XSS sink. With withSafeDefaults() enabled, ngx-datatables-net escapes every column lacking a renderer (column 2 shows the payload as literal text). Column 3 opts into HTML via the DomSanitizer-backed hook (safe tags kept, scripts/onerror/onclick stripped). No alert ever fires."
      [sources]="sources"
    >
      <table dtTable class="display" style="width:100%" [dtData]="data" [dtColumns]="columns">
        <thead>
          <tr>
            <th>Name</th>
            <th>Note — escaped by default</th>
            <th>Note — sanitized HTML</th>
          </tr>
        </thead>
      </table>
      <p class="demo-note">
        The <code>note</code> values contain <code>&lt;script&gt;</code>, <code>onerror</code> and
        <code>onclick</code> payloads. Column 2 (no renderer) is auto-escaped by
        <code>withSafeDefaults()</code> and shows the literal text; column 3 renders only the
        sanitised markup. The injected alert never executes.
      </p>
    </demo-example>
  `,
})
export class FeaturesRenderers {
  /** Bound in a field initializer → runs inside the injection context. */
  private readonly safeHtml = injectSanitizedHtmlRenderer();

  protected readonly data = PEOPLE;
  protected readonly columns: ConfigColumns[] = [
    { title: 'Name', data: 'name' },
    // Default renderer: DataTables escapes, so the HTML is shown as literal text.
    { title: 'Raw note (escaped)', data: 'note' },
    // Sanitized HTML: safe tags survive; script / onerror / onclick are stripped.
    {
      title: 'Note (sanitized HTML)',
      data: 'note',
      render: this.safeHtml<Person>((row) => row.note),
    },
  ];

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `// app.config.ts — escape every renderer-less column:
provideDataTables(withDefaultStyling(), withSafeDefaults())

private readonly safeHtml = injectSanitizedHtmlRenderer();

columns: ConfigColumns[] = [
  { title: 'Name', data: 'name' },
  // No render → auto-escaped by withSafeDefaults() (safe text).
  { title: 'Escaped', data: 'note' },
  // Opt-in HTML, routed through Angular DomSanitizer.
  { title: 'Sanitized', data: 'note',
    render: this.safeHtml<Person>(row => row.note) },
];`,
    },
    {
      label: 'why',
      lang: 'ts',
      code: `// DataTables injects cell HTML via the DOM, bypassing Angular's
// template sanitization. createSanitizedHtmlRenderer() runs the
// value through DomSanitizer.sanitize(SecurityContext.HTML, …)
// for the 'display'/'filter' render types only, keeping raw data
// for sort/type so ordering stays correct.`,
    },
  ];
}
