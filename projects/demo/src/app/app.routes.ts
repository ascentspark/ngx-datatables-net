import { Routes } from '@angular/router';
import { provideDataTables, withOptions } from 'ngx-datatables-net';
import { withDefaultStyling } from 'ngx-datatables-net/dt';
import { withBootstrap5 } from 'ngx-datatables-net/bs5';
import { withTailwind } from 'ngx-datatables-net/tailwind';
import { withMaterial } from 'ngx-datatables-net/material';

const styledTable = () => import('./examples/styling/styled-table').then((m) => m.StyledTable);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./examples/basic-table/basic-table').then((m) => m.BasicTable),
    title: 'Basic table — ngx-datatables-net',
  },

  // ---- Data sourcing -----------------------------------------------------------------------
  {
    path: 'data/live-reload',
    loadComponent: () => import('./examples/data/live-reload').then((m) => m.DataLiveReload),
    title: 'Signal-driven reload — ngx-datatables-net',
  },
  {
    path: 'data/dom',
    loadComponent: () => import('./examples/data/dom-sourced').then((m) => m.DataDomSourced),
    title: 'DOM-sourced table — ngx-datatables-net',
  },
  {
    path: 'data/ajax',
    loadComponent: () => import('./examples/data/ajax').then((m) => m.DataAjax),
    title: 'Client-side Ajax — ngx-datatables-net',
  },
  {
    path: 'data/server-side',
    loadComponent: () => import('./examples/data/server-side').then((m) => m.DataServerSide),
    title: 'Server-side processing — ngx-datatables-net',
  },

  // ---- Features ----------------------------------------------------------------------------
  {
    path: 'features/columns',
    loadComponent: () => import('./examples/features/columns').then((m) => m.FeaturesColumns),
    title: 'Columns & visibility — ngx-datatables-net',
  },
  {
    path: 'features/renderers',
    loadComponent: () => import('./examples/features/renderers').then((m) => m.FeaturesRenderers),
    title: 'Renderers & XSS safety — ngx-datatables-net',
  },
  {
    path: 'features/pagination',
    loadComponent: () => import('./examples/features/pagination').then((m) => m.FeaturesPagination),
    title: 'Pagination — ngx-datatables-net',
  },
  {
    path: 'features/sorting',
    loadComponent: () => import('./examples/features/sorting').then((m) => m.FeaturesSorting),
    title: 'Sorting — ngx-datatables-net',
  },
  {
    path: 'features/filtering',
    loadComponent: () => import('./examples/features/filtering').then((m) => m.FeaturesFiltering),
    title: 'Filtering — ngx-datatables-net',
  },
  {
    path: 'features/selection',
    loadComponent: () => import('./examples/features/selection').then((m) => m.FeaturesSelection),
    title: 'Selection — ngx-datatables-net',
  },
  {
    path: 'features/reactive-options',
    loadComponent: () =>
      import('./examples/features/reactive-options').then((m) => m.FeaturesReactiveOptions),
    title: 'Reactive options — ngx-datatables-net',
  },
  {
    path: 'features/i18n',
    loadComponent: () => import('./examples/features/i18n').then((m) => m.FeaturesI18n),
    title: 'i18n & accessibility — ngx-datatables-net',
  },

  // ---- Styling adapters --------------------------------------------------------------------
  {
    path: 'styling/dt',
    loadComponent: styledTable,
    providers: [provideDataTables(withDefaultStyling(), withOptions({ pageLength: 10 }))],
    data: { label: 'Default (dt)' },
    title: 'Default styling — ngx-datatables-net',
  },
  {
    path: 'styling/bs5',
    loadComponent: styledTable,
    providers: [provideDataTables(withBootstrap5(), withOptions({ pageLength: 10 }))],
    // Bootstrap + DataTables-bs5 CSS are lazy bundles (angular.json, inject:false) loaded only here.
    data: { label: 'Bootstrap 5', styles: ['bootstrap.css', 'datatables-bs5.css'] },
    title: 'Bootstrap 5 styling — ngx-datatables-net',
  },
  {
    path: 'styling/tailwind',
    loadComponent: styledTable,
    providers: [provideDataTables(withTailwind(), withOptions({ pageLength: 10 }))],
    data: { label: 'Tailwind' },
    title: 'Tailwind styling — ngx-datatables-net',
  },
  {
    path: 'styling/material',
    loadComponent: styledTable,
    providers: [provideDataTables(withMaterial(), withOptions({ pageLength: 10 }))],
    data: { label: 'Material' },
    title: 'Material styling — ngx-datatables-net',
  },

  // ---- Extensions --------------------------------------------------------------------------
  {
    path: 'ext/buttons',
    loadComponent: () => import('./examples/ext/buttons').then((m) => m.ExtButtons),
    title: 'Buttons — ngx-datatables-net',
  },
  {
    path: 'ext/select',
    loadComponent: () => import('./examples/ext/select').then((m) => m.ExtSelect),
    title: 'Select — ngx-datatables-net',
  },
  {
    path: 'ext/column-control',
    loadComponent: () => import('./examples/ext/column-control').then((m) => m.ExtColumnControl),
    title: 'ColumnControl — ngx-datatables-net',
  },
  {
    path: 'ext/responsive',
    loadComponent: () => import('./examples/ext/responsive').then((m) => m.ExtResponsive),
    title: 'Responsive — ngx-datatables-net',
  },
  {
    path: 'ext/fixed',
    loadComponent: () => import('./examples/ext/fixed').then((m) => m.ExtFixed),
    title: 'FixedHeader & FixedColumns — ngx-datatables-net',
  },
  {
    path: 'ext/scroller',
    loadComponent: () => import('./examples/ext/scroller').then((m) => m.ExtScroller),
    title: 'Scroller — ngx-datatables-net',
  },
  {
    path: 'ext/reorder',
    loadComponent: () => import('./examples/ext/reorder').then((m) => m.ExtReorder),
    title: 'RowGroup & Reorder — ngx-datatables-net',
  },
  {
    path: 'ext/search-panes',
    loadComponent: () => import('./examples/ext/search-panes').then((m) => m.ExtSearchPanes),
    title: 'SearchPanes & SearchBuilder — ngx-datatables-net',
  },
  {
    path: 'ext/keytable',
    loadComponent: () => import('./examples/ext/keytable').then((m) => m.ExtKeyTable),
    title: 'KeyTable, AutoFill, DateTime — ngx-datatables-net',
  },
  {
    path: 'ext/state',
    loadComponent: () => import('./examples/ext/state').then((m) => m.ExtState),
    title: 'StateRestore — ngx-datatables-net',
  },
  {
    path: 'ext/plugin',
    loadComponent: () => import('./examples/ext/plugin').then((m) => m.ExtPlugin),
    title: 'Community plugin — ngx-datatables-net',
  },
  {
    path: 'ext/combination',
    loadComponent: () => import('./examples/ext/combination').then((m) => m.ExtCombination),
    title: 'Combination showcase — ngx-datatables-net',
  },
  {
    path: 'ext/editor',
    loadComponent: () => import('./examples/ext/editor').then((m) => m.ExtEditor),
    title: 'Editor (compatibility) — ngx-datatables-net',
  },

  // ---- Advanced ----------------------------------------------------------------------------
  {
    path: 'advanced/ssr',
    loadComponent: () => import('./examples/advanced/ssr').then((m) => m.AdvancedSsr),
    title: 'SSR & hydration — ngx-datatables-net',
  },
];
