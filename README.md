# ngx-datatables-net

[DataTables](https://datatables.net) is a widely used JavaScript library that turns a plain HTML
table into an interactive one: sorting, searching, pagination, and a large set of extensions for
things like export buttons, row selection, fixed headers and responsive layouts.

`ngx-datatables-net` lets you use DataTables from Angular without writing any jQuery. You put a
directive on a `<table>`, bind your options and data as Angular inputs, and read events and state
back as signals. It supports Angular 20, 21 and 22.

## Features

- A `[dtTable]` directive you add to a normal `<table>`.
- Signal inputs for options and data. Assign a new data array and the table updates itself, so there
  is no manual redraw trigger to remember.
- DataTables events come back as Angular outputs. The current selection and the underlying
  DataTables `Api` are exposed as signals for imperative use.
- Built on the DataTables non-jQuery API, so jQuery never appears in your own code.
- Output is escaped by default. When you genuinely need HTML in a cell, a `DomSanitizer`-backed
  renderer is provided.
- Four styling adapters: the DataTables default, Bootstrap 5, Tailwind and Material. The Tailwind and
  Material themes are written by us, since DataTables ships neither.
- Every DataTables extension works by passing its config straight through, including Buttons, Select,
  Responsive, FixedHeader, FixedColumns, Scroller, RowGroup, SearchPanes and ColumnControl.
- Standalone and zoneless ready. The table initialises in the browser only, so it is safe under SSR.

## Install

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

## Quick start

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

## Documentation

Live demo and full docs for every feature, styling adapter and extension:
[ngx-datatables-net.ascentspark.com](https://ngx-datatables-net.ascentspark.com)

In this repo:

- [Architecture and design notes](docs/ARCHITECTURE.md)
- [Security and cell rendering](docs/SECURITY.md)
- [Migrating from angular-datatables](docs/MIGRATION.md)

## Versions

One package major per Angular major. Install the one that matches your app.

| Package | Angular | npm tag |
| ------- | ------- | ------- |
| `22.x`  | 22      | `latest` |
| `21.x`  | 21      | `ng21`  |
| `20.x`  | 20      | `ng20`  |

## Working on this repo

Node is pinned in `.nvmrc` (Angular 22 needs Node 22.22.3 or newer).

```bash
nvm use
npm install

npx ng build ngx-datatables-net      # build the library
npx ng serve demo --port 4287        # run the demo
npx ng test ngx-datatables-net       # unit tests
npx playwright test                  # end-to-end tests
```

## About

We are [Ascentspark](https://ascentspark.com). We have used datatables.net across our Angular
projects and kept writing the same wrapper code to make it feel at home in modern Angular. This is
that code, tidied up and shared, in case you are looking for an Angular wrapper too. Issues and pull
requests are welcome.

## License

MIT
