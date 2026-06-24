import {
  Component,
  computed,
  provideZonelessChangeDetection,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of, Subject } from 'rxjs';
import { DtTableDirective } from './dt-table.directive';
import { DtEditableDirective } from './dt-editable.directive';
import type { DtColumn, DtCellContext } from './dt-cell-template';
import type {
  DtCellEditCancel,
  DtCellEditCommit,
  DtCellEditError,
  DtCellSaveHandler,
  DtEditContext,
  DtEditorOption,
  DtEditorTemplateContext,
} from './dt-editable.types';

interface Row {
  id: number;
  name: string;
  bio: string;
  age: number;
  startDate: string;
  active: boolean;
  office: string;
  tags: string[];
  email: string;
}

const OFFICES: DtEditorOption[] = [
  { value: 'london', label: 'London' },
  { value: 'tokyo', label: 'Tokyo' },
  { value: 'berlin', label: 'Berlin' },
];
const TAGS: DtEditorOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

function makeRows(): Row[] {
  return [
    {
      id: 1,
      name: 'Ada',
      bio: 'Pioneer',
      age: 36,
      startDate: '2020-01-15',
      active: true,
      office: 'london',
      tags: ['a'],
      email: 'ada@example.com',
    },
    {
      id: 2,
      name: 'Linus',
      bio: 'Kernel',
      age: 54,
      startDate: '2019-06-01',
      active: false,
      office: 'berlin',
      tags: ['b', 'c'],
      email: 'linus@example.com',
    },
  ];
}

@Component({
  imports: [DtTableDirective, DtEditableDirective],
  template: `
    <table
      dtTable
      dtEditable
      #t="dtTable"
      #e="dtEditable"
      [dtData]="data()"
      [dtColumns]="cols()"
      [dtSave]="saveFn()"
      (dtCellEditStart)="onStart($event)"
      (dtCellEdit)="onEdit($event)"
      (dtCellEditCancel)="onCancel($event)"
      (dtCellEditError)="onError($event)"
    >
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Bio</th>
          <th>Age</th>
          <th>Start</th>
          <th>Active</th>
          <th>Office</th>
          <th>Tags</th>
          <th>Custom</th>
          <th>Email</th>
        </tr>
      </thead>
    </table>
    <ng-template #customTpl let-value let-commit="commit" let-cancel="cancel">
      <button type="button" class="cust-ok" (click)="commit('CUSTOM:' + value)">ok</button>
      <button type="button" class="cust-x" (click)="cancel()">x</button>
    </ng-template>
  `,
})
class HostComponent {
  readonly data = signal<Row[]>(makeRows());
  readonly customTpl = viewChild<TemplateRef<DtEditorTemplateContext<Row>>>('customTpl');

  readonly lastStart = signal<DtEditContext<Row> | null>(null);
  readonly lastEdit = signal<DtCellEditCommit<Row> | null>(null);
  readonly lastCancel = signal<DtCellEditCancel<Row> | null>(null);
  readonly lastError = signal<DtCellEditError<Row> | null>(null);
  readonly editCount = signal(0);
  readonly saveFn = signal<DtCellSaveHandler<Row> | undefined>(undefined);

  readonly cols = computed<DtColumn<Row>[] | undefined>(() => {
    const custom = this.customTpl();
    if (!custom) {
      return undefined;
    }
    return [
      { data: 'id', title: 'ID' },
      { data: 'name', title: 'Name', editor: { type: 'text' } },
      { data: 'bio', title: 'Bio', editor: { type: 'textarea' } },
      {
        data: 'age',
        title: 'Age',
        // Per-cell guard: row index 1 is locked.
        editor: { type: 'number', min: 0, disabled: (ctx) => ctx.rowIndex === 1 },
      },
      { data: 'startDate', title: 'Start', editor: { type: 'date' } },
      { data: 'active', title: 'Active', editor: { type: 'checkbox' } },
      {
        data: 'office',
        title: 'Office',
        editor: { type: 'select', options: OFFICES, ariaLabel: 'Office picker' },
      },
      {
        data: 'tags',
        title: 'Tags',
        editor: { type: 'multiselect', options: TAGS },
        render: (d: unknown) => (Array.isArray(d) ? d.join(', ') : String(d ?? '')),
      },
      { data: 'name', title: 'Custom', editor: { type: 'custom', template: custom } },
      {
        data: 'email',
        title: 'Email',
        editor: {
          type: 'text',
          validate: (value) => (String(value).includes('@') ? null : 'Invalid email'),
        },
      },
    ];
  });

