import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Render modes for the prerenderer. Every route is prerendered to static HTML so search engines and
 * LLM crawlers see each page's full content and per-route metadata without running JavaScript. The
 * DataTables tables themselves still enhance on the client only (the directive constructs them in
 * `afterNextRender`), so the prerendered HTML is the plain `<table>` markup plus the page's prose.
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
