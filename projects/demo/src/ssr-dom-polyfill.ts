/// <reference types="node" />
/**
 * Server-only DOM shim for prerendering.
 *
 * Several demo routes (and the library) import `datatables.net`, which pulls in jQuery. jQuery's
 * UMD bundle throws `$.extend is not a function` / "jQuery requires a window with a document" when
 * it is evaluated under Node with no global `window`, which breaks prerendering those routes.
 *
 * This provides a minimal jsdom `window`/`document` global so jQuery initialises during prerender.
 * The tables are never constructed on the server — `DtTableDirective` builds them in
 * `afterNextRender` (browser only) — so this only un-breaks the module load, letting every route
 * prerender to static HTML. Angular itself renders through its own injected `DOCUMENT`, not these
 * globals. This file is imported only from `main.server.ts`, so browser bundles never include it.
 *
 * jsdom is resolved with `createRequire` so it stays external to the (ESM) server bundle.
 */
import { createRequire } from 'node:module';

const globalRef = globalThis as unknown as Record<string, unknown>;

if (typeof globalRef['window'] === 'undefined') {
  const nodeRequire = createRequire(import.meta.url);
  const jsdom = nodeRequire('jsdom') as {
    JSDOM: new (html: string, options: object) => { window: Record<string, unknown> };
  };
  const { window } = new jsdom.JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://ngx-datatables-net.ascentspark.com/',
  });

  globalRef['window'] = window;
  globalRef['document'] = window['document'];
  globalRef['HTMLElement'] = window['HTMLElement'];
  // Note: `globalThis.navigator` is a read-only getter in Node 18+, so it is left as-is. jQuery and
  // DataTables read `window.navigator` from the jsdom window above, which is sufficient.
}

export {};