  readonly dir = viewChild.required<DtTableDirective<Row>>('t');
  readonly editable = viewChild.required<DtEditableDirective<Row>>('e');

  onStart(e: DtEditContext<Row>): void {
    this.lastStart.set(e);
  }
  onEdit(e: DtCellEditCommit<Row>): void {
    this.lastEdit.set(e);
    this.editCount.update((n) => n + 1);
  }
  onCancel(e: DtCellEditCancel<Row>): void {
    this.lastCancel.set(e);
  }
  onError(e: DtCellEditError<Row>): void {
    this.lastError.set(e);
  }
}

const COL = {
  id: 0,
  name: 1,
  bio: 2,
  age: 3,
  startDate: 4,
  active: 5,
  office: 6,
  tags: 7,
  custom: 8,
  email: 9,
} as const;

async function mount(): Promise<{ fixture: ComponentFixture<HostComponent>; host: HostComponent }> {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance };
}

function cellEl(
  fixture: ComponentFixture<HostComponent>,
  rowIndex: number,
  colIndex: number,
): HTMLTableCellElement {
  const rows = fixture.nativeElement.querySelectorAll('table tbody tr');
  const tds = (rows[rowIndex] as HTMLElement).querySelectorAll('td');
  return tds[colIndex] as HTMLTableCellElement;
}

function dblclick(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
}

