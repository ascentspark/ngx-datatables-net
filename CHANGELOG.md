# Changelog

All notable changes to `ngx-datatables-net` are recorded here. Dates are ISO (YYYY-MM-DD). The
package major tracks the Angular major; see [README](README.md#versions) for the version policy.

## 22.3.0 — 2026-09-05

### Added

- **`DtTableDirective.rerenderCell(rowIndex, colIndex)`** — re-renders a single cell's display from
  its current row data without a draw. Plain columns go through the column's normal `render`
  pipeline (the escaping defaults still apply); `dtTemplate` columns get a fresh embedded view.

### Fixed

- **Edit in place under `serverSide: true`** — committing an edit used to call `draw(false)`, which
  in server-side mode re-fetches the whole page over ajax: a full-table roundtrip for a one-cell
  change, rendering whatever the server returned (so a lagging read replica could silently revert
  the value the user just saw saved). A commit in server-side mode now writes the cell and
  re-renders only that cell locally — no draw, no request; the next natural draw (paging, sorting,
  filtering) re-fetches and shows the persisted value. Bind a `dtSave` handler in server-side mode:
  it is what persists the edit. Docs: [docs/EDIT-IN-PLACE.md](docs/EDIT-IN-PLACE.md#server-side-tables-serverside-true).
  The server-side demo now includes an editable column.

## 22.2.1 — 2026-06-25

### Changed

- Docs only. Sharpened the positioning to verifiable, honest claims: lead with the architecture and
  peer-dependency contrast (no `jquery`, `zone.js` or `rxjs` required of the consumer) rather than
  "no jQuery". DataTables uses jQuery internally, so it still ships transitively; the README now
  states that plainly. No code changes.

## 22.2.0 — 2026-06-24

### Added

- **Edit in place** — a new `[dtEditable]` companion directive for double-click-to-edit cells.
  - Built-in editors: text, textarea, number, date, checkbox, select and multiselect, plus a
    `custom` editor backed by your own `<ng-template>`.
  - Optional pessimistic saving via a `dtSave` callback (returns `void`, `Promise` or `Observable`):
    the cell shows a busy state while saving and, on failure, stays open with an inline error for
    retry. Events: `dtCellEditStart`, `dtCellEdit`, `dtCellEditCancel`, `dtCellEditError`.
  - Synchronous per-cell validation, per-cell `disabled`, keyboard support (Enter commits, Escape
    cancels, Tab moves to the next editable cell), focus return to the cell, and ARIA labelling.
  - Works under zoneless change detection, writes through the DataTables `Api` so sorting, filtering
    and search stay correct, and introduces no HTML-injection sink.
  - Live demo: [/features/edit-in-place](https://ngx-datatables-net.ascentspark.com/features/edit-in-place).
    Docs: [docs/EDIT-IN-PLACE.md](docs/EDIT-IN-PLACE.md).

## 22.1.0 — 2026-06-18

### Added

- **Angular cell templates** — `DtColumn.dtTemplate` renders a cell with a real Angular
  `<ng-template>` (pipes, `routerLink`, child components and event bindings all work), while sorting
  and search keep operating on the column's raw data.
- Demo pages for cell templates and a custom range filter; a reference for server-side backends.

## 22.0.2 — 2026-06-18

### Changed

- Discoverability: refined npm keywords and added README badges.

## 22.0.1 — 2026-06-17

### Changed

- Documentation: more readable npm install code blocks.

## 22.0.0 — 2026-06-15

### Added

- Initial public release: the `[dtTable]` directive over the non-jQuery DataTables API, signal
  inputs for options/data, DataTables events as Angular outputs, escaped-by-default rendering with a
  `DomSanitizer`-backed HTML renderer, and the `dt` / `bs5` / `tailwind` / `material` styling
  adapters. Standalone and zoneless-ready; supports Angular 20, 21 and 22.
