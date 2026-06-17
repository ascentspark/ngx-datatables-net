import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DtTableDirective } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';

/**
 * Renders the employee table for the styling pages. Each page provides a different styling adapter
 * at component level (so the adapter, and the global DataTables styling it sets, only loads when
 * that page is opened) and passes any lazy CSS bundles to load while the page is on screen.
 */
@Component({
  selector: 'demo-styled-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective],
  template: `
    <table
      dtTable
      class="display"
      style="width:100%"
      data-testid="styled-table"
      [dtData]="data"
      [dtColumns]="columns"
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
  `,
})
export class StyledTable {
  /** Hrefs of lazy CSS bundles (angular.json, inject:false) to load while this page is open. */
  readonly lazyStyles = input<string[]>([]);

  private readonly doc = inject(DOCUMENT);
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly data: readonly Employee[] = EMPLOYEES;

  constructor() {
    const added: HTMLLinkElement[] = [];
    afterNextRender(() => {
      for (const href of this.lazyStyles()) {
        const link = this.doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        this.doc.head.appendChild(link);
        added.push(link);
      }
    });
    inject(DestroyRef).onDestroy(() => added.forEach((l) => l.remove()));
  }
}