function key(el: HTMLElement, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

async function settle(fixture: ComponentFixture<HostComponent>): Promise<void> {
  await fixture.whenStable();
}

/** Flush pending microtasks (settled promises / observable callbacks) then re-stabilize. */
async function flush(fixture: ComponentFixture<HostComponent>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await fixture.whenStable();
}

/** Open the name (text) editor at a row and type a new value, returning the input. */
async function openNameAndType(
  fixture: ComponentFixture<HostComponent>,
  rowIndex: number,
  value: string,
): Promise<HTMLInputElement> {
  const td = cellEl(fixture, rowIndex, COL.name);
  dblclick(td);
  await settle(fixture);
  const input = td.querySelector('input') as HTMLInputElement;
  input.value = value;
  return input;
}

describe('DtEditableDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  describe('opening', () => {
    it('opens a text input seeded with the cell value on double-click', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);

      const input = td.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('text');
      expect(input.value).toBe('Ada');
      expect(host.lastStart()?.value).toBe('Ada');
      expect(host.lastStart()?.colIndex).toBe(COL.name);
    });

    it('does nothing when the column has no editor', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.id);
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('input')).toBeNull();
      expect(host.lastStart()).toBeNull();
    });

    it('only allows one open editor at a time', async () => {
      const { fixture } = await mount();
      dblclick(cellEl(fixture, 0, COL.name));
      await settle(fixture);
      dblclick(cellEl(fixture, 1, COL.bio));
      await settle(fixture);
      const inputs = fixture.nativeElement.querySelectorAll(
        'table tbody input, table tbody textarea',
      );
      expect(inputs.length).toBe(1);
    });
  });

  describe('committing (Enter)', () => {
    it('writes a changed text value through the Api and emits dtCellEdit', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = 'Grace';
      key(input, 'Enter');
      await settle(fixture);

      const api = host.dir().instance()!;
      expect(api.cell(0, COL.name).data()).toBe('Grace');
      expect(host.lastEdit()?.oldValue).toBe('Ada');
      expect(host.lastEdit()?.newValue).toBe('Grace');
      expect(cellEl(fixture, 0, COL.name).querySelector('input')).toBeNull();
    });

    it('treats an unchanged commit as a no-op cancel (reason "unchanged")', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);
      key(td.querySelector('input') as HTMLInputElement, 'Enter');
      await settle(fixture);
      expect(host.lastEdit()).toBeNull();
      expect(host.lastCancel()?.reason).toBe('unchanged');
    });

    it('commits a number editor as a number', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.age);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('number');
      input.value = '41';
      key(input, 'Enter');
      await settle(fixture);
      const v = host.dir().instance()!.cell(0, COL.age).data();
      expect(v).toBe(41);
      expect(typeof v).toBe('number');
    });

    it('commits a checkbox editor as a boolean', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.active);
      dblclick(td);
      await settle(fixture);
      const box = td.querySelector('input[type=checkbox]') as HTMLInputElement;
      expect(box.checked).toBe(true);
      box.checked = false;
      key(box, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.active).data()).toBe(false);
    });

    it('commits a select editor as the chosen option value', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.office);
      dblclick(td);
      await settle(fixture);
      const select = td.querySelector('select') as HTMLSelectElement;
      expect(select.value).not.toBe('');
      // pick "tokyo"
      const tokyoIdx = OFFICES.findIndex((o) => o.value === 'tokyo');
      select.selectedIndex = tokyoIdx;
      key(select, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.office).data()).toBe('tokyo');
    });

    it('commits a multiselect editor as an array of values', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 1, COL.tags);
      dblclick(td);
      await settle(fixture);
      const select = td.querySelector('select[multiple]') as HTMLSelectElement;
      // select a and c (indices 0 and 2)
      Array.from(select.options).forEach((o, i) => (o.selected = i === 0 || i === 2));
      key(select, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(1, COL.tags).data()).toEqual(['a', 'c']);
    });

    it('commits a date editor as an ISO string', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.startDate);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('date');
      input.value = '2021-12-31';
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.startDate).data()).toBe('2021-12-31');
    });
  });

  describe('custom editor', () => {
    it('renders the consumer template and commits via its commit() helper', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.custom);
      dblclick(td);
      await settle(fixture);
      const ok = td.querySelector('.cust-ok') as HTMLButtonElement;
      expect(ok).toBeTruthy();
      ok.click();
      await settle(fixture);
      expect(host.lastEdit()?.newValue).toBe('CUSTOM:Ada');
      expect(host.dir().instance()!.cell(0, COL.custom).data()).toBe('CUSTOM:Ada');
    });

    it('cancels via the template cancel() helper', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.custom);
      dblclick(td);
      await settle(fixture);
      (td.querySelector('.cust-x') as HTMLButtonElement).click();
      await settle(fixture);
      expect(host.lastCancel()?.reason).toBe('programmatic');
      expect(host.lastEdit()).toBeNull();
    });
  });

  describe('cancelling (Escape)', () => {
    it('reverts the cell and emits dtCellEditCancel with reason "escape"', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = 'Discarded';
      key(input, 'Escape');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Ada');
      expect(host.lastEdit()).toBeNull();
      expect(host.lastCancel()?.reason).toBe('escape');
      // original cell text restored
      expect(cellEl(fixture, 0, COL.name).textContent).toContain('Ada');
    });
  });

  describe('async save (pessimistic)', () => {
    it('passes the commit payload (row, old, new) to the save handler', async () => {
      const { fixture, host } = await mount();
      let captured: DtCellEditCommit<Row> | null = null;
      host.saveFn.set((c) => {
        captured = c;
      });
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);
      expect(captured).not.toBeNull();
      expect(captured!.oldValue).toBe('Ada');
      expect(captured!.newValue).toBe('Grace');
      expect(captured!.row.id).toBe(1);
    });

    it('writes immediately when the save handler returns void (synchronous)', async () => {
      const { fixture, host } = await mount();
      host.saveFn.set(() => undefined);
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
      expect(host.lastEdit()?.newValue).toBe('Grace');
    });

    it('does NOT write until an async save resolves, showing a busy state meanwhile', async () => {
      const { fixture, host } = await mount();
      let resolve!: () => void;
      host.saveFn.set(() => new Promise<void>((r) => (resolve = r)));
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);

      // pending: cell unchanged, no commit event, control disabled (busy)
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Ada');
      expect(host.lastEdit()).toBeNull();
      const live = cellEl(fixture, 0, COL.name).querySelector('input') as HTMLInputElement;
      expect(live.disabled).toBe(true);

      resolve();
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
      expect(host.lastEdit()?.newValue).toBe('Grace');
    });

    it('keeps the old value, surfaces dtCellEditError and re-opens for retry when save rejects', async () => {
      const { fixture, host } = await mount();
      host.saveFn.set(() => Promise.reject(new Error('boom')));
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);

      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Ada');
      expect(host.lastEdit()).toBeNull();
      expect((host.lastError()?.error as Error).message).toBe('boom');
      // editor stays open, re-enabled, and shows an error message
      const td = cellEl(fixture, 0, COL.name);
      const live = td.querySelector('input') as HTMLInputElement;
      expect(live).toBeTruthy();
      expect(live.disabled).toBe(false);
      expect(td.querySelector('.ngxdt-editor__error')?.textContent).toContain('boom');
    });

    it('supports an Observable-returning save handler', async () => {
      const { fixture, host } = await mount();
      host.saveFn.set(() => of(undefined));
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
    });

    it('waits for a deferred Observable then writes on its emission', async () => {
      const { fixture, host } = await mount();
      const subject = new Subject<void>();
      host.saveFn.set(() => subject.asObservable());
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Ada'); // still pending
      subject.next();
      subject.complete();
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
    });
  });

  describe('validation', () => {
    it('blocks an invalid commit, shows an inline error and keeps the cell unchanged', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.email);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = 'not-an-email';
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.email).data()).toBe('ada@example.com');
      expect(host.lastEdit()).toBeNull();
      expect(td.querySelector('input')).toBeTruthy(); // stays open
      expect(td.querySelector('.ngxdt-editor__error')?.textContent).toContain('Invalid email');
    });

    it('commits once the value becomes valid', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.email);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = 'bad';
      key(input, 'Enter');
      await settle(fixture);
      input.value = 'grace@example.com';
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.email).data()).toBe('grace@example.com');
      expect(cellEl(fixture, 0, COL.email).querySelector('input')).toBeNull();
    });

    it('cancels (reverts) an invalid value on blur instead of trapping focus', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.email);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = 'broken';
      input.dispatchEvent(new FocusEvent('blur'));
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.email).data()).toBe('ada@example.com');
      expect(host.lastCancel()?.reason).toBe('invalid');
      expect(cellEl(fixture, 0, COL.email).querySelector('input')).toBeNull();
    });
  });

  describe('per-cell disabled guard', () => {
    it('does not open an editor for a disabled cell', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 1, COL.age); // rowIndex 1 is locked
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('input')).toBeNull();
      expect(host.lastStart()).toBeNull();
    });

    it('still opens the same column on a non-disabled cell', async () => {
      const { fixture } = await mount();
      const td = cellEl(fixture, 0, COL.age);
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('input[type=number]')).toBeTruthy();
    });
  });

  describe('keyboard navigation (Tab)', () => {
    it('commits the current cell and opens the next editable cell in the row on Tab', async () => {
      const { fixture, host } = await mount();
      const nameTd = cellEl(fixture, 0, COL.name);
      dblclick(nameTd);
      await settle(fixture);
      const input = nameTd.querySelector('input') as HTMLInputElement;
      input.value = 'Grace';
      key(input, 'Tab');
      await settle(fixture);
      // name committed
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
      // next editable cell (bio) now open
      expect(cellEl(fixture, 0, COL.bio).querySelector('textarea')).toBeTruthy();
    });

    it('moves to the previous editable cell on Shift+Tab', async () => {
      const { fixture } = await mount();
      const bioTd = cellEl(fixture, 0, COL.bio);
      dblclick(bioTd);
      await settle(fixture);
      const ta = bioTd.querySelector('textarea') as HTMLTextAreaElement;
      ta.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await settle(fixture);
      expect(cellEl(fixture, 0, COL.name).querySelector('input')).toBeTruthy();
    });

    it('defers the Tab advance until an async save commits, then opens the next cell', async () => {
      const { fixture, host } = await mount();
      let resolve!: () => void;
      host.saveFn.set(() => new Promise<void>((r) => (resolve = r)));
      const nameTd = cellEl(fixture, 0, COL.name);
      dblclick(nameTd);
      await settle(fixture);
      const input = nameTd.querySelector('input') as HTMLInputElement;
      input.value = 'Grace';
      key(input, 'Tab');
      await flush(fixture);
      // save pending: name not yet written, no advance yet
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Ada');
      expect(cellEl(fixture, 0, COL.bio).querySelector('textarea')).toBeNull();

      resolve();
      await flush(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
      expect(cellEl(fixture, 0, COL.bio).querySelector('textarea')).toBeTruthy();
    });

    it('does NOT advance when an async save behind a Tab fails', async () => {
      const { fixture, host } = await mount();
      host.saveFn.set(() => Promise.reject(new Error('nope')));
      const nameTd = cellEl(fixture, 0, COL.name);
      dblclick(nameTd);
      await settle(fixture);
      const input = nameTd.querySelector('input') as HTMLInputElement;
      input.value = 'Grace';
      key(input, 'Tab');
      await flush(fixture);
      // stays on the name cell with an error; bio is not opened
      expect(cellEl(fixture, 0, COL.bio).querySelector('textarea')).toBeNull();
      expect(nameTd.querySelector('input')).toBeTruthy();
      expect((host.lastError()?.error as Error).message).toBe('nope');
    });
  });

  describe('redraw survival', () => {
    it('closes an open editor when the table is redrawn externally (sort/page/filter)', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('input')).toBeTruthy();
      // Simulate an external redraw (e.g. the user sorts a column).
      host.dir().instance()!.draw(false);
      await settle(fixture);
      expect(fixture.nativeElement.querySelector('table tbody input')).toBeNull();
      expect(host.lastCancel()?.reason).toBe('programmatic');
    });

    it('does not fire a spurious cancel when the editor itself commits (its own draw)', async () => {
      const { fixture, host } = await mount();
      const input = await openNameAndType(fixture, 0, 'Grace');
      key(input, 'Enter');
      await settle(fixture);
      expect(host.lastEdit()?.newValue).toBe('Grace');
      expect(host.lastCancel()).toBeNull(); // commit must not also register as a cancel
    });
  });

  describe('accessibility', () => {
    it('labels the control from the column title by default', async () => {
      const { fixture } = await mount();
      const td = cellEl(fixture, 0, COL.name);
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('input')?.getAttribute('aria-label')).toBe('Name');
    });

    it('uses an explicit editor ariaLabel when provided', async () => {
      const { fixture } = await mount();
      const td = cellEl(fixture, 0, COL.office);
      dblclick(td);
      await settle(fixture);
      expect(td.querySelector('select')?.getAttribute('aria-label')).toBe('Office picker');
    });
  });

  describe('edge cases & robustness', () => {
    it('round-trips a value containing HTML verbatim (no markup interpretation)', async () => {
      const { fixture, host } = await mount();
      const payload = '<b>x</b> & <i>y</i> "z"';
      const input = await openNameAndType(fixture, 0, payload);
      expect(input.value).toBe(payload); // shown as literal text in the control
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe(payload);
    });

    it('commits an empty number as null', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.age);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = '';
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.age).data()).toBeNull();
    });

    it('commits an empty date as null', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 0, COL.startDate);
      dblclick(td);
      await settle(fixture);
      const input = td.querySelector('input') as HTMLInputElement;
      input.value = '';
      key(input, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.startDate).data()).toBeNull();
    });

    it('commits an empty array when all multiselect options are deselected', async () => {
      const { fixture, host } = await mount();
      const td = cellEl(fixture, 1, COL.tags);
      dblclick(td);
      await settle(fixture);
      const select = td.querySelector('select[multiple]') as HTMLSelectElement;
      Array.from(select.options).forEach((o) => (o.selected = false));
      key(select, 'Enter');
      await settle(fixture);
      expect(host.dir().instance()!.cell(1, COL.tags).data()).toEqual([]);
    });

    it('commits the first cell when the user double-clicks another (mouse switch)', async () => {
      const { fixture, host } = await mount();
      const input = await openNameAndType(fixture, 0, 'Grace');
      void input;
      dblclick(cellEl(fixture, 0, COL.bio));
      await settle(fixture);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('Grace');
      expect(cellEl(fixture, 0, COL.bio).querySelector('textarea')).toBeTruthy();
    });

    it('leaves no orphaned editor DOM after many open/commit/cancel cycles', async () => {
      const { fixture, host } = await mount();
      for (let i = 0; i < 4; i++) {
        const input = await openNameAndType(fixture, 0, `V${i}`);
        key(input, 'Enter');
        await settle(fixture);
      }
      // a couple of cancels too
      for (let i = 0; i < 2; i++) {
        const td = cellEl(fixture, 1, COL.bio);
        dblclick(td);
        await settle(fixture);
        key(td.querySelector('textarea') as HTMLTextAreaElement, 'Escape');
        await settle(fixture);
      }
      expect(fixture.nativeElement.querySelectorAll('.ngxdt-editor').length).toBe(0);
      expect(host.dir().instance()!.rows().count()).toBe(2);
      expect(host.dir().instance()!.cell(0, COL.name).data()).toBe('V3');
    });
  });

  describe('teardown', () => {
    it('removes the open editor when the component is destroyed', async () => {
      const { fixture } = await mount();
      dblclick(cellEl(fixture, 0, COL.name));
      await settle(fixture);
      expect(fixture.nativeElement.querySelector('table tbody input')).toBeTruthy();
      fixture.destroy();
      expect(fixture.nativeElement.querySelector('table tbody input')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------------------------
// A column can carry BOTH a dtTemplate (Angular cell rendering) and an editor. Editing must open
// over the live template view and, on commit, let the template re-render with the new value.
// ---------------------------------------------------------------------------------------------
interface SimpleRow {
  id: number;
  name: string;
}

@Component({
  imports: [DtTableDirective, DtEditableDirective],
  template: `
    <table
      dtTable
      dtEditable
      #t="dtTable"
      [dtData]="data()"
      [dtColumns]="cols()"
      (dtCellEdit)="last.set($event)"
    >
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
    </table>
    <ng-template #nameTpl let-value
      ><span class="name-cell">{{ value }}!</span></ng-template
    >
  `,
})
class TemplateEditHost {
  readonly data = signal<SimpleRow[]>([{ id: 1, name: 'Ada' }]);
  readonly nameTpl = viewChild<TemplateRef<DtCellContext<SimpleRow>>>('nameTpl');
  readonly last = signal<DtCellEditCommit<SimpleRow> | null>(null);
  readonly cols = computed<DtColumn<SimpleRow>[] | undefined>(() => {
    const tpl = this.nameTpl();
    if (!tpl) {
      return undefined;
    }
    return [
      { data: 'id', title: 'ID' },
      { data: 'name', title: 'Name', dtTemplate: tpl, editor: { type: 'text' } },
    ];
  });
  readonly dir = viewChild.required<DtTableDirective<SimpleRow>>('t');
}

describe('DtEditableDirective + dtTemplate column', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function mountTpl(): Promise<{
    fixture: ComponentFixture<TemplateEditHost>;
    host: TemplateEditHost;
  }> {
    const fixture = TestBed.createComponent(TemplateEditHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance };
  }

  function nameCell(fixture: ComponentFixture<TemplateEditHost>): HTMLTableCellElement {
    const tds = fixture.nativeElement.querySelectorAll('table tbody tr td');
    return tds[1] as HTMLTableCellElement;
  }

  it('renders the Angular template in the cell', async () => {
    const { fixture } = await mountTpl();
    expect(nameCell(fixture).querySelector('.name-cell')?.textContent).toBe('Ada!');
  });

  it('opens an editor seeded with the RAW value (not the template output)', async () => {
    const { fixture } = await mountTpl();
    dblclick(nameCell(fixture));
    await fixture.whenStable();
    const input = nameCell(fixture).querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('Ada'); // not "Ada!"
  });

  it('commits and lets the template re-render with the new value', async () => {
    const { fixture, host } = await mountTpl();
    dblclick(nameCell(fixture));
    await fixture.whenStable();
    const input = nameCell(fixture).querySelector('input') as HTMLInputElement;
    input.value = 'Grace';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(host.dir().instance()!.cell(0, 1).data()).toBe('Grace');
    expect(nameCell(fixture).querySelector('.name-cell')?.textContent).toBe('Grace!');
  });

  it('restores the live template view on Escape', async () => {
    const { fixture } = await mountTpl();
    dblclick(nameCell(fixture));
    await fixture.whenStable();
    const input = nameCell(fixture).querySelector('input') as HTMLInputElement;
    input.value = 'Discarded';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(nameCell(fixture).querySelector('.name-cell')?.textContent).toBe('Ada!');
    expect(nameCell(fixture).querySelector('input')).toBeNull();
  });
});
