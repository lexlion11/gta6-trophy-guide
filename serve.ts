// Tiny static file server for the app, Node 22 stdlib only.
// Serves ./app on http://localhost:8080 (used for screenshot captures).
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./app/', import.meta.url));
const PORT = 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Serving ${root} at http://localhost:${PORT}`);
});
