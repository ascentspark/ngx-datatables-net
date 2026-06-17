import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DtTableDirective } from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * DOM-sourced table: no `dtData`/`dtColumns`, DataTables reads the data straight from the
 * existing `<table>` markup. Useful for progressive enhancement of server-rendered tables.
 */
@Component({
  selector: 'demo-data-dom',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="DOM-sourced table"
      description="Enhance an existing HTML table. With no dtData/dtColumns, DataTables reads rows directly from the markup, ideal for progressively enhancing server-rendered tables."
      [sources]="sources"
    >
      <table dtTable class="display" style="width:100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Location</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Aisha Khan</td>
            <td>Engineering Manager</td>
            <td>London</td>
            <td>2018-03-01</td>
          </tr>
          <tr>
            <td>Liam Smith</td>
            <td>Software Engineer</td>
            <td>Berlin</td>
            <td>2020-07-15</td>
          </tr>
          <tr>
            <td>Sofia Garcia</td>
            <td>UX Designer</td>
            <td>Toronto</td>
            <td>2019-11-02</td>
          </tr>
          <tr>
            <td>Noah Müller</td>
            <td>Data Analyst</td>
            <td>Tokyo</td>
            <td>2021-01-20</td>
          </tr>
          <tr>
            <td>Mei Chen</td>
            <td>Product Manager</td>
            <td>Singapore</td>
            <td>2017-05-30</td>
          </tr>
          <tr>
            <td>Lucas Rossi</td>
            <td>DevOps Engineer</td>
            <td>Sydney</td>
            <td>2022-02-11</td>
          </tr>
          <tr>
            <td>Priya Patel</td>
            <td>QA Engineer</td>
            <td>San Francisco</td>
            <td>2016-09-19</td>
          </tr>
          <tr>
            <td>Mateo Silva</td>
            <td>Solutions Architect</td>
            <td>London</td>
            <td>2015-12-08</td>
          </tr>
        </tbody>
      </table>
    </demo-example>
  `,
})
export class DataDomSourced {
  protected readonly sources: ExampleSource[] = [
    {
      label: 'template.html',
      lang: 'html',
      code: `<!-- No dtData / dtColumns: DataTables reads the rows from the markup. -->
<table dtTable class="display" style="width:100%">
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Location</th>
      <th>Joined</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Aisha Khan</td><td>Engineering Manager</td><td>London</td><td>2018-03-01</td></tr>
    <tr><td>Liam Smith</td><td>Software Engineer</td><td>Berlin</td><td>2020-07-15</td></tr>
    <tr><td>Sofia Garcia</td><td>UX Designer</td><td>Toronto</td><td>2019-11-02</td></tr>
    <tr><td>Noah Müller</td><td>Data Analyst</td><td>Tokyo</td><td>2021-01-20</td></tr>
    <tr><td>Mei Chen</td><td>Product Manager</td><td>Singapore</td><td>2017-05-30</td></tr>
  </tbody>
</table>`,
    },
  ];
}
