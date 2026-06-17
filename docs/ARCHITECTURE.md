# Architecture

This page explains how `ngx-datatables-net` is put together and the reasoning behind the main
decisions, so you know what you are adding to your app and how to extend it.

## Why this library exists

[DataTables](https://datatables.net) is one of the most capable table libraries on the web, but it
does not ship an Angular integration of its own. The long-standing community option,
[`l-lin/angular-datatables`](https://github.com/l-lin/angular-datatables), was archived in early
2025 and never moved past Angular 19. It was built on NgModules, jQuery, and Zone.js, none of which
fit current Angular, and there is no actively maintained fork that does.

`ngx-datatables-net` fills that gap: an Angular wrapper for DataTables built with standalone APIs and
signals, ready for zoneless change detection, and kept current with Angular.

## How it works

You add the `dtTable` directive to a native `<table>` and drive it through inputs:

```html
<table dtTable [dtData]="rows()" [dtColumns]="columns" class="display"></table>
```

- **Inputs** carry the data, columns, and DataTables options: `dtData`, `dtColumns`, `dtOptions`.
  They are signal inputs, so changing them updates the table.
- **Outputs** surface DataTables events as Angular outputs: `dtInit`, `dtDraw`, `dtPage`, `dtXhr`,
  `dtSelect`, `dtDeselect`, `dtRowClick`.
- **Escape hatch:** the directive exposes the underlying DataTables `Api` instance (via the `dtInit`
  output or a template reference), so anything the wrapper doesn't cover, you can still do directly.

The directive creates the table once the DOM is in place and keeps it in sync as your inputs change.
Assigning a new `dtData` array reconciles the rows automatically; there is no manual redraw trigger
to call, which removes the most common source of bugs in the old library.

## Driven the Angular way, not jQuery

DataTables exposes a framework-agnostic constructor, `new DataTable(element, options)`, and that is
what this wrapper builds on. Your code never imports or writes jQuery. (DataTables still uses jQuery
internally, so it stays in your dependency tree as a transitive dependency of `datatables.net` — see
[Security](./SECURITY.md) — but it never appears in your own code.)

The directive is standalone and works under zoneless change detection, which is the default in
Angular 21 and 22, and it also runs fine in zoned apps. Table state you care about (selection, page,
search) is surfaced through signals and outputs, so the parts of your app that read it update the
way you'd expect.

## Server-side rendering

The table initialises in the browser only. On the server, Angular renders the plain `<table>` markup
you wrote, and DataTables enhances it on the client after hydration. You don't need any platform
guards in your own code.

## Styling

The core wrapper is styling-agnostic. Styling is opt-in through secondary entry points, so you
import only the adapter you use and register it with `provideDataTables(...)`:

| Import | Theme |
|---|---|
| `ngx-datatables-net/dt` | DataTables default |
| `ngx-datatables-net/bs5` | Bootstrap 5 |
| `ngx-datatables-net/tailwind` | Tailwind (maintained here; DataTables has no official Tailwind package) |
| `ngx-datatables-net/material` | Material (maintained here; no official package) |

Each adapter pairs with its stylesheet, which you add in `angular.json`.

## Extensions

DataTables' official extensions (Buttons, Select, Responsive, FixedHeader, Scroller, SearchPanes,
KeyTable, and the rest) work through the options you pass: the directive forwards your DataTables
`Config` untouched. Install the extension package you want, configure it through `dtOptions`, and it
works with no wrapper-specific code. Extensions are never bundled, so you install only the ones you
use. The commercial Editor is compatible through the exposed `Api`.

## Security

DataTables writes cell content as `innerHTML`, which bypasses Angular's template sanitization and is
not escaped by default. The wrapper provides `withSafeDefaults()` to escape every column without an
explicit renderer, plus a sanitizer-backed renderer for columns that intentionally render HTML. This
matters enough to have its own page: see [Security](./SECURITY.md).

## Version lines

The library major mirrors the Angular major, with one maintained release line each:

| Library | Angular | npm tag |
|---|---|---|
| `22.x` | Angular 22 | `latest` |
| `21.x` | Angular 21 | `ng21` |
| `20.x` | Angular 20 | `ng20` |

Install the line that matches your Angular version. Angular and `datatables.net` are peer
dependencies, so your app owns and audits them, and security advisories are resolved in your own
dependency tree rather than pinned by this package.
