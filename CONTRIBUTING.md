# Contributing to ngx-datatables-net

Thanks for your interest in improving **ngx-datatables-net**. This project is an
Angular wrapper around [DataTables](https://datatables.net), maintained by
[Ascentspark](https://ascentspark.com). Bug reports, fixes, docs and feature
ideas are all welcome.

By participating you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and small fixes** — open an issue first if the bug isn't already
  tracked, then send a pull request.
- **New features** — please open an issue to discuss the design before writing
  code, so we can agree on the public surface. The library guards its public API
  carefully (`projects/ngx-datatables-net/src/public-api.ts`).
- **Security issues** — do **not** open a public issue. See
  [docs/SECURITY.md](docs/SECURITY.md) for how to report privately.

## Release lines and branches

We maintain three parallel release lines, one per supported Angular major. The
library major mirrors the Angular major it targets.

| Library major | Targets Angular | Branch          | npm dist-tag |
|---------------|-----------------|-----------------|--------------|
| `22.x`        | Angular 22      | `main` (newest) | `latest`     |
| `21.x`        | Angular 21      | `21.x`          | `ng21`       |
| `20.x`        | Angular 20      | `20.x`          | `ng20`       |

- `main` always holds the **newest** in-development major. Older supported
  majors live on the long-lived `21.x` and `20.x` branches.
- **Where to target your PR:** land cross-cutting fixes against **`main`**
  first. We cherry-pick back to `21.x` and `20.x` (newest → oldest) where they
  apply. If a fix is specific to an older Angular major, target that branch
  directly and say so in the PR.
- Each branch's `peerDependencies` pin a single Angular major. Don't widen the
  peer range to span majors.

## Workspace layout

Standard Angular CLI multi-project workspace:

```
angular.json
projects/
  ngx-datatables-net/   # the publishable library (ng-packagr)
    src/public-api.ts    # the package's public surface
  demo/                 # consumer app: manual test bed + live docs
```

## Getting set up

```bash
# Install dependencies
npm install

# Build the publishable library (Angular Package Format)
ng build ngx-datatables-net

# Run the demo app against the library
ng serve demo

# Run the library unit tests
ng test ngx-datatables-net

# Lint
ng lint
```

A few notes:

- **Test runner:** Angular 21+ uses **Vitest** (not Karma). Run a single test by
  name with `ng test ngx-datatables-net -- -t "directive initializes"`.
- **Demo bundles the built library.** If you change the library while
  `ng serve demo` is running, the served bundle can go stale — rebuild the
  library and restart the dev server (clear `.angular/cache` if it persists).
- **DataTables is a peer dependency.** Don't promote it to a hard dependency.

## Coding conventions

These are load-bearing decisions — please keep PRs consistent with them:

1. **No jQuery in our code.** Use the non-jQuery DataTables constructor
   (`new DataTable(element, options)`), never `$('#t').DataTable(...)`. Consumers
   must never have to touch jQuery.
2. **Zoneless-safe.** The library targets zoneless change detection. Initialize
   DataTables outside Angular's change detection and re-enter deliberately; don't
   assume Zone.js will catch DataTables' DOM/AJAX callbacks.
3. **Declarative surface.** Prefer the directive/standalone-component API:
   options and data as signal inputs, DataTables events as outputs, with an
   escape hatch to the underlying `DataTables.Api`.
4. **Mind the XSS boundary.** DataTables renders with `innerHTML` and bypasses
   Angular's sanitizer. Any feature that renders consumer data must escape by
   default or document the trust boundary. See [docs/SECURITY.md](docs/SECURITY.md).
5. **Modern Angular only.** Standalone APIs and signals — no NgModule/Zone.js
   patterns from the predecessor library.

## Submitting a pull request

1. Fork and branch off the correct base (usually `main`).
2. Keep the change focused; one logical change per PR.
3. Add or update tests for behavior changes. Make sure `ng test
   ngx-datatables-net` and `ng lint` pass.
4. If you touched the public API, update `public-api.ts` and the relevant docs.
5. Update [CHANGELOG.md](CHANGELOG.md) under the appropriate release line.
6. Fill in the pull request template and link the issue it resolves.

CI builds and tests each release line against its own pinned Angular major, so a
green local run on one major doesn't guarantee the others — keep changes
portable across majors where you can.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE) that covers this project.
