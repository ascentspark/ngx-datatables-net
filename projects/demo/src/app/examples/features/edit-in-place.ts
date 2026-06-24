import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import {
  DtEditableDirective,
  DtTableDirective,
  type DtCellEditCancel,
  type DtCellEditCommit,
  type DtCellEditError,
  type DtCellSaveHandler,
  type DtColumn,
  type DtEditorOption,
  type DtEditorTemplateContext,
} from 'ngx-datatables-net';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

/** A person row exercising every editor type. Mutable — DataTables writes back on commit. */
interface Person {
  id: number;
  name: string;
  notes: string;
  age: number;
  startDate: string;
  active: boolean;
  office: string;
  skills: string[];
  rating: number;
  email: string;
}

const OFFICES: DtEditorOption[] = [
  { value: 'London', label: 'London' },
  { value: 'San Francisco', label: 'San Francisco' },
  { value: 'Tokyo', label: 'Tokyo' },
  { value: 'Berlin', label: 'Berlin' },
  { value: 'Singapore', label: 'Singapore' },
];
const SKILLS: DtEditorOption[] = [
  { value: 'Angular', label: 'Angular' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'RxJS', label: 'RxJS' },
  { value: 'CSS', label: 'CSS' },
  { value: 'Node', label: 'Node' },
];

function seedPeople(): Person[] {
  return [
    {
      id: 1,
      name: 'Ada Lovelace',
      notes: 'Wrote the first algorithm.',
      age: 36,
      startDate: '2021-03-15',
      active: true,
      office: 'London',
      skills: ['Angular', 'TypeScript'],
      rating: 5,
      email: 'ada@example.com',
    },
    {
      id: 2,
      name: 'Grace Hopper',
      notes: 'Coined the term "bug".',
      age: 45,
      startDate: '2019-11-02',
      active: true,
      office: 'San Francisco',
      skills: ['Node', 'CSS'],
      rating: 4,
      email: 'grace@example.com',
    },
    {
      id: 3,
      name: 'Linus Torvalds',
      notes: 'Maintains the kernel.',
      age: 54,
      startDate: '2018-06-21',
      active: false,
      office: 'Berlin',
      skills: ['TypeScript', 'RxJS', 'Node'],
      rating: 5,
      email: 'linus@example.com',
    },
    {
      id: 4,
      name: 'Margaret Hamilton',
      notes: 'Led the Apollo flight software.',
      age: 41,
      startDate: '2022-01-10',
      active: true,
      office: 'Tokyo',
      skills: ['Angular'],
      rating: 5,
      email: 'margaret@example.com',
    },
    {
      id: 5,
      name: 'Alan Turing',
      notes: 'Foundations of computation.',
      age: 39,
      startDate: '2020-09-05',
      active: false,
      office: 'Singapore',
      skills: ['CSS', 'RxJS'],
      rating: 4,
      email: 'alan@example.com',
    },
  ];
}

/**
 * Edit-in-place: double-click any editable cell to edit it inline. Demonstrates every built-in
 * editor (text, textarea, number, date, checkbox, select, multiselect) plus a custom star-rating
 * editor, optional pessimistic async saving (with a forced-failure toggle), and validation.
 */
