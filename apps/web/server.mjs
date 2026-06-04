import http from 'http';
import https from 'https';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_INTERNAL_URL;
const DIST = join(__dirname, 'dist');

console.log('__dirname:', __dirname);
console.log('DIST:', DIST);
console.log('DIST exists:', existsSync(DIST));
console.log('index.html exists:', existsSync(join(DIST, 'index.html')));
console.log('API_INTERNAL_URL:', API_URL ? API_URL : '(not set)');
console.log('PORT:', PORT);

if (!API_URL) {
  console.error('ERROR: API_INTERNAL_URL env var is required');
  process.exit(1);
}

let apiUrl;
try {
  apiUrl = new URL(API_URL);
} catch (e) {
  console.error('ERROR: Invalid API_INTERNAL_URL:', API_URL, e.message);
  process.exit(1);
}

const isHttps = apiUrl.protocol === 'https:';
const transport = isHttps ? https : http;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.webp': 'image/webp',
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  try {
    if (req.url.startsWith('/api/')) {
      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || (isHttps ? 443 : 80),
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: apiUrl.host },
      };
      const proxy = transport.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxy.on('error', (err) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) res.writeHead(502);
        res.end('API unavailable');
      });
      req.pipe(proxy, { end: true });
      return;
    }

    let filePath = join(DIST, req.url.split('?')[0]);
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(DIST, 'index.html');
    }

    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const mime = MIME[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    const stream = createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) res.writeHead(500);
      res.end('Internal Server Error');
    });
    stream.pipe(res, { end: true });
  } catch (err) {
    console.error('Request handler error:', err);
    if (!res.headersSent) res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Web server on port ${PORT}`));
