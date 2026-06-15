// Ambient declarations for untyped JS modules used by the demo.

/** pdfMake ships no types for these build entry points. */
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: { vfs: unknown; [key: string]: unknown };
  export default pdfMake;
}
declare module 'pdfmake/build/vfs_fonts' {
  const fonts: { pdfMake?: { vfs?: unknown }; vfs?: unknown };
  export default fonts;
}
