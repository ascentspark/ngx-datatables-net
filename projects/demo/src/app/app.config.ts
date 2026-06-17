import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

/**
 * Shared application config used by both the browser bootstrap and the prerenderer. It deliberately
 * contains NO DataTables providers: those (and the styling-adapter import they pull in) live in the
 * browser entry `main.ts` only, so the server bundle that prerenders the landing page never has to
 * evaluate DataTables/jQuery.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Explicit zoneless: the default on Angular 21/22, and REQUIRED when this demo is ported to
    // the Angular 20 branch (where zoneless is opt-in). Keeping it explicit makes the demo
    // version-portable across all three release lines.
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
