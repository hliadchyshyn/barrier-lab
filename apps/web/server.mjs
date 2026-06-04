import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_INTERNAL_URL;

if (!API_URL) {
  console.error('API_INTERNAL_URL env var is required');
  process.exit(1);
}

const app = express();

app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(502).json({ error: 'API unavailable' });
    },
  },
}));

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (_, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Web server on port ${PORT}`));
