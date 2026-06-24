// MUST be first: installs a jsdom window/document global so DataTables' bundled jQuery initialises
// during prerender (every route is prerendered now), before any route chunk that imports
// `datatables.net` is evaluated.
import './ssr-dom-polyfill';

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

// Server bootstrap used by the prerenderer. Every route is prerendered (see app.routes.server.ts);
// the tables still build in the browser only, so the prerendered HTML is plain markup plus prose.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
