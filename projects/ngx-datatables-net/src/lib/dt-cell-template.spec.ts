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
import { DtTableDirective } from './dt-table.directive';
import type { DtCellContext, DtColumn } from './dt-cell-template';

interface Row {
  id: number;
  name: string;
}

@Component({
  imports: [DtTableDirective],
  template: `
    <table dtTable #t="dtTable" [dtData]="data()" [dtColumns]="cols()">
      <thead>
        <tr><th>ID</th><th>Name</th></tr>
      </thead>
    </table>
    <ng-template #nameTpl let-value let-row="row">
      <span class="tpl-cell" (click)="clicked.set(row.id)">{{ value }}!</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly data = signal<Row[]>([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
  ]);
  readonly clicked = signal<number | null>(null);
  readonly nameTpl = viewChild<TemplateRef<DtCellContext<Row>>>('nameTpl');
  readonly cols = computed<DtColumn<Row>[] | undefined>(() => {
    const tpl = this.nameTpl();
    if (!tpl) {
      return undefined;
    }
    return [
      { data: 'id', title: 'ID' },
      { data: 'name', title: 'Name', dtTemplate: tpl },
    ];
  });
  readonly dir = viewChild.required<DtTableDirective<Row>>('t');
}

async function mount(): Promise<{ fixture: ComponentFixture<HostComponent>; host: HostComponent }> {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance };
}

describe('DtColumn dtTemplate (Angular cell templates)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('renders an Angular template into the cell', async () => {
    const { fixture } = await mount();
    const cells = fixture.nativeElement.querySelectorAll('table tbody td .tpl-cell');
    expect(cells.length).toBe(2);
    expect((cells[0] as HTMLElement).textContent).toContain('Ada!');
  });

  it('wires cell event bindings under zoneless (click updates a signal)', async () => {
    const { fixture, host } = await mount();
    const cell = fixture.nativeElement.querySelector('table tbody td .tpl-cell') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    expect(host.clicked()).toBe(1);
  });

  it('tears down cell views when the table is destroyed', async () => {
    const { fixture } = await mount();
    expect(fixture.nativeElement.querySelectorAll('.tpl-cell').length).toBe(2);
    fixture.destroy();
    expect(fixture.nativeElement.querySelectorAll('.tpl-cell').length).toBe(0);
  });
});
