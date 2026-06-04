import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';
import { auth } from './lib/auth';
import { seasonsRouter } from './routes/seasons';
import { runsRouter } from './routes/runs';
import { videoRouter } from './routes/video';
import { adminRouter } from './routes/admin';
import { profileRouter } from './routes/profile';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

app.get('/health', (c) => c.json({ ok: true }));

app.on(['GET', 'POST'], '/api/auth/**', async (c) => {
  const response = await auth.handler(c.req.raw);
  const requestOrigin = c.req.header('origin') ?? '';
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());
  if (allowedOrigins.includes(requestOrigin)) {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', requestOrigin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    return new Response(response.body, { status: response.status, headers });
  }
  return response;
});

app.route('/api/seasons', seasonsRouter);
app.route('/api/runs', runsRouter);
app.route('/api/runs', videoRouter);
app.route('/api/admin', adminRouter);
app.route('/api/profile', profileRouter);

if (process.env.NODE_ENV !== 'test') {
  await migrate(db, { migrationsFolder: './drizzle' });
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  });
}
