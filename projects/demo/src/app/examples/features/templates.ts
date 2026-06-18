import { ChangeDetectionStrategy, Component, computed, signal, type TemplateRef, viewChild } from '@angular/core';
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
 *
 * The markup lives in `templates.html` (a standalone, commented template) rather than inline, so
 * the `<ng-template>` blocks and their `let-` bindings are easy to read.
 */
@Component({
  selector: 'demo-features-templates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard, RouterLink, CurrencyPipe, TitleCasePipe],
  templateUrl: './templates.html',
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

  // Grab each <ng-template> from templates.html by its #reference.
  private readonly nameTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('nameTpl');
  private readonly officeTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('officeTpl');
  private readonly salaryTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('salaryTpl');
  private readonly actionsTpl = viewChild<TemplateRef<DtCellContext<Employee>>>('actionsTpl');

  /** Columns resolve once the templates are queryable (just after the view is created). */
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

  // The code panel below shows the same pattern as a clean, standalone HTML + TS pair you can
  // copy into your own app. Keeping the template in its own .html file (templateUrl) is what makes
  // the <ng-template>s and their let- bindings readable.
  protected readonly sources: ExampleSource[] = [
    {
      label: 'people.html',
      lang: 'html',
      code: `<!-- Each column (configured in the .ts) points at one of these <ng-template>s by name. -->
<table dtTable [dtData]="people" [dtColumns]="columns()" class="display">
  <thead>
    <tr><th>Name</th><th>Salary</th><th></th></tr>
  </thead>
</table>

<!--
  Every cell template receives two values:
    let-value      -> the cell's value (the column's \`data\` field)
    let-row="row"  -> the whole row object, so you can read other fields like row.id
-->

<!-- Name: a link to this row's detail page, built from the row's id. -->
<ng-template #nameTpl let-value let-row="row">
  <a [routerLink]="['/users', row.id]">{{ value }}</a>
</ng-template>

<!-- Salary: the raw number formatted with Angular's currency pipe. -->
<ng-template #salaryTpl let-value>
  {{ value | currency }}
</ng-template>

<!-- Actions: a button that calls a component method with the whole row. -->
<ng-template #actionsTpl let-row="row">
  <button type="button" (click)="view(row)">View</button>
</ng-template>`,
    },
    {
      label: 'people.ts',
      lang: 'ts',
      code: `import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DtTableDirective, type DtCellContext, type DtColumn } from 'ngx-datatables-net';

interface User {
  id: number;
  name: string;
  salary: number;
}

@Component({
  selector: 'app-people',
  imports: [DtTableDirective, RouterLink, CurrencyPipe],
  templateUrl: './people.html', // the standalone template above
})
export class PeopleComponent {
  // Your rows.
  people: User[] = [{ id: 1, name: 'Ada Lovelace', salary: 95000 }];

  // Look up each <ng-template> in the HTML by its #reference.
  nameTpl = viewChild<TemplateRef<DtCellContext<User>>>('nameTpl');
  salaryTpl = viewChild<TemplateRef<DtCellContext<User>>>('salaryTpl');
  actionsTpl = viewChild<TemplateRef<DtCellContext<User>>>('actionsTpl');

  // Link each column to a template with \`dtTemplate\`. The column still SORTS and SEARCHES on
  // its raw \`data\`; the template only controls what is shown. (computed waits until the
  // templates exist, just after the view is created.)
  columns = computed<DtColumn<User>[] | undefined>(() => {
    const name = this.nameTpl();
    const salary = this.salaryTpl();
    const actions = this.actionsTpl();
    if (!name || !salary || !actions) return undefined;
    return [
      { data: 'name', title: 'Name', dtTemplate: name },
      { data: 'salary', title: 'Salary', dtTemplate: salary },
      { data: null, title: '', orderable: false, dtTemplate: actions },
    ];
  });

  view(row: User) {
    // open a dialog, navigate, mutate state, etc.
    console.log('view', row.id);
  }
}`,
    },
  ];
}
