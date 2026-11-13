import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const files = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/sellers', 'sellers.html'],
  ['/sellers/', 'sellers.html'],
  ['/sellers.html', 'sellers.html'],
  ['/products/soft-glow-table-lamp', 'product-lamp.html'],
  ['/products/soft-glow-table-lamp/', 'product-lamp.html'],
  ['/product-lamp.html', 'product-lamp.html'],
  ['/styles.css', 'styles.css'],
]);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
]);

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'ok');
    return;
  }

  const filename = files.get(pathname);
  if (!filename) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const filePath = resolve(root, filename);
  let size;
  try {
    size = (await stat(filePath)).size;
  } catch (error) {
    console.error(`Unable to stat ${filename}:`, error);
    response.writeHead(500);
    response.end('Unable to serve this page');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes.get(extname(filename)) ?? 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://revolte.ai https://*.revolte.ai",
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath)
    .on('error', (error) => {
      console.error(`Unable to read ${filename}:`, error);
      if (!response.headersSent) {
        response.writeHead(500);
      }
      response.end('Unable to serve this page');
    })
    .pipe(response);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Northstar Market preview listening on port ${port}`);
});
