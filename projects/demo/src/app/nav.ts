/** Sidebar navigation model for the demo. Each item maps to a route. */
export interface NavItem {
  path: string;
  label: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: 'Getting started',
    items: [
      { path: '', label: 'Introduction' },
      { path: 'basic', label: 'Basic table' },
    ],
  },
  {
    title: 'Data sourcing',
    items: [
      { path: 'data/live-reload', label: 'Signal-driven reload' },
      { path: 'data/dom', label: 'DOM-sourced table' },
      { path: 'data/ajax', label: 'Client-side Ajax' },
      { path: 'data/server-side', label: 'Server-side processing' },
    ],
  },
  {
    title: 'Features',
    items: [
      { path: 'features/columns', label: 'Columns & visibility' },
      { path: 'features/renderers', label: 'Renderers & XSS safety' },
      { path: 'features/templates', label: 'Angular cell templates' },
      { path: 'features/edit-in-place', label: 'Edit in place' },
      { path: 'features/pagination', label: 'Pagination' },
      { path: 'features/sorting', label: 'Sorting' },
      { path: 'features/filtering', label: 'Filtering' },
      { path: 'features/range-filter', label: 'Custom range filter' },
      { path: 'features/selection', label: 'Selection (two-way)' },
      { path: 'features/reactive-options', label: 'Reactive options' },
      { path: 'features/i18n', label: 'i18n & accessibility' },
    ],
  },
  {
    title: 'Styling adapters',
    items: [
      { path: 'styling/dt', label: 'Default (dt)' },
      { path: 'styling/bs5', label: 'Bootstrap 5' },
      { path: 'styling/tailwind', label: 'Tailwind' },
      { path: 'styling/material', label: 'Material' },
    ],
  },
  {
    title: 'Extensions',
    items: [
      { path: 'ext/buttons', label: 'Buttons (export)' },
      { path: 'ext/select', label: 'Select' },
      { path: 'ext/column-control', label: 'ColumnControl' },
      { path: 'ext/responsive', label: 'Responsive' },
      { path: 'ext/fixed', label: 'FixedHeader & FixedColumns' },
      { path: 'ext/scroller', label: 'Scroller (virtual)' },
      { path: 'ext/reorder', label: 'RowGroup & Reorder' },
      { path: 'ext/search-panes', label: 'SearchPanes & Builder' },
      { path: 'ext/keytable', label: 'KeyTable, AutoFill, DateTime' },
      { path: 'ext/state', label: 'StateRestore' },
      { path: 'ext/plugin', label: 'Community plugin' },
      { path: 'ext/combination', label: 'Combination showcase' },
      { path: 'ext/editor', label: 'Editor (compatibility)' },
    ],
  },
  {
    title: 'Advanced',
    items: [{ path: 'advanced/ssr', label: 'SSR & hydration' }],
  },
];
