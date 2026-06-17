# Security

`ngx-datatables-net` wraps DataTables, which renders cell content by writing **`innerHTML`**. This
is powerful but means DataTables **bypasses Angular's template sanitization** and **does not escape
cell data by default**. Untrusted data rendered through DataTables is therefore an XSS sink unless
you take action. This document explains the protections this library provides and their limits.

## 1. Escape by default, `withSafeDefaults()`

```ts
provideDataTables(withDefaultStyling(), withSafeDefaults());
```

`withSafeDefaults()` makes the directive append a lowest-priority
`{ targets: '_all', render: escapeHtmlRenderer() }` to `columnDefs`. Because DataTables gives
`columns[].render` (and earlier `columnDefs`) precedence, **only columns without an explicit renderer
are escaped**, your custom/orthogonal renderers and `defaultContent` columns are untouched.

`escapeHtmlRenderer()` escapes only **string** values for the `display`/`filter` render types
(`& < > " '`). Numbers, booleans, `null`/`undefined` and objects pass through unchanged so numeric
formatting, `defaultContent` and null-data columns keep working; sort/type values stay raw so
ordering and filtering remain correct.

**Recommendation:** enable `withSafeDefaults()` in every app. Treat it as the default posture.

## 2. Opt-in HTML, sanitized through Angular's `DomSanitizer`

When a column genuinely needs to render HTML, opt in explicitly and route it through Angular's
sanitizer:

```ts
private safeHtml = injectSanitizedHtmlRenderer();

columns = [
  { data: 'bio', render: this.safeHtml<Row>(row => row.bioHtml) },
];
```

`createSanitizedHtmlRenderer(sanitizer, extractor?)` / `injectSanitizedHtmlRenderer()` run the value
through `DomSanitizer.sanitize(SecurityContext.HTML, value)` for the `display`/`filter` types only. Safe
markup (e.g. `<strong>`, `<em>`, links) survives; `<script>`, `onerror`, `onclick` and other event
handlers are stripped. Raw data is preserved for sort/type.

**The trust boundary is yours:** if you write a custom `render` that returns raw HTML *without* the
sanitizer, you reintroduce the XSS sink. Only the sanitized helper and `withSafeDefaults()` are safe.

## 3. Trusted Types / CSP, a known limitation

DataTables assigns `innerHTML` internally. Under a strict
`Content-Security-Policy: require-trusted-types-for 'script'`, `innerHTML` assignment is a Trusted
Types sink, so **DataTables is not compatible with strict Trusted Types out of the box**. Options:

- Do not enable `require-trusted-types-for 'script'` for routes that use DataTables, **or**
- Register a permissive Trusted Types policy (e.g. a `default` policy that passes HTML through) and
  accept that DataTables-injected HTML is not TT-guarded, which is why `withSafeDefaults()` +
  sanitized renderers (above) remain essential.

This is a property of DataTables itself, not of the Angular wrapper. We document it rather than
claim Trusted Types support we cannot honestly provide.

## 4. Supply chain

- `datatables.net` (and its transitive `jquery`) and `@angular/*` are **peer dependencies**, the
  consuming app owns, dedupes and audits them, so security advisories are resolved in your tree, not
  pinned by this package.
- The published package has **no runtime dependencies** other than `tslib`. `npm audit --omit=dev`
  on the library surface reports **0 vulnerabilities**.
- Releases are intended to be published with **npm provenance** via CI (OIDC trusted publishing).

## Reporting

Report suspected vulnerabilities privately to the maintainer (Ascentspark) rather than via public
issues.