@Component({
  selector: 'demo-features-edit-in-place',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, DtEditableDirective, ExampleCard],
  template: `
    <demo-example
      title="Edit in place"
      description="Double-click a cell to edit it inline. Enter or click-away commits; Escape cancels; Tab moves to the next editable cell. Every column uses a different editor type. Toggle async saving to see the pessimistic save flow (busy state, error + retry)."
      [sources]="sources"
    >
      <div class="eip-toolbar">
        <label class="eip-toggle">
          <input type="checkbox" [checked]="asyncSave()" (change)="toggleAsync($event)" />
          Simulate async save (700&nbsp;ms)
        </label>
        <label class="eip-toggle">
          <input
            type="checkbox"
            [checked]="forceFail()"
            (change)="toggleFail($event)"
            [disabled]="!asyncSave()"
          />
          Force the next save to fail
        </label>
        <button type="button" class="eip-reset" (click)="reset()">Reset data</button>
      </div>

      <p class="eip-status" [class.eip-status--error]="lastWasError()" aria-live="polite">
        {{ status() }}
      </p>

      <table
        dtTable
        dtEditable
        class="display"
        style="width:100%"
        [dtData]="people()"
        [dtColumns]="columns()"
        [dtSave]="save"
        (dtCellEditStart)="onStart($event)"
        (dtCellEdit)="onEdit($event)"
        (dtCellEditCancel)="onCancel($event)"
        (dtCellEditError)="onError($event)"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Notes</th>
            <th>Age</th>
            <th>Start date</th>
            <th>Active</th>
            <th>Office</th>
            <th>Skills</th>
            <th>Rating</th>
            <th>Email</th>
          </tr>
        </thead>
      </table>

      <!-- Custom editor: a small star picker. commit(n) / cancel() come from the template context. -->
      <ng-template #ratingTpl let-value let-commit="commit" let-cancel="cancel">
        <span class="eip-stars" role="group" aria-label="Rating">
          @for (n of [1, 2, 3, 4, 5]; track n) {
            <button
              type="button"
              class="eip-star"
              [attr.aria-label]="n + ' stars'"
              (click)="commit(n)"
            >
              {{ n <= asNumber(value) ? '★' : '☆' }}
            </button>
          }
          <button
            type="button"
            class="eip-star eip-star--cancel"
            aria-label="Cancel"
            (click)="cancel()"
          >
            ✕
          </button>
        </span>
      </ng-template>
    </demo-example>
  `,
  styles: `
    .eip-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.9rem;
    }
    .eip-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--demo-text);
    }
    .eip-toggle input[disabled] {
      opacity: 0.4;
    }
    .eip-reset {
      margin-left: auto;
      appearance: none;
      border: 1px solid var(--demo-border);
      background: transparent;
      color: var(--demo-text);
      border-radius: var(--radius-sm, 6px);
      padding: 0.3rem 0.8rem;
      cursor: pointer;
      font: inherit;
    }
    .eip-reset:hover {
      border-color: var(--asc-spark-orange);
    }
    .eip-status {
      margin: 0 0 1rem;
      min-height: 1.3em;
      font-size: 0.9rem;
      color: var(--demo-muted);
    }
    .eip-status--error {
      color: #b00020;
      font-weight: 500;
    }

    /* Cell being edited + the controls the directive injects. */
    .eip-stars {
      display: inline-flex;
      gap: 0.1rem;
      align-items: center;
    }
    .eip-star {
      appearance: none;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0 0.05rem;
      color: var(--asc-spark-orange);
    }
    .eip-star--cancel {
      color: var(--demo-muted);
      font-size: 0.85rem;
      margin-left: 0.2rem;
    }

    /* Style the directive's injected controls for this demo (the library ships them headless). */
    ::ng-deep table.dataTable td.ngxdt-editing {
      background: color-mix(in srgb, var(--asc-spark-orange) 8%, transparent);
      box-shadow: inset 0 0 0 2px var(--asc-spark-orange);
      padding: 4px 6px;
    }
    ::ng-deep .ngxdt-editor__input {
      font: inherit;
      padding: 3px 5px;
      border: 1px solid var(--asc-spark-orange);
      border-radius: 4px;
      background: var(--demo-surface, #fff);
      color: var(--demo-text, #111);
    }
    ::ng-deep .ngxdt-editor__input--checkbox {
      width: auto;
      transform: scale(1.2);
    }
    ::ng-deep .ngxdt-editor__input--multiselect {
      min-height: 5.5rem;
    }
    ::ng-deep .ngxdt-editing--busy .ngxdt-editor__input {
      opacity: 0.6;
      cursor: progress;
    }
  `,
})
export class FeaturesEditInPlace {
  protected readonly people = signal<Person[]>(seedPeople());
  protected readonly asyncSave = signal(false);
  protected readonly forceFail = signal(false);
  protected readonly status = signal('Double-click a cell to start editing.');
  protected readonly lastWasError = signal(false);

  private readonly ratingTpl = viewChild<TemplateRef<DtEditorTemplateContext<Person>>>('ratingTpl');

  protected readonly columns = computed<DtColumn<Person>[] | undefined>(() => {
    const rating = this.ratingTpl();
    if (!rating) {
      return undefined;
    }
    return [
      { data: 'id', title: 'ID' },
      {
        data: 'name',
        title: 'Name',
        editor: {
          type: 'text',
          validate: (v) => (String(v).trim() ? null : 'Name is required'),
        },
      },
      { data: 'notes', title: 'Notes', editor: { type: 'textarea', rows: 3, maxLength: 140 } },
      { data: 'age', title: 'Age', editor: { type: 'number', min: 18, max: 80 } },
      { data: 'startDate', title: 'Start date', editor: { type: 'date' } },
      {
        data: 'active',
        title: 'Active',
        editor: { type: 'checkbox' },
        render: (d: unknown) => (d ? 'Yes' : 'No'),
      },
      { data: 'office', title: 'Office', editor: { type: 'select', options: OFFICES } },
      {
        data: 'skills',
        title: 'Skills',
        editor: { type: 'multiselect', options: SKILLS },
        render: (d: unknown) => (Array.isArray(d) ? d.join(', ') : String(d ?? '')),
      },
      {
        data: 'rating',
        title: 'Rating',
        editor: { type: 'custom', template: rating },
        render: (d: unknown) => '★'.repeat(Number(d) || 0) + '☆'.repeat(5 - (Number(d) || 0)),
      },
      {
        data: 'email',
        title: 'Email',
        editor: {
          type: 'text',
          validate: (v) => (String(v).includes('@') ? null : 'Enter a valid email address'),
        },
      },
    ];
  });

