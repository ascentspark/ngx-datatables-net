import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import type { Config } from 'datatables.net';
import { DT_DEFAULT_OPTIONS, DT_ESCAPE_DEFAULTS } from './datatables.tokens';

/**
 * A composable unit of DataTables configuration. Styling adapters
 * (`ngx-datatables-net/dt`, `/bs5`, `/tailwind`, `/material`) each export a `with*()` feature
 * returning one of these.
 */
export interface DataTablesFeature {
  readonly providers: Provider[];
}

/**
 * Configure ngx-datatables-net at the application (or route/component) level.
 *
 * @example
 * // app.config.ts
 * providers: [provideDataTables(withDefaultStyling(), withOptions({ pageLength: 25 }))]
 */
export function provideDataTables(...features: DataTablesFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders(features.flatMap((feature) => feature.providers));
}

/**
 * Set application-wide default DataTables options, merged *under* each table's own `dtOptions`.
 */
export function withOptions(defaults: Config): DataTablesFeature {
  return { providers: [{ provide: DT_DEFAULT_OPTIONS, useValue: defaults }] };
}

/**
 * Escape every column that has no explicit `render`, overriding DataTables' unsafe
 * HTML-by-default behavior. Strongly recommended whenever a table can display untrusted data.
 * Columns with their own `render` (including the sanitized-HTML renderer) are left untouched.
 *
 * @example
 * provideDataTables(withDefaultStyling(), withSafeDefaults())
 */
export function withSafeDefaults(): DataTablesFeature {
  return { providers: [{ provide: DT_ESCAPE_DEFAULTS, useValue: true }] };
}
