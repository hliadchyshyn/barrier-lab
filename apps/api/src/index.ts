import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './lib/auth';
import { seasonsRouter } from './routes/seasons';
import { runsRouter } from './routes/runs';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

app.get('/health', (c) => c.json({ ok: true }));

app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw));

app.route('/api/seasons', seasonsRouter);
app.route('/api/runs', runsRouter);

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  });
}