  /** Pessimistic save handler. Stable reference; reads the toggles at call time. */
  protected readonly save: DtCellSaveHandler<Person> = () => {
    if (!this.asyncSave()) {
      return; // synchronous commit
    }
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (this.forceFail()) {
          this.forceFail.set(false); // one-shot
          reject(new Error('Server rejected the change'));
        } else {
          resolve();
        }
      }, 700);
    });
  };

  protected asNumber(value: unknown): number {
    return Number(value) || 0;
  }

  protected toggleAsync(event: Event): void {
    this.asyncSave.set((event.target as HTMLInputElement).checked);
    if (!this.asyncSave()) {
      this.forceFail.set(false);
    }
  }

  protected toggleFail(event: Event): void {
    this.forceFail.set((event.target as HTMLInputElement).checked);
  }

  protected reset(): void {
    this.people.set(seedPeople());
    this.status.set('Data reset.');
    this.lastWasError.set(false);
  }

  protected onStart(e: { columnKey: string | number | null }): void {
    this.lastWasError.set(false);
    this.status.set(`Editing "${e.columnKey}"…`);
  }

  protected onEdit(e: DtCellEditCommit<Person>): void {
    this.lastWasError.set(false);
    this.status.set(`Saved ${String(e.columnKey)}: ${this.show(e.newValue)}`);
  }

  protected onCancel(e: DtCellEditCancel<Person>): void {
    if (e.reason === 'invalid' || e.reason === 'unchanged') {
      this.status.set(`Edit ${e.reason}.`);
    }
  }

  protected onError(e: DtCellEditError<Person>): void {
    this.lastWasError.set(true);
    this.status.set(`Save failed: ${(e.error as Error).message}. Fix and retry, or press Escape.`);
  }

  private show(value: unknown): string {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  protected readonly sources: ExampleSource[] = [
    {
      label: 'people.html',
      lang: 'html',
      code: `<table dtTable dtEditable class="display" style="width:100%"
       [dtData]="people" [dtColumns]="columns()"
       [dtSave]="save"
       (dtCellEdit)="onSaved($event)"
       (dtCellEditError)="onError($event)">
  <thead>
    <tr><th>Name</th><th>Office</th><th>Skills</th><th>Rating</th></tr>
  </thead>
</table>

<!-- A custom editor: any Angular control. Call commit(value) / cancel() from the context. -->
<ng-template #ratingTpl let-value let-commit="commit" let-cancel="cancel">
  @for (n of [1,2,3,4,5]; track n) {
    <button type="button" (click)="commit(n)">{{ n <= value ? '★' : '☆' }}</button>
  }
  <button type="button" (click)="cancel()">✕</button>
</ng-template>`,
    },
    {
      label: 'people.ts',
      lang: 'ts',
      code: `import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import {
  DtTableDirective, DtEditableDirective,
  type DtColumn, type DtCellSaveHandler, type DtEditorTemplateContext,
} from 'ngx-datatables-net';

@Component({
  selector: 'app-people',
  imports: [DtTableDirective, DtEditableDirective],
  templateUrl: './people.html',
})
export class PeopleComponent {
  people = [/* ...mutable rows... */];

  ratingTpl = viewChild<TemplateRef<DtEditorTemplateContext<Person>>>('ratingTpl');

  // A column opts into editing by carrying an \`editor\`. No editor = read-only.
  columns = computed<DtColumn<Person>[] | undefined>(() => {
    const rating = this.ratingTpl();
    if (!rating) return undefined;
    return [
      { data: 'name',   title: 'Name',   editor: { type: 'text',
          validate: v => String(v).trim() ? null : 'Name is required' } },
      { data: 'office', title: 'Office', editor: { type: 'select', options: OFFICES } },
      { data: 'skills', title: 'Skills', editor: { type: 'multiselect', options: SKILLS },
          render: d => (d as string[]).join(', ') },
      { data: 'rating', title: 'Rating', editor: { type: 'custom', template: rating } },
    ];
  });

  // Optional pessimistic save: return a Promise/Observable to defer the write until it settles.
  // Reject to keep the cell unchanged, surface an error, and leave the editor open for retry.
  save: DtCellSaveHandler<Person> = (commit) =>
    fetch('/api/people/' + (commit.row as Person).id, {
      method: 'PATCH',
      body: JSON.stringify({ [String(commit.columnKey)]: commit.newValue }),
    }).then(r => { if (!r.ok) throw new Error('Save failed'); });

  onSaved(e) { /* toast, etc. */ }
  onError(e) { /* show e.error */ }
}`,
    },
  ];
}
