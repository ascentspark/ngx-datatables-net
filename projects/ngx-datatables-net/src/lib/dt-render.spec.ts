import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, runInInjectionContext, Injector } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSanitizedHtmlRenderer,
  escapeHtmlRenderer,
  injectSanitizedHtmlRenderer,
} from './dt-render';

const META = { row: 0, col: 0, settings: {} };

describe('escapeHtmlRenderer', () => {
  const render = escapeHtmlRenderer();

  it('escapes HTML special characters for display', () => {
    const out = render('<img src=x onerror="alert(1)">', 'display', {}, META);
    expect(out).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('escapes for filter as well', () => {
    expect(render('<b>', 'filter', {}, META)).toBe('&lt;b&gt;');
  });

  it('passes raw data through for sort/type so ordering stays correct', () => {
    expect(render('<b>raw</b>', 'sort', {}, META)).toBe('<b>raw</b>');
    expect(render('<b>raw</b>', 'type', {}, META)).toBe('<b>raw</b>');
  });

  it('passes through non-strings unchanged (numbers, null, objects)', () => {
    // Critical: null-data columns rely on this so defaultContent / formatting are not clobbered.
    expect(render(42, 'display', {}, META)).toBe(42);
    expect(render(null, 'display', {}, META)).toBeNull();
    const obj = { a: 1 };
    expect(render(obj, 'display', {}, META)).toBe(obj);
  });
});

describe('createSanitizedHtmlRenderer', () => {
  let injector: Injector;

  beforeEach(() => {
    // Explicit zoneless so this spec runs identically on the zoned-by-default Angular 20 line
    // as it does on the zoneless-by-default 21/22 lines.
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    injector = TestBed.inject(Injector);
  });

  it('keeps safe markup but strips scripts / event handlers', () => {
    const render = runInInjectionContext(injector, () => injectSanitizedHtmlRenderer()());
    const out = render(
      '<strong>VIP</strong> <img src=x onerror="alert(1)"> <script>alert(2)</script>',
      'display',
      {},
      META,
    ) as string;
    expect(out).toContain('<strong>VIP</strong>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<script>');
  });

  it('uses a custom extractor when provided', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const render = createSanitizedHtmlRenderer<{ bio: string }>(sanitizer, (row) => row.bio);
    const out = render('ignored', 'display', { bio: '<em>hi</em>' }, META) as string;
    expect(out).toContain('<em>hi</em>');
  });

  it('returns raw data for non-display types', () => {
    const render = runInInjectionContext(injector, () => injectSanitizedHtmlRenderer()());
    expect(render('<b>x</b>', 'sort', {}, META)).toBe('<b>x</b>');
  });
});
