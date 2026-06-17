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
import { extname, join, normalize } from 'node:path';

const [, , root = 'dist/demo/browser', port = '4290'] = process.argv;

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
  try {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (path === '/') return await send(res, join(root, 'index.html'));
    const candidate = join(root, normalize(path));
    try {
      if ((await stat(candidate)).isFile()) return await send(res, candidate);
    } catch {
      /* fall through to SPA fallback */
    }
    return await send(res, join(root, 'index.csr.html'));
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(Number(port), () => console.log(`static serve ${root} on http://localhost:${port}`));
