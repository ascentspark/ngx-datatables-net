import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Render modes for the prerenderer. The landing page (`''`) is the primary SEO surface, so it is
 * prerendered to static HTML with its full body, FAQ and structured data. Every example route is
 * an interactive DataTables demo that imports DataTables/jQuery and only works in the browser, so
 * those are shipped as client-rendered routes (no server-side DataTables evaluation, no prerender).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
