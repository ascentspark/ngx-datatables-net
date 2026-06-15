# ngx-datatables-net

Modern Angular wrapper for [DataTables](https://datatables.net) using its **non-jQuery API** —
standalone, signal-based, zoneless-ready. Supports **Angular 20, 21 and 22**.

The spiritual successor to the archived `angular-datatables`, rebuilt for the modern Angular surface
(standalone components, signals, `afterRenderEffect`, zoneless change detection) with **escape-by-default
XSS safety** and a clean, escape-hatch-friendly API.

> **About jQuery:** DataTables still depends on jQuery internally (it's a transitive dependency of
> `datatables.net`). This library never imports or calls jQuery — you write plain Angular — but
> jQuery is present in your dependency tree. We're transparent about this rather than hiding it.

## Installation

```bash
npm install ngx-datatables-net datatables.net datatables.net-dt
```

`datatables.net` is a peer dependency; pick a styling package (`datatables.net-dt` for the default
theme, `datatables.net-bs5` for Bootstrap 5). Add the stylesheet to `angular.json`:

```jsonc
"styles": [
  "node_modules/datatables.net-dt/css/dataTables.dataTables.css",
  "src/styles.scss"
]
```

## Quick start

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { provideDataTables, withOptions, withSafeDefaults } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideDataTables(
      withDefaultStyling(),
      withSafeDefaults(),                 // escape columns without a renderer (XSS safety)
      withOptions({ pageLength: 10 }),    // app-wide defaults
    ),
  ],
};
```

```ts
// component
import { Component, signal } from '@angular/core';
import { DtTableDirective, type Api, type ConfigColumns } from 'ngx-datatables-net';

@Component({
  imports: [DtTableDirective],
  template: `
    <table dtTable class="display" style="width:100%"
           [dtData]="data()" [dtColumns]="columns"
           (dtInit)="onInit($event)" (dtRowClick)="onRowClick($event.row)">
      <thead><tr><th>ID</th><th>Name</th></tr></thead>
    </table>`,
})
export class UsersTable {
  data = signal([{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]);
  columns: ConfigColumns[] = [{ data: 'id', title: 'ID' }, { data: 'name', title: 'Name' }];
  onInit(api: Api<{ id: number; name: string }>) { /* escape hatch to the full DataTables Api */ }
  onRowClick(row: { id: number; name: string }) { /* typed row data */ }
}
```

## The directive: `[dtTable]`

Put it on a native `<table>`. Reference it with `#t="dtTable"`.

### Inputs

| Input | Type | Notes |
|-------|------|-------|
| `dtOptions` | `Config` | DataTables options. A **structural** change recreates the table (inline object literals are safe — no reference-churn loop). |
| `dtData` | `readonly T[]` | Row data. A new array reference reconciles via the cheap `clear → rows.add → draw` path (keeps current page). |
| `dtColumns` | `ConfigColumns[]` | Column definitions (convenience for `options.columns`). |

### Outputs

| Output | Payload | Fires on |
|--------|---------|----------|
| `dtInit` | `Api<T>` | once, after creation |
| `dtDraw` | `DtEvent<T>` | DataTables `draw` |
| `dtPage` | `DtEvent<T>` | DataTables `page` |
| `dtXhr` | `DtEvent<T>` | Ajax/server-side load |
| `dtSelect` / `dtDeselect` | `DtSelectEvent<T>` | Select extension |
| `dtRowClick` | `DtRowClickEvent<T>` | row click (typed row data) |

### Signals & escape hatch

- `instance(): Api<T> | undefined` — the live DataTables `Api` (undefined during SSR / before init).
- `ready(): boolean` — true once created.
- `selected(): readonly T[]` — current selection (Select extension).

```ts
table = viewChild.required<DtTableDirective<Row>>('t');
this.table().instance()?.column(0).visible(false); // full DataTables Api
```

## Styling adapters (secondary entry points)

Import one and add it to `provideDataTables(...)`:

| Adapter | Import | Styling source |
|---------|--------|----------------|
| Default | `withDefaultStyling()` from `ngx-datatables-net/dt` | upstream `datatables.net-dt` |
| Bootstrap 5 | `withBootstrap5()` from `ngx-datatables-net/bs5` | upstream `datatables.net-bs5` |
| **Tailwind** | `withTailwind()` from `ngx-datatables-net/tailwind` | **authored by us** — DataTables has no official Tailwind theme |
| **Material** | `withMaterial()` from `ngx-datatables-net/material` | **authored by us** — DataTables has no official Material theme |

For Tailwind/Material, also include the shipped stylesheet (the directive auto-adds the scope class):

```jsonc
// angular.json styles
"node_modules/ngx-datatables-net/tailwind/styles/ngx-datatables-net.tailwind.css"
// or
"node_modules/ngx-datatables-net/material/styles/ngx-datatables-net.material.css"
```

## Extensions

All of DataTables' official extensions (Buttons, ColReorder, ColumnControl, AutoFill, FixedColumns,
FixedHeader, KeyTable, Responsive, RowGroup, RowReorder, Scroller, SearchBuilder, SearchPanes,
Select, StateRestore, DateTime — and the commercial Editor) work **with zero library code** — the
directive forwards your full `Config`. Import the extension package for its side-effects and
configure via `dtOptions`:

```ts
import 'datatables.net-select';
options: Config = { select: { style: 'multi' } };
```

> Interactive Angular controls (custom search inputs, etc.) should live **outside** the `<table>`:
> DataTables rewrites header/footer DOM and would detach Angular event listeners. Call the `Api`
> imperatively instead.

## Security

DataTables writes cells as `innerHTML` and **does not escape by default** — untrusted data is an XSS
sink. This library addresses it:

- **`withSafeDefaults()`** escapes every column without an explicit `render` (overriding DataTables'
  unsafe default). Strongly recommended.
- **`injectSanitizedHtmlRenderer()` / `createSanitizedHtmlRenderer()`** opt a column into HTML that is
  routed through Angular's `DomSanitizer` (safe tags kept; scripts/`onerror`/`onclick` stripped).
- **Trusted Types:** because DataTables uses `innerHTML`, it is not compatible with a strict
  `require-trusted-types-for 'script'` CSP without a permissive Trusted Types policy. See `SECURITY.md`.

## Versioning

Three parallel release lines mirror the Angular major:

| Package major | Angular | npm dist-tag |
|---------------|---------|--------------|
| `22.x` | Angular 22 | `latest` |
| `21.x` | Angular 21 | `ng21` |
| `20.x` | Angular 20 | `ng20` |

## License

MIT © Ascentspark
