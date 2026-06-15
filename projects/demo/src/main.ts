import { bootstrapApplication } from '@angular/platform-browser';
import DataTable from 'datatables.net';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// DataTables' default error mode is `alert`, which pops a blocking dialog on any extension/config
// error. Use `throw` so problems surface as console errors during development instead.
DataTable.ext.errMode = 'throw';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
