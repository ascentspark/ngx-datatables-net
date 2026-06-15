import DataTable from 'datatables.net';
import { DATA_TABLE, DT_STYLE_SCOPE, type DataTablesFeature } from 'ngx-datatables-net';

/** Options for the Tailwind styling adapter. */
export interface TailwindStylingOptions {
  /**
   * Extra class(es) to scope the adapter stylesheet under. Defaults to `'ngxdt-tailwind'`.
   * Override only if you ship a customized copy of the stylesheet under a different scope.
   */
  scopeClass?: string;
}

/**
 * Use the authored Tailwind styling.
 *
 * DataTables ships no official Tailwind package, so this adapter uses the core constructor and a
 * self-contained, scoped stylesheet (`ngx-datatables-net/tailwind/styles/...css`). The directive
 * adds the `ngxdt-tailwind` scope class to the container automatically.
 *
 * @example
 * provideDataTables(withTailwind())
 */
export function withTailwind(options: TailwindStylingOptions = {}): DataTablesFeature {
  return {
    providers: [
      { provide: DATA_TABLE, useValue: DataTable },
      { provide: DT_STYLE_SCOPE, useValue: options.scopeClass ?? 'ngxdt-tailwind' },
    ],
  };
}
