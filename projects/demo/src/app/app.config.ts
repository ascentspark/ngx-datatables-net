import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideDataTables, withOptions, withSafeDefaults } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

import { routes } from './app.routes';

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
    // DataTables: default ("dt") styling adapter + a couple of app-wide option defaults.
    provideDataTables(
      withDefaultStyling(),
      // Escape columns without an explicit renderer — neutralises DataTables' unsafe
      // HTML-by-default behavior across every example table.
      withSafeDefaults(),
      withOptions({ pageLength: 10, lengthMenu: [5, 10, 25, 50, 100] }),
    ),
  ],
};
