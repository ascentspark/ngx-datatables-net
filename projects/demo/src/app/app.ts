import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV } from './nav';
import { AscGlyph } from './shared/asc-glyph';
import { SeoService } from './shared/seo.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AscGlyph],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly nav = NAV;
  protected readonly dark = signal(false);

  constructor() {
    inject(SeoService).init();
  }

  protected toggleDark(): void {
    this.dark.update((d) => !d);
    document.documentElement.classList.toggle('dark', this.dark());
  }
}
