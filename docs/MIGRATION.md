# Migrating from `angular-datatables` (l-lin)

`ngx-datatables-net` replaces the archived `angular-datatables`. The concepts map across, but the
mechanics are modern (standalone, signals, zoneless). Here's the translation.

## At a glance

| `angular-datatables` | `ngx-datatables-net` |
|----------------------|----------------------|
| `DataTablesModule` (NgModule import) | `DtTableDirective` (standalone import) + `provideDataTables(...)` |
| `[dtOptions]="dtOptions"` | `[dtOptions]="options"` (typed `Config`, structural change detection) |
| `[dtTrigger]="dtTrigger"` + `dtTrigger.next()` | **gone**, assign a new `[dtData]` array; the table reconciles automatically |
| `[dtInstance]` promise | `(dtInit)="..."` output **or** `#t="dtTable"` → `t.instance()` signal |
| `ADTSettings` bespoke type | DataTables' own `Config` (re-exported) |
| jQuery + `zone.js` reliance | non-jQuery API, zoneless-ready |
| custom HTML in cells (unescaped) | escaped by default (`withSafeDefaults()`) + sanitized opt-in |

## Module → standalone + providers

Before:

```ts
@NgModule({ imports: [DataTablesModule] })
export class AppModule {}
```

After:

```ts
// app.config.ts
providers: [
  provideZonelessChangeDetection(),
  provideDataTables(withDefaultStyling(), withSafeDefaults()),
]
// component
imports: [DtTableDirective]
```

## The `dtTrigger` Subject is gone

This was the #1 source of bugs in the old library. You no longer call `dtTrigger.next()` after data
arrives. Instead, drive the table from a signal:

```ts
// before
this.dtTrigger.next(this.dtOptions);

// after
this.data.set(rows); // a new array reference reconciles the table (clear → rows.add → draw)
```

## Reaching the underlying API

```ts
// before
this.dtElement.dtInstance.then((api: Api) => api.column(0).visible(false));

// after, via output
onInit(api: Api<Row>) { api.column(0).visible(false); }
// after, via template ref
table = viewChild.required<DtTableDirective<Row>>('t');
this.table().instance()?.column(0).visible(false);
```

## Options & columns

Use DataTables' own `Config` / `ConfigColumns` types (re-exported from `ngx-datatables-net`) instead
of `ADTSettings`. Do **not** install `@types/datatables.net`, DataTables 2.x ships its own types and
the DefinitelyTyped package conflicts.

## Custom controls

If you wired per-column search inputs into `<tfoot>` and bound jQuery handlers, move those inputs
**outside** the table and call the `Api` from Angular handlers (`api.column(i).search(v).draw()`).
DataTables rewrites header/footer DOM, which detaches framework event listeners.

## Version selection

Install the package major matching your Angular major: `ngx-datatables-net@20`, `@21`, or `@22`
(`latest`).
