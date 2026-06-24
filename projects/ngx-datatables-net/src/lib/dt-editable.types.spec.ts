import { describe, expect, it } from 'vitest';
import type { Api } from 'datatables.net';
import type {
  DtCellEditCancel,
  DtCellEditCancelReason,
  DtCellEditCommit,
  DtCellEditError,
  DtCellSaveHandler,
  DtEditContext,
  DtEditorConfig,
  DtEditorOption,
  DtEditorOptions,
  DtEditorTemplateContext,
} from './dt-editable.types';
import type { DtColumn } from './dt-cell-template';

interface Row {
  id: number;
  name: string;
  bio: string;
  age: number;
  startDate: string;
  active: boolean;
  office: string;
  tags: string[];
}

/** Exercises discriminant narrowing — fails to compile if the union is wrong. */
function describeEditor(cfg: DtEditorConfig<Row>): string {
  switch (cfg.type) {
    case 'text':
      return `text(maxLength=${cfg.maxLength ?? '-'})`;
    case 'textarea':
      return `textarea(rows=${cfg.rows ?? '-'})`;
    case 'number':
      return `number(min=${cfg.min ?? '-'},max=${cfg.max ?? '-'},step=${cfg.step ?? '-'})`;
    case 'date':
      return `date(min=${cfg.min ?? '-'})`;
    case 'checkbox':
      return 'checkbox';
    case 'select':
      return `select(${Array.isArray(cfg.options) ? cfg.options.length : 'fn'})`;
    case 'multiselect':
      return `multiselect(sep=${cfg.separator ?? ', '})`;
    case 'custom':
      return `custom(${typeof cfg.template})`;
  }
}

describe('dt-editable.types', () => {
  const OFFICES: DtEditorOption[] = [
    { value: 'london', label: 'London' },
    { value: 'tokyo', label: 'Tokyo', disabled: true },
  ];

  it('models every editor variant with a discriminant', () => {
    const editors: DtEditorConfig<Row>[] = [
      { type: 'text', placeholder: 'name', maxLength: 80 },
      { type: 'textarea', rows: 4, maxLength: 500 },
      { type: 'number', min: 0, max: 120, step: 1 },
      { type: 'date', min: '2000-01-01', max: '2030-12-31' },
      { type: 'checkbox' },
      { type: 'select', options: OFFICES, placeholder: 'Pick one' },
      { type: 'multiselect', options: OFFICES, separator: ' / ' },
      // `template` is a TemplateRef at runtime; null is enough to type-check the shape here.
      { type: 'custom', template: null as never },
    ];

    expect(editors.map(describeEditor)).toEqual([
      'text(maxLength=80)',
      'textarea(rows=4)',
      'number(min=0,max=120,step=1)',
      'date(min=2000-01-01)',
      'checkbox',
      'select(2)',
      'multiselect(sep= / )',
      'custom(object)',
    ]);
  });

  it('supports static and functional option providers', () => {
    const ctx = { value: 'london' } as DtEditContext<Row>;
    const staticOpts: DtEditorOptions<Row> = OFFICES;
    const fnOpts: DtEditorOptions<Row> = (c) => [{ value: c.value, label: String(c.value) }];
    const resolved = typeof fnOpts === 'function' ? fnOpts(ctx) : fnOpts;
    expect(resolved[0].value).toBe('london');
    expect(Array.isArray(staticOpts)).toBe(true);
  });

  it('carries a per-column editor on DtColumn', () => {
    const cols: DtColumn<Row>[] = [
      { data: 'name', title: 'Name', editor: { type: 'text' } },
      { data: 'tags', title: 'Tags', editor: { type: 'multiselect', options: OFFICES } },
      { data: 'id', title: 'ID' }, // no editor -> read-only column
    ];
    expect(cols[0].editor?.type).toBe('text');
    expect(cols[2].editor).toBeUndefined();
  });

  it('exposes a base validate/disabled/ariaLabel surface on each variant', () => {
    const cfg: DtEditorConfig<Row> = {
      type: 'text',
      ariaLabel: 'Edit name',
      disabled: (ctx) => ctx.rowIndex === 0,
      validate: (value, row) => (String(value).trim() ? null : `name required for #${row.id}`),
    };
    expect(cfg.validate?.('', { id: 7 } as Row)).toBe('name required for #7');
    expect(cfg.validate?.('Ada', { id: 7 } as Row)).toBeNull();
  });

  it('shapes the commit / cancel / error event payloads', () => {
    const base: DtEditContext<Row> = {
      api: {} as Api<Row>,
      row: { id: 1, name: 'Ada' } as Row,
      rowIndex: 0,
      colIndex: 1,
      columnKey: 'name',
      value: 'Ada',
      cell: {} as HTMLTableCellElement,
    };
    const commit: DtCellEditCommit<Row> = { ...base, oldValue: 'Ada', newValue: 'Grace' };
    const reason: DtCellEditCancelReason = 'escape';
    const cancel: DtCellEditCancel<Row> = { ...base, reason };
    const error: DtCellEditError<Row> = { ...commit, error: new Error('save failed') };

    expect(commit.newValue).toBe('Grace');
    expect(cancel.reason).toBe('escape');
    expect((error.error as Error).message).toBe('save failed');
  });

  it('types the save handler as sync/Promise/Observable-returning', () => {
    const syncSave: DtCellSaveHandler<Row> = () => undefined;
    const asyncSave: DtCellSaveHandler<Row> = () => Promise.resolve();
    expect(syncSave({} as DtCellEditCommit<Row>)).toBeUndefined();
    expect(asyncSave({} as DtCellEditCommit<Row>)).toBeInstanceOf(Promise);
  });

  it('types the custom editor template context with commit/cancel helpers', () => {
    let committed: unknown = null;
    const ctx: DtEditorTemplateContext<Row> = {
      $implicit: 'Ada',
      value: 'Ada',
      row: { id: 1, name: 'Ada' } as Row,
      rowIndex: 0,
      colIndex: 1,
      commit: (v) => (committed = v),
      cancel: () => undefined,
    };
    ctx.commit('Grace');
    expect(committed).toBe('Grace');
    expect(ctx.value).toBe('Ada');
  });
});
