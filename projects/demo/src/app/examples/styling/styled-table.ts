import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DtTableDirective } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';

/**
 * Renders the employee table. Reused across the four styling routes — each route supplies a
 * different styling adapter via route-level `providers`, proving the SAME directive renders under
 * any adapter with zero per-style code. Routes may also pass `data.styles` (hrefs of lazy CSS
 * bundles, e.g. Bootstrap) which are injected on enter and removed on leave so framework CSS that
 * would otherwise conflict globally (Bootstrap 5) is scoped to its own page.
 */
@Component({
  selector: 'demo-styled-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective],
  template: `
    <h2 class="demo-h2" data-testid="styling-title">{{ label() }} styling</h2>
    <p class="demo-sub">
      The same <code>[dtTable]</code> directive, styled by the <code>{{ label() }}</code> adapter.
    </p>
    <table dtTable class="display" style="width:100%" [dtData]="data" [dtColumns]="columns">
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
  private readonly route = inject(ActivatedRoute);
  private readonly doc = inject(DOCUMENT);
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly label = toSignal(
    this.route.data.pipe(map((d) => (d['label'] as string) ?? 'Default')),
    { initialValue: 'Default' },
  );

  constructor() {
    const hrefs = (this.route.snapshot.data['styles'] as string[] | undefined) ?? [];
    const added: HTMLLinkElement[] = [];
    afterNextRender(() => {
      for (const href of hrefs) {
        const link = this.doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset['demoLazyStyle'] = href;
        this.doc.head.appendChild(link);
        added.push(link);
      }
    });
    inject(DestroyRef).onDestroy(() => added.forEach((l) => l.remove()));
  }
}
