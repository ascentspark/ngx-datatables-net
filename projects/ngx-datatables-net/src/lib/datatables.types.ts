/**
 * Type re-exports from DataTables' own bundled type definitions.
 *
 * DataTables 2.x ships its own `.d.ts` (`datatables.net/types/types.d.ts`). We re-export the
 * relevant types so consumers never have to import from `datatables.net` directly and never
 * install the obsolete `@types/datatables.net` DefinitelyTyped package (which conflicts).
 */
export type {
  Config,
  ConfigColumns,
  ConfigColumnDefs,
  ConfigLanguage,
  ConfigSearch,
  Api,
  AjaxSettings,
  AjaxData,
  AjaxResponse,
} from 'datatables.net';

import type { Config, Api } from 'datatables.net';

/** Convenience alias mirroring DataTables' `Config` (options object). */
export type DtConfig = Config;

/** Convenience generic alias for the DataTables `Api` instance, typed over the row shape. */
export type DtApi<T = unknown> = Api<T>;
