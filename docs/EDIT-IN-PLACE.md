# Edit in place

`[dtEditable]` is a companion directive for `[dtTable]` that adds double-click-to-edit editing to a
table. A column opts in by carrying an `editor` configuration; a column with no `editor` is
read-only. Double-clicking an editable cell opens the configured control; **Enter** or clicking away
commits, **Escape** cancels, and **Tab** moves to the next editable cell in the row.

It uses the same non-jQuery DataTables `Api` as the rest of the library, writes committed values back
through `cell().data()` so sorting, filtering and search stay correct, and runs correctly under
zoneless change detection.

## Quick start

Add `dtEditable` to the same `<table>` as `dtTable`, and give the columns you want to edit an
`editor`:

```ts
import { Component, signal } from '@angular/core';
import { DtTableDirective, DtEditableDirective, type DtColumn } from 'ngx-datatables-net';

interface Person {
  name: string;
  office: string;
}

@Component({
  selector: 'app-people',
  imports: [DtTableDirective, DtEditableDirective],
  template: `
    <table dtTable dtEditable [dtData]="people()" [dtColumns]="columns" class="display">
      <thead>
        <tr><th>Name</th><th>Office</th></tr>
      </thead>
    </table>
  `,
})
export class PeopleComponent {
  people = signal<Person[]>([{ name: 'Ada', office: 'London' }]);

  columns: DtColumn<Person>[] = [
    { data: 'name', title: 'Name', editor: { type: 'text' } },
    {
      data: 'office',
      title: 'Office',
      editor: {
        type: 'select',
        options: [
          { value: 'London', label: 'London' },
          { value: 'Tokyo', label: 'Tokyo' },
        ],
      },
    },
  ];
}
```

> The row objects you bind to `[dtData]` must be **mutable** — committing an edit writes the new value
> onto the row object. Do not freeze the data array's objects.

## Editor types

