<div align="center">

# ngx-datatables-net

An Angular wrapper for [DataTables.net](https://datatables.net), by
<a href="https://ascentspark.com" target="_blank" rel="noopener">Ascentspark</a>

<a href="https://ascentspark.com" target="_blank" rel="noopener"><img src="https://cdn.ascentspark.com/assets/images/asc-logo-full.svg" alt="Ascentspark" height="40"></a>

### Signals, standalone components and zoneless change detection, without writing jQuery

[![npm version](https://img.shields.io/npm/v/ngx-datatables-net.svg?color=dd0031)](https://www.npmjs.com/package/ngx-datatables-net)
[![downloads](https://img.shields.io/npm/dm/ngx-datatables-net.svg)](https://www.npmjs.com/package/ngx-datatables-net)
[![Angular 20 · 21 · 22](https://img.shields.io/badge/Angular-20%20%C2%B7%2021%20%C2%B7%2022-dd0031.svg)](https://angular.dev)
[![license MIT](https://img.shields.io/npm/l/ngx-datatables-net.svg?color=3b82f6)](https://github.com/ascentspark/ngx-datatables-net/blob/main/LICENSE)

**[🚀 Live demo](https://ngx-datatables-net.ascentspark.com)** &nbsp;·&nbsp;
**[✏️ Edit in place](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/EDIT-IN-PLACE.md)** [![new](https://img.shields.io/badge/new-20.2.0-dd0031?style=flat-square)](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/EDIT-IN-PLACE.md) &nbsp;·&nbsp;
**[📝 Changelog](https://github.com/ascentspark/ngx-datatables-net/blob/main/CHANGELOG.md)**

</div>

---

[DataTables](https://datatables.net) turns a plain HTML table into an interactive one: sorting,
search, pagination, and a large set of extensions. `ngx-datatables-net` lets you drive it from
Angular without writing any jQuery. Put a directive on a `<table>`, bind your options and data as
signal inputs, and read events and state back as signals. It supports Angular 20, 21 and 22.

DataTables itself still uses jQuery internally, so jQuery ships in your bundle as a transitive
dependency of `datatables.net`. This library never imports or calls jQuery, never lists it as a peer
dependency, and never asks you to write it: you write plain Angular.

> **🅰️ Built the modern Angular way.** Signals, standalone components and zoneless change detection,
> on top of DataTables' **non-jQuery** constructor API. Your only peer dependencies are Angular and
> DataTables: no `zone.js`, `rxjs` or `jquery` required of your app. The original `angular-datatables`
> was archived in 2025 and never moved past `NgModule` + `Zone.js` + `dtTrigger`; this is a clean-sheet
> rebuild for Angular 20 to 22.

> ## 🆓 Built-in inline editing, an alternative to the paid version
>
> DataTables' own inline editing ships only in **[Editor](https://editor.datatables.net/), a
> commercial paid extension**. The `[dtEditable]` directive gives you **double-click edit-in-place
> for free** (MIT): text, textarea, number, date, checkbox, select, multiselect and **custom**
> editors, with validation, keyboard navigation and optional pessimistic async saving.
> **→ [Live demo](https://ngx-datatables-net.ascentspark.com/features/edit-in-place)** ·
> **[Guide](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/EDIT-IN-PLACE.md)** ·
> see [`[dtEditable]`](#edit-in-place-dteditable-free-no-editor-licence) below.

> **Coming from `angular-datatables`?** See the [migration guide](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/MIGRATION.md) for the move from `DataTablesModule` / `dtTrigger` to the signal-driven directive.

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

## Edit in place: `[dtEditable]` (free, no Editor licence)

Inline editing in DataTables is otherwise a paid feature of the commercial
[Editor](https://editor.datatables.net/) extension. `[dtEditable]` gives you the same
double-click-to-edit experience **for free** (MIT). Add it to the same `<table>` and give a column an
`editor`; a column with no `editor` is read-only. Enter (or click-away) commits, Escape cancels, Tab
moves to the next editable cell.

```ts
import { DtTableDirective, DtEditableDirective, type DtColumn } from 'ngx-datatables-net';

@Component({
  imports: [DtTableDirective, DtEditableDirective],
  template: `
    <table dtTable dtEditable class="display" style="width:100%"
           [dtData]="people()" [dtColumns]="columns" [dtSave]="save"
           (dtCellEdit)="onSaved($event)">
      <thead><tr><th>Name</th><th>Office</th></tr></thead>
    </table>`,
})
export class People {
  columns: DtColumn<Person>[] = [
    { data: 'name', title: 'Name', editor: { type: 'text', validate: v => String(v).trim() ? null : 'Required' } },
    { data: 'office', title: 'Office', editor: { type: 'select', options: OFFICES } },
  ];
}
```

- **Editors:** `text`, `textarea`, `number`, `date`, `checkbox`, `select`, `multiselect`, and a
  `custom` editor backed by your own `<ng-template>`.
- **Saving:** bind `[dtSave]` to persist before the cell is written. Return `void` for a synchronous
  commit, or a `Promise` / `Observable` for a pessimistic save. The cell shows a busy state and, on
  failure, stays open with an inline error for retry.
- **Events:** `dtCellEditStart`, `dtCellEdit`, `dtCellEditCancel`, `dtCellEditError`.
- Per-cell `validate` and `disabled`, keyboard navigation, focus return and ARIA labelling are built
  in; values are written through the DataTables `Api`, and no edit path introduces an HTML sink.

Full guide: [Edit in place](https://github.com/ascentspark/ngx-datatables-net/blob/main/docs/EDIT-IN-PLACE.md)
· [live demo](https://ngx-datatables-net.ascentspark.com/features/edit-in-place).

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

## 🗺️ Roadmap

> 🚧 **Work in progress for upcoming releases.** All built on **free** DataTables (no commercial
> extensions required), no firm dates yet, and pull requests are very welcome.

| | Feature | What's coming |
| :-: | --- | --- |
| 🗂️ | **Master / detail rows** | Expandable detail rows and nested sub-grids, driven by Angular templates |
| 🗃️ | **Row grouping** | Group headers with expand / collapse and aggregation helpers, on top of RowGroup |
| 📋 | **Clipboard** | Excel-style copy and paste, for the whole table and for cell ranges |
| 🔲 | **Cell selection** | Select individual cells and rectangular ranges, building on the Select extension |

Following the same approach as edit-in-place: modern Angular (signals, standalone, zoneless), and
free alternatives to features that are otherwise paid in other grids.

## Help keep it healthy

We genuinely try to keep this library current, bug-free and secure, and honestly the best way to get
there is together. If something breaks, please
[open an issue](https://github.com/ascentspark/ngx-datatables-net/issues); if you can fix a bug or
add something useful, pull requests are very welcome, big or small. An open-source library stays
dependable only when people use it, tell us what's broken, and pitch in now and then, so thank you in
advance for anything you send our way. 💛

## License

MIT, by [Ascentspark](https://ascentspark.com).
