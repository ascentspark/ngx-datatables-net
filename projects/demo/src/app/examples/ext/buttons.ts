import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';
import DataTable from 'datatables.net';
// Register the Buttons extension + the HTML5 (copy/csv/excel/pdf) and print button modules.
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-buttons/js/buttons.print';
import 'datatables.net-buttons/js/buttons.colVis';
import JSZip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Wire the optional export dependencies into Buttons (Excel needs JSZip; PDF needs pdfMake + fonts).
(
  DataTable as unknown as {
    Buttons: { jszip: (z: unknown) => void; pdfMake: (p: unknown) => void };
  }
).Buttons.jszip(JSZip);
const fonts = pdfFonts as unknown as { pdfMake?: { vfs?: unknown }; vfs?: unknown };
(pdfMake as unknown as { vfs: unknown }).vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? {};
(DataTable as unknown as { Buttons: { pdfMake: (p: unknown) => void } }).Buttons.pdfMake(pdfMake);

/**
 * Buttons extension: export to Copy / CSV / Excel / PDF / Print, plus a column-visibility button.
 * The directive passes the `layout` + `buttons` options straight through — no per-extension code.
 */
@Component({
  selector: 'demo-ext-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="Buttons (export)"
      description="Export to Copy, CSV, Excel, PDF and Print via the Buttons extension, plus a column-visibility toggle. JSZip powers Excel and pdfMake powers PDF — wired once at module load."
      [sources]="sources"
    >
      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
        [dtOptions]="options"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Age</th>
            <th>Start date</th>
            <th>Salary</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>
    </demo-example>
  `,
})
export class ExtButtons {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly options: Config = {
    layout: {
      topStart: {
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print', 'colvis'],
      },
    },
  };

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `import DataTable from 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-buttons/js/buttons.print';
import JSZip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

DataTable.Buttons.jszip(JSZip);
pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs;
DataTable.Buttons.pdfMake(pdfMake);

options: Config = {
  layout: { topStart: { buttons:
    ['copy','csv','excel','pdf','print','colvis'] } },
};`,
    },
    {
      label: 'install',
      lang: 'bash',
      code: `npm i datatables.net-buttons datatables.net-buttons-dt jszip pdfmake
# angular.json styles:
#   "node_modules/datatables.net-buttons-dt/css/buttons.dataTables.css"`,
    },
  ];
}
