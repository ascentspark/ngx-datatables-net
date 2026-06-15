# Architecture & Guiding Principles

> **Status: DRAFT for review.** This document is deliverable #1 of the pre-code phase. It studies
> Angular 20 / 21 / 22, identifies what our library should leverage, and sets the rules we build by.
> Deliverable #2 is [`TASKS.md`](./TASKS.md). **No code until both are reviewed.**
>
> Research date: June 2026. Every non-obvious claim traces to a source in [§7](#7-sources).

---

## 1. What we are building

A modern Angular wrapper around [DataTables](https://datatables.net), consumed through DataTables'
**non-jQuery API** (`new DataTable(element, options)`), published as three parallel release lines —
one per supported Angular major (20, 21, 22) — per the branch model described in §2.1 below.

It replaces the archived `l-lin/angular-datatables` (last release 19.0.0, Dec 2024; NgModule +
jQuery + Zone.js-bound — none of which fit Angular ≥21).

### 1.1 The one fact that reframes everything: "non-jQuery" is API-only

`datatables.net@2.3.8` lists **`jquery: ">=1.7"` as a hard `dependencies` entry** — not peer, not
optional. The `ajax` option maps directly onto jQuery's `$.ajax`. So jQuery is **still bundled and
used internally** even when you write `new DataTable(el, opts)`.

**What "non-jQuery" actually buys us, and why it's still the right call:**
- **jQuery-free call sites** — our code never imports or touches `$`. Clean Angular DI, no `jqlite`
  vs jQuery confusion, no `$(el)` in the wrapper.
- **A constructor that fits zoneless Angular** — `new DataTable(element, options)` takes a native
  element (from `ElementRef`) and returns a typed `Api`. No jQuery plugin registration dance.
- **Honesty obligation:** our docs and `peerDependencies` must state plainly that jQuery is a
  transitive dependency. We do not hide it; we just don't program against it. (Supply-chain
  transparency — see [§4](#4-security-principles).)

---

## 2. Angular 20 / 21 / 22 — what changed, and what we leverage

The three majors share one reactivity/DOM model; the deltas that matter to us are change-detection
defaults, the test runner, toolchain floors, and a handful of removed APIs. **The integration
pattern itself is identical across all three** (see [§3](#3-the-core-integration-pattern)).

### 2.1 Feature/behaviour matrix (only what affects this library)

| Concern | Angular 20 | Angular 21 | Angular 22 |
|---|---|---|---|
| **Zoneless CD** | Dev-preview in 20.0; **stable in 20.2** via `provideZonelessChangeDetection()`. Apps still zoned by default. | **Default.** `zone.js` not shipped in new apps. | Default (unchanged from 21). |
| **Default CD strategy** | `Default` (eager). We must set `OnPush` explicitly. | `Default` (eager). Set `OnPush` explicitly. | **`OnPush` is the default.** `ChangeDetectionStrategy.Default` deprecated → renamed `Eager`. |
| **Test runner** | Karma/Jasmine default; Vitest available. | **Vitest default** (`@angular/build:unit-test`), stable. Karma still supported. | Vitest default; `fakeAsync`/`flush`/`waitForAsync` now work under Vitest. |
| **DOM-init hooks** | `afterNextRender`, `afterEveryRender` (was `afterRender`), `afterRenderEffect` — all available. | same | same |
| **Signal APIs** | `signal/computed/effect/linkedSignal/toSignal/input/output/model/viewChild` stable. `resource()` **experimental**. | same; `resource()` still experimental. | `resource()/rxResource()/httpResource()` **stable**; `injectAsync()`, `@Service()` added; `debounced()` experimental. |
| **Signal Forms** | n/a | **Experimental** (`@angular/forms/signals`). | **Stable.** |
| **Selectorless components** | no | experimental prototype (pre-RFC) | **still experimental — NOT stable.** Marketing blogs claiming "stable in v22" are wrong (not in v22.0.0 release notes). |
| **TypeScript floor** | `>=5.8 <6.0` (5.8.x; widened to `<6` in 20.2) | `>=5.9` | **`>=6.0`** |
| **Node floor** | `^20.19 \|\| ^22.12 \|\| ^24` | `22.x / 24.x` (≈22.22+/24.13+ — verify at pin time) | `22 / 24 / 26` (Node 20 dropped) |
| **HttpClient backend** | XHR default | XHR default | **Fetch default**; `withFetch()` deprecated |
| **Notable removals** | `TestBed.get`, `TestBed.flushEffects`, `InjectFlags`, `provideExperimentalZonelessChangeDetection` (→ `provideZonelessChangeDetection`); `*ngIf/*ngFor/*ngSwitch` deprecated | `HammerModule` removed | `ComponentFactoryResolver`, `ComponentFactory`, `createNgModuleRef`, `ChangeDetectorRef.checkNoChanges`, `provideRoutes` removed |

### 2.2 What we leverage vs. what we deliberately avoid

**Leverage (stable on the lowest line, v20 — so all three branches can use it):**
- **Standalone directives/components** — no NgModule anywhere.
- **Signal inputs/outputs** — `input()`, `model()`, `output()` for options/data/events.
- **`afterNextRender` / `afterRenderEffect` / `DestroyRef`** — the DOM lifecycle bridge (see §3).
- **`@if`/`@for`/`@switch`** and `TestBed.inject`/`TestBed.tick` internally (legacy forms
  deprecated/removed).
- **`ChangeDetectionStrategy.OnPush`** set **explicitly** (default only on v22; harmless on v22).

**Avoid in the public/stable API (version-gated or unstable):**
- **Selectorless components** — not stable even in v22. Every public component/directive ships a
  conventional CSS `selector`. (Selectorless is additive + consumer-side when it lands, so a
  selector-based API is forward-compatible — no lock-in risk.)
- **Signal Forms** — only stable in v22. Do **not** hard-depend on `@angular/forms/signals`. Keep
  table state on plain signals; let consumers wire Signal Forms (or Reactive Forms) on top.
- **`resource()`/`httpResource()`** — only stable in v22, and a read-GET primitive that doesn't fit
  an imperative widget. If we offer a server-side-mode helper, keep it optional/secondary, never a
  core dependency.
- **`@angular/aria` Grid primitives** — dev-preview in 21; tempting for an accessible-grid layer
  later, but not in the stable API yet.
- **`NgZone.onStable` / `onMicrotaskEmpty` / `onUnstable`** — **never** use. They do not emit under
  zoneless (v21+ default). This is the single most common way jQuery-era wrappers break.

---

## 3. The core integration pattern

This is the heart of the library and is **identical across all three Angular majors** because it is
built on APIs stable since v20. Bridging imperative DataTables into declarative, zoneless,
OnPush Angular comes down to four moves:

### 3.1 Initialize after render, browser-only

```ts
// inside the directive
private readonly host = inject(ElementRef<HTMLTableElement>);
private table?: Api<RowT>;

constructor() {
  afterNextRender(() => {                    // browser-only — SSR-safe for free
    this.table = new DataTable(this.host.nativeElement, this.resolvedOptions());
    this.bindEvents(this.table);             // table.on('draw'|'select'|'page'|'xhr', …)
  });                                        // default 'mixedReadWrite'; use {phase:'write'} if needed
}
```

`afterNextRender` runs **only in the browser** — DataTables touches `document`/layout, so this gives
us SSR-safety with no manual `isPlatformBrowser` guard.

### 3.2 Reconcile on input change — cheap path vs. expensive path

This distinction is the library's main **performance** lever:

| Change | Action | Cost |
|---|---|---|
| **Data only** (rows changed) | `table.clear(); table.rows.add(newRows); table.draw();` | cheap — no DOM teardown |
| **Config/columns changed** | `table.off(); table.destroy(); new DataTable(el, newOpts)` | expensive — full re-init |

Drive this from `afterRenderEffect` (or an `effect`) tracking the data/options signals, so it
re-runs after the DOM is committed:

```ts
afterRenderEffect(() => {
  const data = this.data();                  // signal read → tracked
  if (!this.table) return;
  this.table.clear().rows.add(data).draw();  // cheap path
});
```

Config changes are detected separately and routed to the destroy+recreate path.

### 3.3 Bridge events back into Angular explicitly (zoneless-correct)

DataTables events fire **outside** Angular. Under zoneless/OnPush, nothing re-renders unless we say
so. Two acceptable mechanisms, in order of preference:

1. **Write a signal** that the consumer reads (selection, page, search state) → auto-triggers CD.
2. **`output().emit(...)`** for discrete events (draw, rowClick) → the consumer's template binding
   marks the view.

For high-frequency internal churn (scroll/redraw), wrap DataTables' own handlers in
`NgZone.runOutsideAngular(...)` so they don't thrash CD in *zoned* host apps; re-enter via a signal
write only when state must surface. **Never** rely on `NgZone.run()` alone to schedule a render
(it's a no-op for CD under zoneless), and **never** touch `onStable`/`onMicrotaskEmpty`.

### 3.4 Tear down deterministically

```ts
inject(DestroyRef).onDestroy(() => {
  this.table?.off();        // detach listeners
  this.table?.destroy();    // DataTables requires this to avoid memory leaks
});
```

---

## 4. Security principles

DataTables **writes to the DOM directly (via jQuery), bypassing Angular's template sanitization.**
`DomSanitizer` only guards values bound through Angular templates/`[innerHTML]` — it does **not**
see HTML that DataTables injects through `columns.render`.

> **Corrected during implementation (verified by visual testing):** DataTables does **NOT** escape
> cell content by default — it writes data as `innerHTML`, so untrusted data is a live XSS sink out
> of the box. (An earlier draft of this doc wrongly assumed DataTables escapes by default.) We
> neutralise this ourselves. Therefore:

- **Escaped-by-default — enforced by us, not DataTables.** `provideDataTables(withSafeDefaults())`
  makes the directive append a lowest-priority `{ targets: '_all', render: escapeHtmlRenderer() }`
  to `columnDefs`. DataTables precedence means any explicit `columns[].render` (or earlier
  `columnDefs`) wins, so only columns *without* a custom renderer are escaped. With this enabled, no
  consumer data reaches the DOM as raw HTML unless a column explicitly opts in.
- **HTML renderers are opt-in + funnelled through a sanitizer hook.** When a consumer wants an HTML
  cell renderer, they pass it explicitly, and we offer a hook that runs values through
  `DomSanitizer.sanitize(SecurityContext.HTML, …)` before they reach DataTables. Document loudly
  that custom HTML renderers are the consuming app's trust boundary.
- **CSP / Trusted Types.** jQuery/DataTables' `innerHTML`-style writes can trip
  `require-trusted-types-for 'script'`. We test the demo under a Trusted Types CSP and document any
  policy/nonce requirements. The wrapper itself uses no `eval`/inline-script.
- **Supply-chain transparency & integrity.** `datatables.net` (+ its bundled jQuery) and `@angular/*`
  are **peerDependencies** — the consuming app owns, dedupes, and audits them, and CVEs are resolved
  in the app's tree, not pinned by us. We commit a lockfile, publish with **npm provenance**
  (`--provenance` via CI/OIDC), and **explicitly disclose the transitive jQuery dependency**.
- **No `@types/datatables.net`.** DataTables 2.x ships its own bundled `.d.ts`; installing the
  DefinitelyTyped package causes namespace conflicts. We consume and re-export DataTables' own
  `Config`/`Api` types.

---

## 5. Flexibility principles

- **Directive-on-`<table>` as the primary surface**, with an **escape hatch** to the underlying
  `Api`. Keep l-lin's good ergonomics (`<table dtTable …>`); discard its `dtTrigger` Subject,
  `NgModule`, Zone reliance, and bespoke `ADTSettings` type.
- **Signals replace the manual re-render trigger.** A `data` signal input drives reconciliation
  automatically (§3.2). No `dtTrigger.next()` dance — the #1 historical pain point.
- **Reuse DataTables' own types**, generic over the row type, so consumers get typed `data`/`columns`
  and IDE help. Re-export `Config` and `Api` from our public API.
- **Secondary entry points for styling adapters.** Core wrapper is styling-agnostic; ship four
  optional adapters as **secondary entry points** (nested `ng-package.json` + own `public-api.ts`):
  `ngx-datatables-net/dt`, `/bs5`, `/tailwind`, `/material`. `dt`/`bs5` peer-depend on the upstream
  styling packages (`datatables.net-dt`/`-bs5`); **`tailwind` and `material` have no upstream
  package — we author them** via DataTables' class-config API + a shipped stylesheet (a
  differentiator, since DataTables officially supports neither). Consumers import only what they
  use — tree-shakable.
- **Extensions are pass-through, not wrapped.** DataTables' 15 official extensions (Buttons, Select,
  Responsive, FixedHeader, FixedColumns, Scroller, RowGroup, RowReorder, ColReorder, SearchPanes,
  SearchBuilder, DateTime, KeyTable, AutoFill, StateRestore) are activated purely through `Config`
  options once their package is imported. The directive must **forward the full `Config` untouched**
  so **every extension — present and future — works with zero per-extension code on our side**. We
  do not bundle extensions; the consumer imports the ones they use (their peer/optional deps). The
  escape-hatch `Api` covers any extension's imperative API. (Editor is commercial — we document
  compatibility, never bundle it.)
- **Works in both zoned and zoneless hosts**, because the pattern never depends on Zone (§3.3).
- **One canonical implementation across branches** (see §6) — features don't fork per version.

---

## 6. Speed principles — runtime *and* maintenance

**Runtime:**
- **Cheap reconcile path** (`clear/rows.add/draw`) for data changes; reserve destroy+recreate for
  config changes (§3.2).
- **`OnPush` + signals** — minimal CD; set OnPush explicitly on v20/v21.
- **`runOutsideAngular`** for DataTables' high-frequency internal handlers (§3.3).
- **Tree-shakable, side-effect-free package** — `"sideEffects": false` (list CSS adapters explicitly
  if any are side-effectful, e.g. `"sideEffects": ["*.css"]`). FESM2022 + partial-Ivy via ng-packagr.

**Maintenance (this is a multi-branch project — backport cost is a first-class concern):**
- **Write to the lowest-common-denominator API (v20-stable) so the source is near-identical on all
  three branches.** Per-branch deltas should be confined to: `peerDependencies` ranges, TS/Node
  pins, test-runner config, and the explicit-`OnPush` line (no-op on v22). This makes a fix on
  `main` a clean cherry-pick to `21.x`/`20.x` (newest → oldest), per the branch model.
- **No version-specific feature forks** in the wrapper. If a v22-only capability is compelling
  (e.g. a Signal Forms filter helper), it ships as an **optional secondary entry point on the `main`
  line only**, never woven into the core directive.

---

## 7. Sources

**Angular 20:** [Announcing v20](https://blog.angular.dev/announcing-angular-v20-b5c9c06cf301) ·
[Summer Update 2025 (zoneless stable in 20.2)](https://blog.angular.dev/angular-summer-update-2025-1987592a0b42) ·
[v20.0.0 release notes](https://github.com/angular/angular/releases/tag/20.0.0) ·
[Versions table](https://angular.dev/reference/versions) ·
[Zoneless guide](https://angular.dev/guide/zoneless) ·
[afterNextRender](https://angular.dev/api/core/afterNextRender) ·
[afterEveryRender](https://angular.dev/api/core/afterEveryRender) ·
[afterRenderEffect](https://angular.dev/api/core/afterRenderEffect)

**Angular 21:** [Announcing v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b) ·
[What's new in 21.0 — Ninja Squad](https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0) ·
[What's new in 21 — angulararchitects](https://www.angulararchitects.io/blog/whats-new-in-angular-21-signal-forms-zone-less-vitest-angular-aria-cli-with-mcp-server/) ·
[Migrating to Vitest](https://angular.dev/guide/testing/migrating-to-vitest) ·
[provideZonelessChangeDetection](https://angular.dev/api/core/provideZonelessChangeDetection)

**Angular 22:** [v22.0.0 release notes](https://github.com/angular/angular/releases/tag/v22.0.0) ·
[What's new in 22.0 — Ninja Squad](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0) ·
[Angular 22 — angulararchitects](https://www.angulararchitects.io/en/blog/angular-22-the-most-important-new-features-at-a-glance/) ·
[Angular 22 key features — angular.love](https://angular.love/angular-22-key-features-and-changes) ·
[Selectorless strategy — Gechev](https://blog.angular.dev/angular-2025-strategy-9ca333dfc334)

**DataTables & library authoring:**
[npm: datatables.net](https://registry.npmjs.org/datatables.net/latest) ·
[npm: datatables.net-dt](https://registry.npmjs.org/datatables.net-dt/latest) ·
[Installation](https://datatables.net/manual/installation) ·
[API constructor](https://datatables.net/manual/api) ·
[server-side](https://datatables.net/manual/server-side) ·
[destroy()](https://datatables.net/reference/api/destroy()) ·
[on()](https://datatables.net/reference/api/on()) ·
[l-lin/angular-datatables (archived)](https://github.com/l-lin/angular-datatables) ·
[Creating libraries](https://angular.dev/tools/libraries/creating-libraries) ·
[Angular Package Format](https://angular.dev/tools/libraries/angular-package-format) ·
[ng-packagr secondary entry points](https://github.com/ng-packagr/ng-packagr/blob/main/docs/secondary-entrypoints.md)

### Open items to confirm at pin-time (not blockers for the architecture)
- Exact Node floors for v21 (≈22.22/24.13) and v22 (Node 22 minor) — verify against
  [angular.dev/reference/versions](https://angular.dev/reference/versions) when setting CI matrices.
- Exact `ng-packagr` version paired with each Angular major (`npm view ng-packagr`).
- The karma→vitest schematic name on v21 (`ng generate --help`), if we document a Karma fallback.
