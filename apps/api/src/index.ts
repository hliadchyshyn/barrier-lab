import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

app.get('/health', (c) => c.json({ ok: true }));

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  });
}
