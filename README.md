<div align="center">

# ngx-datatables-net

An Angular wrapper for [DataTables.net](https://datatables.net), by
<a href="https://ascentspark.com" target="_blank" rel="noopener">Ascentspark</a>

<a href="https://ascentspark.com" target="_blank" rel="noopener"><img src="https://cdn.ascentspark.com/assets/images/asc-logo-full.svg" alt="Ascentspark" height="40"></a>

### Signals, standalone components and zoneless change detection, without writing jQuery

[![npm version](https://img.shields.io/npm/v/ngx-datatables-net.svg?color=dd0031)](https://www.npmjs.com/package/ngx-datatables-net)
[![downloads](https://img.shields.io/npm/dm/ngx-datatables-net.svg)](https://www.npmjs.com/package/ngx-datatables-net)
[![Angular 20 · 21 · 22](https://img.shields.io/badge/Angular-20%20%C2%B7%2021%20%C2%B7%2022-dd0031.svg)](https://angular.dev)
[![license MIT](https://img.shields.io/npm/l/ngx-datatables-net.svg?color=3b82f6)](LICENSE)

**[🚀 Live demo](https://ngx-datatables-net.ascentspark.com)** &nbsp;·&nbsp;
**[✏️ Edit in place](docs/EDIT-IN-PLACE.md)** [![new](https://img.shields.io/badge/new-22.2.0-dd0031?style=flat-square)](docs/EDIT-IN-PLACE.md) &nbsp;·&nbsp;
**[📦 npm](https://www.npmjs.com/package/ngx-datatables-net)** &nbsp;·&nbsp;
**[📝 Changelog](CHANGELOG.md)**

</div>

---

[DataTables](https://datatables.net) turns a plain HTML table into an interactive one: sorting,
search, pagination, and a large set of extensions. **`ngx-datatables-net`** lets you drive it from
Angular without writing any jQuery. Add a directive to a `<table>`, bind your options and data as
signal inputs, and read events and state back as signals. Standalone, zoneless-ready, SSR-safe, and
escaped by default.

> **🅰️ Built the modern Angular way.** Signals, standalone components and zoneless change detection,
> on top of DataTables' **non-jQuery** constructor API. Your only peer dependencies are Angular and
> DataTables: no `zone.js`, `rxjs` or `jquery` required of your app. The original `angular-datatables`
> was archived in 2025 and never moved past `NgModule` + `Zone.js` + `dtTrigger`; this is a clean-sheet
> rebuild for Angular 20 to 22. (DataTables uses jQuery internally, so it still ships in the bundle as
> a transitive dependency, but you never write or configure it.)

> ## 🆓 Built-in inline editing, an alternative to the paid version
>
> DataTables' own inline editing ships only in **[Editor](https://editor.datatables.net/), a
> commercial paid extension**. The `[dtEditable]` directive gives you **double-click edit-in-place
> for free** (MIT): text, textarea, number, date, checkbox, select, multiselect and **custom**
> editors, with validation, keyboard navigation and optional pessimistic async saving, all through
> the non-jQuery API and written the Angular way.
>
> **→ [Try the live demo](https://ngx-datatables-net.ascentspark.com/features/edit-in-place)** &nbsp;·&nbsp;
> **[Read the guide](docs/EDIT-IN-PLACE.md)**

## ✨ Why ngx-datatables-net

- **No jQuery in your code.** Built on the DataTables non-jQuery API; jQuery stays a transitive
  dependency you never touch.
- **Signals, not subjects.** Assign a new array to `dtData` and the table reconciles itself, with
  no manual redraw trigger to remember. Events come back as Angular outputs; selection and the
  underlying `Api` are exposed as signals.
- **Free edit-in-place.** The `[dtEditable]` companion directive gives you inline editing without
  the commercial Editor licence (see the callout above).
- **Safe by default.** Output is escaped unless you opt in; a `DomSanitizer`-backed renderer is
  provided for trusted HTML.
- **Every extension works.** Buttons, Select, Responsive, FixedHeader/Columns, Scroller, RowGroup,
  SearchPanes, ColumnControl and more: pass the config straight through.
- **Four styling adapters.** DataTables default, Bootstrap 5, plus Tailwind and Material themes
  authored by us (DataTables ships neither).
- **Standalone & zoneless.** Initialises in the browser only, so it is safe under SSR.

## 📦 Install

```bash
npm install ngx-datatables-net datatables.net datatables.net-dt
```

Add the stylesheet for your chosen theme in `angular.json`:

```jsonc
"styles": [
  "node_modules/datatables.net-dt/css/dataTables.dataTables.css",
  "src/styles.scss"
]
```

## 🚀 Quick start

Register the providers once:

```ts
// app.config.ts
import { provideDataTables, withOptions, withSafeDefaults } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

providers: [
  provideDataTables(withDefaultStyling(), withSafeDefaults(), withOptions({ pageLength: 10 })),
];
```

Then use the directive on a table:

```ts
// users.component.ts
import { Component, signal } from '@angular/core';
import { DtTableDirective, type ConfigColumns } from 'ngx-datatables-net';

@Component({
  selector: 'app-users',
  imports: [DtTableDirective],
  template: `
    <table dtTable [dtData]="users()" [dtColumns]="columns" class="display">
      <thead>
        <tr><th>Name</th><th>Email</th></tr>
      </thead>
    </table>
  `,
})
export class UsersComponent {
  users = signal([{ name: 'Ada', email: 'ada@example.com' }]);
  columns: ConfigColumns[] = [{ data: 'name' }, { data: 'email' }];
}
```

To reload the table later, set a new array on the `users` signal. That is the whole loop.

## ✏️ Edit in place (free, no Editor licence)

Add `[dtEditable]` to the same `<table>` and give a column an `editor`. Double-click to edit; Enter
commits, Escape cancels, Tab moves to the next editable cell.

```ts
import { DtTableDirective, DtEditableDirective, type DtColumn } from 'ngx-datatables-net';

columns: DtColumn<User>[] = [
  { data: 'name',   title: 'Name',   editor: { type: 'text', validate: v => String(v).trim() ? null : 'Required' } },
  { data: 'role',   title: 'Role',   editor: { type: 'select', options: ROLES } },
  { data: 'skills', title: 'Skills', editor: { type: 'multiselect', options: SKILLS } },
];
```

Editors: `text`, `textarea`, `number`, `date`, `checkbox`, `select`, `multiselect`, `custom`.
Bind `[dtSave]` to persist before the cell is written (sync, `Promise` or `Observable`). The cell
shows a busy state and, on failure, stays open with an inline error for retry. Full details in the
**[Edit in place guide](docs/EDIT-IN-PLACE.md)**.

## 📚 Documentation

Live demo and full docs for every feature, styling adapter and extension:
**[ngx-datatables-net.ascentspark.com](https://ngx-datatables-net.ascentspark.com)**

In this repo:

| Doc | What's inside |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | design notes and the zoneless bridge |
| [Edit in place](docs/EDIT-IN-PLACE.md) | the `[dtEditable]` directive in full |
| [Security](docs/SECURITY.md) | cell rendering and the XSS boundary |
| [Migration](docs/MIGRATION.md) | moving from the archived `angular-datatables` |
| [Changelog](CHANGELOG.md) | dated release notes |

## 🔢 Versions

One package major per Angular major. Install the one that matches your app.

| Package | Angular | npm tag |
| ------- | ------- | ------- |
| `22.x`  | 22      | `latest` |
| `21.x`  | 21      | `ng21`  |
| `20.x`  | 20      | `ng20`  |

## 🛠️ Working on this repo

Node is pinned in `.nvmrc` (Angular 22 needs Node 22.22.3 or newer).

```bash
nvm use
npm install

npx ng build ngx-datatables-net      # build the library
npx ng serve demo --port 4287        # run the demo
npx ng test ngx-datatables-net       # unit tests
npx playwright test                  # end-to-end tests
```

## 🤝 Help keep it healthy

We genuinely try to keep this library current, bug-free and secure, and honestly the best way to get
there is together. If something breaks, please
[open an issue](https://github.com/ascentspark/ngx-datatables-net/issues) so we can look into it. If
you can fix a bug or add something useful, pull requests are very welcome, big or small. An
open-source library stays dependable only when people use it, tell us what's broken, and pitch in
now and then, so thank you in advance for anything you send our way. 💛

## 👋 About

We are [Ascentspark](https://ascentspark.com). We have used datatables.net across our Angular
projects and kept writing the same wrapper code to make it feel at home in modern Angular. This is
that code, tidied up and shared, in case you are looking for an Angular wrapper too.

## License

MIT
