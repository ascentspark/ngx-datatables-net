import { inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * A DataTables column render function: `(data, type, row, meta) => cell-output`.
 * Mirrors the signature DataTables passes to `columns.render`.
 */
export type DtRenderFn<T = unknown> = (
  data: unknown,
  type: 'display' | 'filter' | 'sort' | 'type' | string,
  row: T,
  meta: { row: number; col: number; settings: unknown },
) => unknown;

/**
 * SECURITY, why this exists.
 *
 * DataTables writes cell content to the DOM directly (via jQuery), which **bypasses Angular's
 * template sanitization**. `DomSanitizer` only guards values bound through Angular templates, so
 * an HTML cell renderer fed user data is a live XSS sink. This helper funnels HTML output through
 * `DomSanitizer.sanitize(SecurityContext.HTML, value)` before it ever reaches DataTables.
 *
 * Use it ONLY for the `'display'` (and optionally `'filter'`) render types, sort/type values
 * should remain the raw underlying data so ordering and filtering stay correct.
 *
 * @example
 * columns: [{ data: 'bio', render: createSanitizedHtmlRenderer(sanitizer, r => r.bioHtml) }]
 */
export function createSanitizedHtmlRenderer<T = unknown>(
  sanitizer: DomSanitizer,
  /** Extract the raw HTML string to render for a row. Defaults to the cell `data`. */
  html: (row: T, data: unknown) => string | null | undefined = (_row, data) =>
    data == null ? '' : String(data),
): DtRenderFn<T> {
  return (data, type, row) => {
    // Only sanitize the user-visible 'display' output; keep raw data for sort/filter/type so
    // DataTables' ordering and searching operate on the unescaped underlying value.
    if (type !== 'display' && type !== 'filter') {
      return data;
    }
    const raw = html(row, data);
    return sanitizer.sanitize(SecurityContext.HTML, raw ?? '') ?? '';
  };
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * A render function that ESCAPES HTML for display/filter, leaving raw data for sort/type.
 *
 * IMPORTANT: DataTables does **not** escape cell content by default, it writes data as innerHTML,
 * which is an XSS sink for untrusted data. This renderer makes a column render as plain, escaped
 * text. It is what `withSafeDefaults()` applies to every column that has no explicit `render`.
 */
export function escapeHtmlRenderer<T = unknown>(): DtRenderFn<T> {
  return (data, type) => {
    // Only escape STRINGS for display/filter, strings are the only XSS carrier. Numbers, booleans,
    // null/undefined and objects are passed through unchanged so DataTables' `defaultContent`,
    // null-data columns and numeric formatting keep working (escaping them would print "[object
    // Object]" or clobber defaultContent).
    if (type !== 'display' && type !== 'filter') {
      return data;
    }
    if (typeof data !== 'string') {
      return data;
    }
    return data.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
  };
}

/**
 * Injectable convenience: returns a factory bound to the current injector's `DomSanitizer`.
 * Call within an injection context (constructor / field initializer).
 *
 * @example
 * private readonly safeHtml = injectSanitizedHtmlRenderer();
 * // ...
 * { data: 'note', render: this.safeHtml(r => r.noteHtml) }
 */
export function injectSanitizedHtmlRenderer(): <T = unknown>(
  html?: (row: T, data: unknown) => string | null | undefined,
) => DtRenderFn<T> {
  const sanitizer = inject(DomSanitizer);
  return <T = unknown>(html?: (row: T, data: unknown) => string | null | undefined) =>
    createSanitizedHtmlRenderer<T>(sanitizer, html);
}
