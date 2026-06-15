import { InjectionToken } from '@angular/core';
import DataTableCore from 'datatables.net';
import type { Config } from 'datatables.net';

/**
 * The shape of the DataTables constructor (`new (element, options) => Api`).
 *
 * This is the framework-agnostic, **non-jQuery** entry point. The default export of
 * `datatables.net` (and of every styling package such as `datatables.net-dt`) is exactly
 * this constructor — the styling packages return the *same* constructor after registering
 * their CSS classes as a side-effect of import.
 */
export type DataTableConstructor = typeof DataTableCore;

/**
 * DI token for the DataTable constructor the directive instantiates.
 *
 * Defaults to the unstyled core (`datatables.net`). Styling adapters
 * (`ngx-datatables-net/dt`, `/bs5`, `/tailwind`, `/material`) override this token so the
 * directive constructs a styled table without any per-adapter code in the directive itself.
 */
export const DATA_TABLE = new InjectionToken<DataTableConstructor>(
  'ngx-datatables-net: DataTable constructor',
  { providedIn: 'root', factory: () => DataTableCore },
);

/**
 * DI token for application-wide default DataTables options. Merged *under* each table's own
 * `dtOptions` (per-table options win). Provide via `provideDataTables(withOptions({...}))`.
 */
export const DT_DEFAULT_OPTIONS = new InjectionToken<Config>(
  'ngx-datatables-net: default DataTables options',
);

/**
 * DI token for a CSS class the directive adds to the DataTables container element after init.
 *
 * Styling adapters that ship their own scoped stylesheet (Tailwind, Material) provide this so the
 * directive auto-scopes their CSS — e.g. `ngxdt-tailwind` / `ngxdt-material`. This lets the authored
 * adapter CSS be self-contained and lets multiple styling themes coexist on one page.
 */
export const DT_STYLE_SCOPE = new InjectionToken<string>(
  'ngx-datatables-net: container style-scope class',
);

/**
 * When true, the directive escapes every column that has no explicit `render`, overriding
 * DataTables' unsafe HTML-by-default behavior. Enabled via `provideDataTables(withSafeDefaults())`.
 */
export const DT_ESCAPE_DEFAULTS = new InjectionToken<boolean>(
  'ngx-datatables-net: escape columns by default',
);