Every editor is configured by its `type`. All editors share the optional `ariaLabel`, `disabled` and
`validate` fields described under [Validation](#validation) and [Per-cell control](#per-cell-control).

| `type`         | Control                       | Committed value                              |
| -------------- | ----------------------------- | -------------------------------------------- |
| `text`         | `<input type="text">`         | `string`                                     |
| `textarea`     | `<textarea>`                  | `string` (commit with Ctrl/⌘+Enter, or blur) |
| `number`       | `<input type="number">`       | `number`, or `null` when blank               |
| `date`         | `<input type="date">`         | ISO `yyyy-mm-dd` string, or `null` when blank |
| `checkbox`     | checkbox                      | `boolean`                                    |
| `select`       | `<select>`                    | the chosen option's `value`                  |
| `multiselect`  | `<select multiple>`           | an **array** of the chosen option values     |
| `custom`       | your `<ng-template>`          | whatever your control passes to `commit()`   |

Type-specific options:

```ts
{ type: 'text', placeholder: 'Full name', maxLength: 80 }
{ type: 'textarea', rows: 4, maxLength: 500 }
{ type: 'number', min: 0, max: 120, step: 1 }
{ type: 'date', min: '2000-01-01', max: '2030-12-31' }
{ type: 'select', options, placeholder: 'Pick one' }
{ type: 'multiselect', options, separator: ' / ' }   // separator is used only for display joins
```

`options` is either a static array of `{ value, label, disabled? }` or a function
`(ctx) => options` resolved per cell, so the choice set can depend on the row being edited.

### Custom editor

For anything beyond the built-ins, use a `custom` editor backed by an `<ng-template>`. The template
receives the current `value` plus `commit(value)` and `cancel()` callbacks:

```html
<table dtTable dtEditable [dtData]="people()" [dtColumns]="columns()">
  <thead><tr><th>Rating</th></tr></thead>
</table>

<ng-template #ratingTpl let-value let-commit="commit" let-cancel="cancel">
  @for (n of [1, 2, 3, 4, 5]; track n) {
    <button type="button" (click)="commit(n)">{{ n <= value ? '★' : '☆' }}</button>
  }
  <button type="button" (click)="cancel()">✕</button>
</ng-template>
```

```ts
ratingTpl = viewChild<TemplateRef<DtEditorTemplateContext<Person>>>('ratingTpl');

columns = computed<DtColumn<Person>[] | undefined>(() => {
  const rating = this.ratingTpl();
  if (!rating) return undefined;
  return [{ data: 'rating', title: 'Rating', editor: { type: 'custom', template: rating } }];
});
```

## Validation

Add a synchronous `validate` to any editor. Return an error message to block the commit (shown
inline under the control), or `null`/`undefined` to allow it:

```ts
{ type: 'text', validate: (value, row) => (String(value).includes('@') ? null : 'Enter a valid email') }
```

Pressing Enter on an invalid value keeps the editor open and shows the message. Blurring away from an
invalid value discards the change instead of trapping focus.

## Saving (synchronous or pessimistic async)

By default a commit writes straight to the cell. To persist changes (e.g. to a server) before the
cell updates, bind a `[dtSave]` handler. It runs **before** the cell is written:

- return `void` (or any non-thenable) for a synchronous commit;
- return a `Promise` or `Observable` to defer the write until it settles — the control shows a busy
  state meanwhile;
- reject or throw to keep the cell unchanged, surface `dtCellEditError`, and leave the editor open so
  the user can retry or press Escape.

```ts
save: DtCellSaveHandler<Person> = (commit) =>
  fetch(`/api/people/${(commit.row as Person).id}`, {
    method: 'PATCH',
    body: JSON.stringify({ [String(commit.columnKey)]: commit.newValue }),
  }).then((r) => {
    if (!r.ok) throw new Error('Could not save');
  });
```

```html
<table dtTable dtEditable [dtData]="people()" [dtColumns]="columns" [dtSave]="save"></table>
```

## Events

| Output               | Payload                | Fired when                                            |
| -------------------- | ---------------------- | ----------------------------------------------------- |
| `dtCellEditStart`    | `DtEditContext`        | an editor opens                                       |
| `dtCellEdit`         | `DtCellEditCommit`     | a changed value is validated, saved and written       |
| `dtCellEditCancel`   | `DtCellEditCancel`     | an edit is abandoned (Escape, no change, redraw, …)   |
| `dtCellEditError`    | `DtCellEditError`      | a save handler rejects (the cell is left unchanged)   |

Each payload carries the `api`, `row`, `rowIndex`, `colIndex`, `columnKey` and cell `value`; commit
and error payloads add `oldValue` and `newValue`.

## Per-cell control

- **Read-only column**: omit `editor`.
- **Disable specific cells**: add `disabled: (ctx) => boolean` to the editor. Returning `true` makes
  that cell non-editable while leaving the rest of the column editable.

## Keyboard and accessibility

- **Enter** commits (Ctrl/⌘+Enter in a textarea, where plain Enter inserts a newline).
- **Escape** cancels and restores the cell.
- **Tab / Shift+Tab** commit the current cell and move to the next/previous editable cell in the row.
- After a keyboard-driven close, focus returns to the cell.
- Controls are labelled from the column title; override with the editor's `ariaLabel`.

## Behaviour notes

- Only one editor is open at a time. Opening another cell commits the current one first.
- Sorting, paging, filtering or replacing the data while an editor is open closes it (the in-progress
  edit is discarded, not silently saved).
- A column can carry **both** a cell template (`dtTemplate`) and an `editor`: the cell renders with
  your template, and editing opens over it seeded with the raw underlying value.

## Security

Editor controls are built with DOM value bindings and Angular templates — never `innerHTML` — so the
editing path introduces no HTML-injection sink. Committed values flow back through the cell's normal
display path, which still honours the library's escaping/sanitising renderers (see
[Security](SECURITY.md)).
