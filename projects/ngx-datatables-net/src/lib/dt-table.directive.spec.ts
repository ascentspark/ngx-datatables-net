import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Config, ConfigColumns } from 'datatables.net';
import { DtTableDirective } from './dt-table.directive';

interface Row {
  id: number;
  name: string;
}

@Component({
  imports: [DtTableDirective],
  template: `
    <table dtTable #t="dtTable" [dtData]="data()" [dtColumns]="cols" [dtOptions]="opts()">
      <thead>
        <tr><th>ID</th><th>Name</th></tr>
      </thead>
    </table>
  `,
})
class HostComponent {
  readonly data = signal<Row[]>([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
  ]);
  readonly cols: ConfigColumns[] = [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
  ];
  readonly opts = signal<Config>({});
  readonly dir = viewChild.required<DtTableDirective<Row>>('t');
}

async function mount(): Promise<{ fixture: ComponentFixture<HostComponent>; host: HostComponent }> {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance };
}

describe('DtTableDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('initializes a DataTables instance after render', async () => {
    const { host } = await mount();
    const api = host.dir().instance();
    expect(api).toBeDefined();
    expect(host.dir().ready()).toBe(true);
    expect(api!.rows().count()).toBe(2);
  });

  it('reconciles new data via the cheap path (same instance, updated rows)', async () => {
    const { fixture, host } = await mount();
    const before = host.dir().instance();
    host.data.set([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Linus' },
      { id: 3, name: 'Grace' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.dir().instance()).toBe(before); // not recreated
    expect(host.dir().instance()!.rows().count()).toBe(3);
  });

  it('recreates the table when options change structurally', async () => {
    const { fixture, host } = await mount();
    const before = host.dir().instance();
    host.opts.set({ paging: false });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.dir().instance()).not.toBe(before); // recreated
  });

  it('does NOT recreate when a new but structurally-equal options object is bound', async () => {
    // Guards the structural-key hardening against inline `[dtOptions]="{}"` reference churn.
    const { fixture, host } = await mount();
    const before = host.dir().instance();
    host.opts.set({}); // new reference, identical content
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.dir().instance()).toBe(before);
  });

  it('destroys the instance when the component is destroyed', async () => {
    const { fixture, host } = await mount();
    expect(host.dir().instance()).toBeDefined();
    fixture.destroy();
    expect(host.dir().instance()).toBeUndefined();
  });
});
