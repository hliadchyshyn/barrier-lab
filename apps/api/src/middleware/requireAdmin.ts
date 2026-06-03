import type { Context, Next } from 'hono';

export async function requireAdmin(c: Context, next: Next) {
  if (c.get('userRole') !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
}
