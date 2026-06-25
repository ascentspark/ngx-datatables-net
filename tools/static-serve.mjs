/**
 * Minimal static server that mirrors the intended production hosting for the prerendered demo:
 *   - exact files are served as-is,
 *   - "/" serves the prerendered index.html,
 *   - any other path with no matching file falls back to index.csr.html (the client-render shell),
 *     so client-rendered deep links boot the SPA instead of 404ing.
 *
 * Usage: node tools/static-serve.mjs <rootDir> <port>
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [, , root = 'dist/demo/browser', port = '4290'] = process.argv;
const ROOT = resolve(root);

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

async function send(res, file, status = 200) {
  const body = await readFile(file);
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(body);
}

createServer(async (req, res) => {
  const spaFallback = () => send(res, join(ROOT, 'index.csr.html'));
  try {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (path === '/') return await send(res, join(ROOT, 'index.html'));
    // Resolve the request against ROOT and confirm it stays inside ROOT before
    // touching the filesystem, so a crafted path (e.g. "/../secret") can never
    // escape the served directory. Anything that escapes gets the SPA shell.
    const candidate = resolve(ROOT, '.' + normalize(path));
    if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return await spaFallback();
    try {
      if ((await stat(candidate)).isFile()) return await send(res, candidate);
    } catch {
      /* fall through to SPA fallback */
    }
    return await spaFallback();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Internal Server Error');
  }
}).listen(Number(port), () => console.log(`static serve ${root} on http://localhost:${port}`));
