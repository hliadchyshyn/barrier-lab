import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth';
import { db } from '../db';
import { profiles } from '../db/schema';

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', session.user.id);

  const [profile] = await db.select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, session.user.id));

  c.set('userRole', profile?.role ?? 'athlete');
  await next();
}
