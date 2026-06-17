import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/** A single source snippet shown in the example's code panel. */
export interface ExampleSource {
  label: string;
  code: string;
  lang?: 'ts' | 'html' | 'bash' | 'scss';
}

/**
 * Reusable example wrapper: a titled card containing the live demo (projected content) and a
 * tabbed, copy-to-clipboard source-code panel. Every demo example uses this so the live result
 * and its exact source always sit side by side.
 */
@Component({
  selector: 'demo-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex">
      <header class="ex__head">
        <div class="ex__titlerow">
          <h1 class="ex__title">{{ title() }}</h1>
          @if (docsUrl()) {
            <a class="ex__docs" [href]="docsUrl()" target="_blank" rel="noopener">
              DataTables docs
            </a>
          }
        </div>
        @if (description()) {
          <p class="ex__desc">{{ description() }}</p>
        }
      </header>

      <div class="ex__live">
        <ng-content />
      </div>

      @if (sources().length) {
        <div class="ex__code">
          <div class="ex__tabs" role="tablist">
            @for (s of sources(); track s.label; let i = $index) {
              <button
                type="button"
                role="tab"
                class="ex__tab"
                [class.ex__tab--active]="active() === i"
                [attr.aria-selected]="active() === i"
                (click)="active.set(i)"
              >
                {{ s.label }}
              </button>
            }
            <button type="button" class="ex__copy" (click)="copy()">
              {{ copied() ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <pre
            class="ex__pre"
          ><code [attr.data-lang]="current().lang">{{ current().code }}</code></pre>
        </div>
      }
    </section>
  `,
  styles: `
    .ex {
      background: var(--demo-surface);
      border: 1px solid var(--demo-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-xs);
    }
    .ex__head {
      padding: 1.3rem 1.4rem 0.5rem;
    }
    .ex__titlerow {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .ex__title {
      margin: 0;
      font-family: var(--font-primary);
      font-size: 1.7rem;
      font-weight: 500;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .ex__docs {
      flex: none;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--asc-spark-orange);
      text-decoration: none;
      border: 1px solid var(--demo-border);
      border-radius: var(--radius-pill);
      padding: 0.25rem 0.7rem;
      white-space: nowrap;
    }
    .ex__docs:hover {
      border-color: var(--asc-spark-orange);
    }
    .ex__desc {
      margin: 0.4rem 0 0;
      color: var(--demo-muted);
      font-weight: 300;
      line-height: 1.6;
    }
    .ex__live {
      padding: 1.2rem 1.4rem 1.4rem;
    }
    .ex__code {
      border-top: 1px solid var(--demo-border);
      background: var(--asc-footer-black);
    }
    .ex__tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.55rem 0.85rem 0;
      align-items: center;
    }
    .ex__tab {
      background: transparent;
      color: rgba(255, 255, 255, 0.55);
      border: none;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      padding: 0.4rem 0.85rem;
      font-size: 0.78rem;
      cursor: pointer;
      font-family: var(--font-mono);
      transition: var(--t-fast);
    }
    .ex__tab:hover {
      color: var(--asc-pure-white);
    }
    .ex__tab--active {
      background: rgba(255, 255, 255, 0.08);
      color: var(--asc-pure-white);
    }
    .ex__tab--active::after {
      content: '';
      display: block;
      height: 2px;
      margin-top: 0.4rem;
      background: var(--asc-spark-orange);
    }
    .ex__copy {
      margin-left: auto;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: var(--radius-pill);
      padding: 0.3rem 0.85rem;
      font-family: var(--font-primary);
      font-size: 0.72rem;
      cursor: pointer;
      transition: var(--t-fast);
    }
    .ex__copy:hover {
      border-color: var(--asc-spark-orange);
      color: var(--asc-pure-white);
    }
    .ex__pre {
      margin: 0;
      padding: 1.1rem 1.4rem;
      overflow-x: auto;
      color: #e6e6e6;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      line-height: 1.6;
    }
    /* Reset the global inline-code styling inside the dark code panel. */
    .ex__pre code {
      background: none;
      color: inherit;
      padding: 0;
      font-size: inherit;
      border-radius: 0;
    }
  `,
})
export class ExampleCard {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly sources = input<ExampleSource[]>([]);
  /** Optional link to the matching DataTables documentation, shown next to the title. */
  readonly docsUrl = input<string>('');

  protected readonly active = signal(0);
  protected readonly copied = signal(false);
  protected readonly current = computed(
    () => this.sources()[this.active()] ?? { label: '', code: '' },
  );

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.current().code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context). Ignore silently.
    }
  }
}
