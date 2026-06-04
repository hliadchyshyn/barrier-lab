import type { Context, Next } from 'hono';
import type { AppVariables } from '../types';

export async function requireAdmin(c: Context<{ Variables: AppVariables }>, next: Next) {
  if (c.get('userRole') !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
}
