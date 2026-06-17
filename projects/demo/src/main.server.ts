import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

// Server bootstrap used by the prerenderer. Only the landing page is prerendered (see
// app.routes.server.ts), and the shared config carries no DataTables providers, so nothing here
// evaluates DataTables/jQuery under Node. The BootstrapContext must be threaded through for the
// server platform to render.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
