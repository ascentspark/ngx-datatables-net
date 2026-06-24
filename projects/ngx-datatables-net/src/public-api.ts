/*
 * Public API surface of ngx-datatables-net.
 *
 * Only what is exported here is part of the package's supported surface. Styling adapters live in
 * their own secondary entry points (`ngx-datatables-net/dt`, `/bs5`, `/tailwind`, `/material`).
 */
export * from './lib/datatables.types';
export * from './lib/datatables.tokens';
export * from './lib/dt-cell-template';
export * from './lib/dt-editable.types';
export * from './lib/dt-editable.directive';
export * from './lib/dt-events';
export * from './lib/dt-render';
export * from './lib/dt-table.directive';
export * from './lib/provide-datatables';
