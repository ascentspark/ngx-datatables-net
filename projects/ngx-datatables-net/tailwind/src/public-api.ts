/*
 * ngx-datatables-net/tailwind, Tailwind styling adapter.
 *
 * DataTables has NO official Tailwind styling package, this adapter is authored by us. It uses the
 * core (unstyled-markup) constructor and ships a self-contained stylesheet scoped under
 * `.ngxdt-tailwind` (added to the container automatically via the `DT_STYLE_SCOPE` token).
 *
 * Include the stylesheet in your app, e.g. angular.json styles:
 *   "node_modules/ngx-datatables-net/tailwind/styles/ngx-datatables-net.tailwind.css"
 */
export * from './with-tailwind';
