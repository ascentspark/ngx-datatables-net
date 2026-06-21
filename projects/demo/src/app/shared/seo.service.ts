import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare function gtag(...args: unknown[]): void;

const ORIGIN = 'https://ngx-datatables-net.ascentspark.com';
const DEFAULT_DESCRIPTION =
  'Use DataTables.net in Angular 20, 21 and 22: a signal-driven directive with sorting, search, ' +
  'pagination and every DataTables extension. No jQuery in your code.';

/**
 * Keeps the document title, description, canonical link and Open Graph / Twitter tags in sync with
 * the active route, so shared deep links and JS-aware crawlers get correct per-page metadata. The
 * router sets the title from each route's `title`; this service mirrors it into the social tags and
 * uses the route's optional `data.description`.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  init(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        let r = this.route;
        while (r.firstChild) {
          r = r.firstChild;
        }
        const description = (r.snapshot.data['description'] as string) ?? DEFAULT_DESCRIPTION;
        const url = ORIGIN + e.urlAfterRedirects.split(/[?#]/)[0];
        const pageTitle = this.title.getTitle();

        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:title', content: pageTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.setCanonical(url);

        // Explicit GA4 page_view for this SPA navigation (auto page_view is disabled in index.html).
        if (this.isBrowser && typeof gtag === 'function') {
          gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: url,
            page_path: e.urlAfterRedirects,
          });
        }
      });
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
