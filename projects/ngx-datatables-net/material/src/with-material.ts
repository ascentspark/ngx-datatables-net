import DataTable from 'datatables.net';
import { DATA_TABLE, DT_STYLE_SCOPE, type DataTablesFeature } from 'ngx-datatables-net';

/** Options for the Material styling adapter. */
export interface MaterialStylingOptions {
  /**
   * Extra class(es) to scope the adapter stylesheet under. Defaults to `'ngxdt-material'`.
   * Override only if you ship a customized copy of the stylesheet under a different scope.
   */
  scopeClass?: string;
}

/**
 * Use the authored Material Design styling.
 *
 * DataTables ships no official Material package, so this adapter uses the core constructor and a
 * self-contained, scoped stylesheet (`ngx-datatables-net/material/styles/...css`). The directive
 * adds the `ngxdt-material` scope class to the container automatically.
 *
 * @example
 * provideDataTables(withMaterial())
 */
export function withMaterial(options: MaterialStylingOptions = {}): DataTablesFeature {
  return {
    providers: [
      { provide: DATA_TABLE, useValue: DataTable },
      { provide: DT_STYLE_SCOPE, useValue: options.scopeClass ?? 'ngxdt-material' },
    ],
  };
}
