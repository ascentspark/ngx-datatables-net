import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DtTableDirective, type Config } from 'ngx-datatables-net';
import { EMPLOYEES, EMPLOYEE_COLUMNS, type Employee } from '../../data/employees';
import { ExampleCard, type ExampleSource } from '../../shared/example-card';

// Typed loosely on purpose: importing the ColumnControl extension elsewhere augments DataTables'
// ConfigLanguage with a required `columnControl` field, which would otherwise reject these partial
// language objects. The directive forwards them to DataTables verbatim.
const LANGUAGES: Record<string, Record<string, unknown>> = {
  English: {},
  Deutsch: {
    search: 'Suche:',
    lengthMenu: '_MENU_ Einträge pro Seite',
    info: '_START_ bis _END_ von _TOTAL_ Einträgen',
    infoEmpty: 'Keine Einträge',
    zeroRecords: 'Keine passenden Einträge gefunden',
    paginate: { first: 'Erste', last: 'Letzte', next: 'Nächste', previous: 'Vorherige' },
  },
  Français: {
    search: 'Rechercher :',
    lengthMenu: '_MENU_ entrées par page',
    info: '_START_ à _END_ sur _TOTAL_ entrées',
    infoEmpty: 'Aucune entrée',
    zeroRecords: 'Aucune entrée correspondante trouvée',
    paginate: { first: 'Premier', last: 'Dernier', next: 'Suivant', previous: 'Précédent' },
  },
};

/**
 * Internationalisation via the `language` option, and accessibility notes. DataTables emits proper
 * ARIA roles/labels on the generated table; localise the chrome strings through `language`.
 */
@Component({
  selector: 'demo-features-i18n',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DtTableDirective, ExampleCard],
  template: `
    <demo-example
      title="i18n & accessibility"
      description="Localise the table chrome via the language option (try German/French). DataTables also adds ARIA roles, sortable-column labels and live-region announcements automatically."
      [sources]="sources"
    >
      <div class="demo-toolbar">
        <label
          >Language:
          <select (change)="lang.set($any($event.target).value)" data-testid="lang-select">
            @for (l of languageKeys; track l) {
              <option [value]="l">{{ l }}</option>
            }
          </select>
        </label>
      </div>

      <table
        dtTable
        class="display"
        style="width:100%"
        [dtData]="data"
        [dtColumns]="columns"
        [dtOptions]="options()"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Age</th>
            <th>Start date</th>
            <th>Salary</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>

      <p class="demo-note">
        Accessibility: DataTables sets <code>role</code>/<code>aria-sort</code> on headers and uses
        an ARIA live region for paging/search announcements. Keep a meaningful
        <code>&lt;caption&gt;</code> or <code>aria-label</code> on the table for screen-reader
        context.
      </p>
    </demo-example>
  `,
})
export class FeaturesI18n {
  protected readonly data: readonly Employee[] = EMPLOYEES;
  protected readonly columns = EMPLOYEE_COLUMNS;
  protected readonly languageKeys = Object.keys(LANGUAGES);
  protected readonly lang = signal('English');
  protected readonly options = computed<Config>(() => ({
    language: LANGUAGES[this.lang()] as unknown as Config['language'],
  }));

  protected readonly sources: ExampleSource[] = [
    {
      label: 'component.ts',
      lang: 'ts',
      code: `lang = signal('Deutsch');
options = computed<Config>(() => ({
  language: {
    search: 'Suche:',
    lengthMenu: '_MENU_ Einträge pro Seite',
    info: '_START_ bis _END_ von _TOTAL_ Einträgen',
    paginate: { next: 'Nächste', previous: 'Vorherige' },
  },
}));`,
    },
  ];
}
