import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import DataTable from 'datatables.net';
import { provideDataTables, withOptions, withSafeDefaults } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';

import { appConfig } from './app/app.config';
import { App } from './app/app';

// DataTables' default error mode is `alert`, which pops a blocking dialog on any extension/config
// error. Use `throw` so problems surface as console errors during development instead.
DataTable.ext.errMode = 'throw';

// DataTables providers live in the browser entry only. The shared appConfig stays DataTables-free
// so the prerenderer can render the landing page without evaluating DataTables/jQuery under Node.
const browserConfig = mergeApplicationConfig(appConfig, {
  providers: [
    provideDataTables(
      // Default ("dt") styling adapter.
      withDefaultStyling(),
      // Escape columns without an explicit renderer, neutralises DataTables' unsafe
      // HTML-by-default behavior across every example table.
      withSafeDefaults(),
      withOptions({ pageLength: 10, lengthMenu: [5, 10, 25, 50, 100] }),
    ),
  ],
});

bootstrapApplication(App, browserConfig).catch((err) => console.error(err));
