import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

/** Serve the production HTML/assets without contacting the chat service. */
export async function serveSite(directory = 'dist/client') {
  const root = resolve(directory);
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
  const server = createServer((req, res) => {
    let path;
    try {
      const request = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      path = resolve(root, '.' + request, request.endsWith('/') ? 'index.html' : '');
    } catch {
      res.writeHead(400).end('Bad Request');
      return;
    }
    if (!path.startsWith(root + '/') || !existsSync(path) || !statSync(path).isFile()) {
      res.writeHead(404).end('Not Found');
      return;
    }
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream');
    res.end(readFileSync(path));
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(done => server.close(done)),
  };
}
