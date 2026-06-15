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
        <h1 class="ex__title">{{ title() }}</h1>
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
              {{ copied() ? 'Copied ✓' : 'Copy' }}
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
      border-radius: 10px;
      overflow: hidden;
    }
    .ex__head {
      padding: 1.1rem 1.25rem 0.4rem;
    }
    .ex__title {
      margin: 0;
      font-size: 1.35rem;
    }
    .ex__desc {
      margin: 0.35rem 0 0;
      color: var(--demo-muted);
    }
    .ex__live {
      padding: 1rem 1.25rem 1.25rem;
    }
    .ex__code {
      border-top: 1px solid var(--demo-border);
      background: #0f172a;
    }
    .ex__tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem 0;
      align-items: center;
    }
    .ex__tab {
      background: transparent;
      color: #94a3b8;
      border: none;
      border-radius: 6px 6px 0 0;
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      cursor: pointer;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .ex__tab--active {
      background: #1e293b;
      color: #e2e8f0;
    }
    .ex__copy {
      margin-left: auto;
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 0.3rem 0.7rem;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .ex__pre {
      margin: 0;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
      line-height: 1.55;
    }
  `,
})
export class ExampleCard {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly sources = input<ExampleSource[]>([]);

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
      // Clipboard API unavailable (e.g. non-secure context) — ignore silently.
    }
  }
}
