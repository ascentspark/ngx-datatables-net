import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Ascentspark mark: a single brush-stroke that draws an "A". Inlined so it can be coloured
 * with `currentColor` and sized with `font-size` / `height`. Sourced from the Ascentspark design
 * system (ascentspark-icon-logo.svg).
 */
@Component({
  selector: 'asc-glyph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 16 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.51561 2.73925C9.29692 2.65802 9.4674 8.55217 9.79897 10.8623C9.79459 11.0401 9.82373 11.2171 9.88471 11.3831C9.94569 11.5491 10.0373 11.7009 10.1544 11.8299C10.2714 11.9588 10.4116 12.0623 10.5669 12.1345C10.7222 12.2067 10.8895 12.2462 11.0594 12.2506C11.2294 12.2542 11.3983 12.2227 11.5566 12.1579C11.7149 12.0931 11.8595 11.9962 11.982 11.8729C12.1045 11.7496 12.2026 11.6021 12.2707 11.4391C12.3387 11.276 12.3754 11.1005 12.3786 10.9226C12.1893 9.58479 10.4457 -2.38321 6.36217 0.425402C4.37628 1.79402 2.41861 10.6666 1.90714 12.8734C1.39568 15.0802 -1.65664 25.8789 1.22989 27.6562C5.69785 30.4045 10.689 15.7756 11.9166 15.586C12.9748 15.4223 17.09 25.6488 14.3751 25.6131C13.2205 25.6032 11.0206 24.7294 9.82249 24.3823C11.0888 25.1836 13.1147 26.4045 14.6914 26.338C18.1011 26.1903 14.0729 13.7116 11.6826 14.2432C11.1182 14.3663 10.1447 15.8666 9.21344 17.4765C8.28222 19.0863 7.51914 20.4586 7.15817 21.0112C7.15817 21.0112 1.45329 29.4494 1.78957 24.1731C2.08116 19.586 2.84777 16.6654 4.02355 12.4242C5.03119 8.80325 5.75194 2.82417 7.51914 2.73925H7.51561Z"
        fill="currentColor"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }
    svg {
      height: 1em;
      width: auto;
    }
  `,
})
export class AscGlyph {}
