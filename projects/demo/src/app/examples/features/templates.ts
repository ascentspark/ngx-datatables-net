import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DtTableDirective, type DtCellContext, type DtColumn } from 'ngx-datatables-net';
import { EMPLOYEES, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/**
 * Angular cell templates: render cells with real Angular `<ng-template>`s (the "Angular way")
 * instead of HTML strings. Pipes, `routerLink` and `(click)` handlers all work because the
 * template keeps the declaring component's injector and change detection. Sorting and search still
 * run on the column's raw `data`.
 */
@Component({
  selector: 'demo-features-templates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard, RouterLink, CurrencyPipe, TitleCasePipe],
  template: `
    <demo-example
      title="Angular templates in cells"
      description="Render cells with Angular <ng-template>s instead of HTML strings: pipes, routerLink and (click) handlers work with full Angular context. Sorting and global search still use the raw column data, not the rendered markup."
      [sources]="sources"
    >
      @if (lastViewed(); as name) {
        <p class="tpl-note">Clicked a cell button for: <strong>{{ name }}</strong></p>
      }
      <table dtTable class="display" style="width: 100%" [dtData]="data" [dtColumns]="columns()">
        <thead>
          <tr>
            <th>Name</th>
            <th>Office</th>
            <th>Salary</th>
            <th></th>
          </tr>
        </thead>
      </table>
    </demo-example>

    <ng-template #nameTpl let-value let-row="row">
      <a class="tpl-link" [routerLink]="['/basic']" [title]="row.position">{{ value }}</a>
    </ng-template>
    <ng-template #officeTpl let-value>
      <span class="tpl-badge">{{ value | titlecase }}</span>
    </ng-template>
    <ng-template #salaryTpl let-value>
      {{ value | currency: 'USD' : 'symbol' : '1.0-0' }}
    </ng-template>
    <ng-template #actionsTpl let-row="row">
      <button type="button" class="tpl-btn" (click)="view(row)">View</button>
    </ng-template>
  `,
  styles: `
    .tpl-note {
      margin: 0 0 1rem;
      color: var(--demo-text);
    }
    .tpl-link {
      color: var(--asc-spark-orange);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .tpl-badge {
      display: inline-block;
      padding: 0.1rem 0.55rem;
      border: 1px solid var(--demo-border);
      border-radius: var(--radius-full, 999px);
      font-size: 0.85rem;
    }
    .tpl-btn {
      appearance: none;
      border: 1px solid var(--asc-spark-orange);
      background: transparent;
      color: var(--asc-spark-orange);
      border-radius: var(--radius-sm, 6px);
      padding: 0.2rem 0.7rem;
      cursor: pointer;
      font: inherit;
    }
    .tpl-btn:hover {
      background: var(--asc-spark-orange);
      color: var(--asc-pure-white, #fff);
    }
  `,
})
export class FeaturesTemplates {
  protected readonly data = EMPLOYEES;
  protected readonly lastViewed = signal<string | null>(null);

  private readonly nameTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('nameTpl');
  private readonly officeTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('officeTpl');
  private readonly salaryTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('salaryTpl');
  private readonly actionsTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('actionsTpl');

  /** Columns resolve once the templates are queryable (after view init). */
  protected readonly columns = computed<DtColumn<Employee>[] | undefined>(() => {
    const name = this.nameTpl();
    const office = this.officeTpl();
    const salary = this.salaryTpl();
    const actions = this.actionsTpl();
    if (!name || !office || !salary || !actions) {
      return undefined;
    }
    return [
      { data: 'name', title: 'Name', dtTemplate: name },
      { data: 'office', title: 'Office', dtTemplate: office },
      { data: 'salary', title: 'Salary', dtTemplate: salary },
      { data: null, title: '', orderable: false, searchable: false, dtTemplate: actions },
    ];
  });

  protected view(row: Employee): void {
    this.lastViewed.set(row.name);
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'templates.ts',
      code: `import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DtTableDirective, type DtCellContext, type DtColumn } from 'ngx-datatables-net';

@Component({
  selector: 'app-people',
  imports: [DtTableDirective, RouterLink, CurrencyPipe, TitleCasePipe],
  template: \`
    <table dtTable [dtData]="data" [dtColumns]="columns()" class="display"></table>

    <ng-template #nameTpl let-value let-row="row">
      <a [routerLink]="['/user', row.id]">{{ value }}</a>
    </ng-template>
    <ng-template #salaryTpl let-value>{{ value | currency }}</ng-template>
    <ng-template #actionsTpl let-row="row">
      <button type="button" (click)="view(row)">View</button>
    </ng-template>
  \`,
})
export class PeopleComponent {
  data = [/* rows */];
  nameTpl = viewChild<TemplateRef<DtCellContext>>('nameTpl');
  salaryTpl = viewChild<TemplateRef<DtCellContext>>('salaryTpl');
  actionsTpl = viewChild<TemplateRef<DtCellContext>>('actionsTpl');

  columns = computed<DtColumn[] | undefined>(() => {
    const name = this.nameTpl(), salary = this.salaryTpl(), actions = this.actionsTpl();
    if (!name || !salary || !actions) return undefined;
    return [
      { data: 'name', title: 'Name', dtTemplate: name },
      { data: 'salary', title: 'Salary', dtTemplate: salary },
      { data: null, title: '', orderable: false, dtTemplate: actions },
    ];
  });

  view(row: any) { /* ... */ }
}`,
    },
  ];
}
