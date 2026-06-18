# ngx-datatables-net

[![npm version](https://img.shields.io/npm/v/ngx-datatables-net.svg)](https://www.npmjs.com/package/ngx-datatables-net)
[![downloads](https://img.shields.io/npm/dm/ngx-datatables-net.svg)](https://www.npmjs.com/package/ngx-datatables-net)
[![Angular](https://img.shields.io/badge/Angular-20%20%7C%2021%20%7C%2022-dd0031.svg)](https://angular.dev)
[![license](https://img.shields.io/npm/l/ngx-datatables-net.svg)](https://github.com/ascentspark/ngx-datatables-net/blob/main/LICENSE)

[DataTables](https://datatables.net) is a widely used JavaScript library that turns a plain HTML
table into an interactive one: sorting, searching, pagination, and a large set of extensions for
things like export buttons, row selection, fixed headers and responsive layouts.

`ngx-datatables-net` lets you use DataTables from Angular without writing any jQuery. You put a
directive on a `<table>`, bind your options and data as Angular inputs, and read events and state
back as signals. It supports Angular 20, 21 and 22.

It is the successor to the archived `angular-datatables`, rebuilt for standalone components, signals
and zoneless change detection, with escaped output by default.

> **Coming from `angular-datatables`?** See the [migration guide](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/MIGRATION.md) for the move from `DataTablesModule` / `dtTrigger` to the signal-driven directive.

A note on jQuery: DataTables still uses jQuery internally, so it sits in your dependency tree as a
transitive dependency of `datatables.net`. This library never imports or calls jQuery itself. You
write plain Angular.

## Install

```bash
npm install ngx-datatables-net datatables.net datatables.net-dt
```

`datatables.net` is a peer dependency. Pick a styling package (`datatables.net-dt` for the default
theme, `datatables.net-bs5` for Bootstrap 5) and add its stylesheet in `angular.json`:

```
"styles": [
  "node_modules/datatables.net-dt/css/dataTables.dataTables.css",
  "src/styles.scss"
]
```

## Quick start

Register the providers once:

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
      withSafeDefaults(),               // escape columns that have no renderer
      withOptions({ pageLength: 10 }),  // app-wide defaults
    ),
  ],
};
```

Then use the directive on a table:

```ts
import { Component, signal } from '@angular/core';
import { DtTableDirective, type Api, type ConfigColumns } from 'ngx-datatables-net';

@Component({
  imports: [DtTableDirective],
  template: `
    <table dtTable class="display" style="width:100%"
           [dtData]="data()" [dtColumns]="columns"
           (dtInit)="onInit($event)" (dtRowClick)="onRowClick($event.row)">
      <thead>
        <tr><th>ID</th><th>Name</th></tr>
      </thead>
    </table>`,
})
export class UsersTable {
  data = signal([{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]);
  columns: ConfigColumns[] = [{ data: 'id', title: 'ID' }, { data: 'name', title: 'Name' }];
  onInit(api: Api<{ id: number; name: string }>) { /* the full DataTables Api, for imperative use */ }
  onRowClick(row: { id: number; name: string }) { /* typed row data */ }
}
```

To reload the table later, set a new array on the `data` signal. There is no manual redraw trigger.

## The directive: `[dtTable]`

Put it on a native `<table>`. Reference it with `#t="dtTable"`.

### Inputs

| Input | Type | Notes |
| ----- | ---- | ----- |
| `dtOptions` | `Config` | DataTables options. Changing the contents recreates the table. Inline object literals are safe; change detection is structural, not by reference. |
| `dtData` | `readonly T[]` | Row data. A new array reference reloads the rows in place and keeps the current page. |
| `dtColumns` | `ConfigColumns[]` | Column definitions. A shorthand for `options.columns`. |

### Outputs

| Output | Payload | Fires on |
| ------ | ------- | -------- |
| `dtInit` | `Api<T>` | once, after the table is created |
| `dtDraw` | `DtEvent<T>` | DataTables `draw` |
| `dtPage` | `DtEvent<T>` | DataTables `page` |
| `dtXhr` | `DtEvent<T>` | Ajax or server-side load |
| `dtSelect` / `dtDeselect` | `DtSelectEvent<T>` | Select extension |
| `dtRowClick` | `DtRowClickEvent<T>` | row click, with the resolved row data |

### Signals and the underlying Api

- `instance(): Api<T> | undefined` is the live DataTables `Api`, or `undefined` before the table is created (during SSR, for example).
- `ready(): boolean` is true once the table exists.
- `selected(): readonly T[]` is the current selection when the Select extension is loaded.

```ts
table = viewChild.required<DtTableDirective<Row>>('t');
this.table().instance()?.column(0).visible(false);
```

## Styling adapters

Each adapter is a secondary entry point. Import one and pass it to `provideDataTables(...)`.

| Adapter | Import | Styling source |
| ------- | ------ | -------------- |
| Default | `withDefaultStyling()` from `ngx-datatables-net/dt` | upstream `datatables.net-dt` |
| Bootstrap 5 | `withBootstrap5()` from `ngx-datatables-net/bs5` | upstream `datatables.net-bs5` |
| Tailwind | `withTailwind()` from `ngx-datatables-net/tailwind` | written by us, since DataTables ships no Tailwind theme |
| Material | `withMaterial()` from `ngx-datatables-net/material` | written by us, since DataTables ships no Material theme |

For Tailwind and Material, also include the shipped stylesheet (the directive adds the scope class for you):

```
// angular.json styles
"node_modules/ngx-datatables-net/tailwind/styles/ngx-datatables-net.tailwind.css"
// or
"node_modules/ngx-datatables-net/material/styles/ngx-datatables-net.material.css"
```

## Extensions

Every official DataTables extension works without any library code, because the directive forwards
your full `Config`. That covers Buttons, ColReorder, ColumnControl, AutoFill, FixedColumns,
FixedHeader, KeyTable, Responsive, RowGroup, RowReorder, Scroller, SearchBuilder, SearchPanes,
Select, StateRestore and DateTime, plus the commercial Editor. Import the extension package for its
side effects and configure it through `dtOptions`:

```ts
import 'datatables.net-select';
options: Config = { select: { style: 'multi' } };
```

One thing to watch: interactive Angular controls such as custom search inputs should live outside
the `<table>`. DataTables rewrites the header and footer DOM, which detaches Angular event
listeners. Call the `Api` from your own handlers instead.

## Security

DataTables writes cells as `innerHTML` and does not escape by default, so untrusted data is an XSS
sink. This library gives you two safeguards:

- `withSafeDefaults()` escapes every column that has no explicit `render`, which overrides the unsafe
  default. Recommended for any table that shows user data.
- `injectSanitizedHtmlRenderer()` and `createSanitizedHtmlRenderer()` let a column render HTML that
  is first run through Angular's `DomSanitizer`, so safe tags survive and scripts, `onerror` and
  `onclick` are stripped.

Note that because DataTables uses `innerHTML`, it is not compatible with a strict
`require-trusted-types-for 'script'` Content Security Policy without a permissive Trusted Types
policy. See [SECURITY.md](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/SECURITY.md).

## Documentation

Live demo and full docs for every feature, styling adapter and extension:
[ngx-datatables-net.ascentspark.com](https://ngx-datatables-net.ascentspark.com)

## Versions

One package major per Angular major. Install the one that matches your app.

| Package | Angular | npm tag |
| ------- | ------- | ------- |
| `22.x`  | 22      | `latest` |
| `21.x`  | 21      | `ng21`  |
| `20.x`  | 20      | `ng20`  |

## License

MIT, by [Ascentspark](https://ascentspark.com).
