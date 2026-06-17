import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// Server-side configuration used only at build time, when the application builder prerenders the
// landing page to static HTML. It reuses the shared (DataTables-free) config and layers the server
// platform plus the per-route render modes on top.
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
