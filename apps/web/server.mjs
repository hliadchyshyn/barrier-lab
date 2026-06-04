import http from 'http';
import https from 'https';
import { createReadStream, statSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_INTERNAL_URL;

if (!API_URL) {
  console.error('API_INTERNAL_URL env var is required');
  process.exit(1);
}

const apiUrl = new URL(API_URL);
const isHttps = apiUrl.protocol === 'https:';
const transport = isHttps ? https : http;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

const DIST = join(__dirname, 'dist');

const server = http.createServer((req, res) => {
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
      proxyRes.pipe(res);
    });
    proxy.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end('API unavailable');
    });
    req.pipe(proxy);
    return;
  }

  let filePath = join(DIST, req.url.split('?')[0]);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, 'index.html');
  }

  const mime = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`Web server on port ${PORT}`));
