import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth';
import { db } from '../db';
import { profiles } from '../db/schema';

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', session.user.id);

  let role: 'athlete' | 'coach' | 'admin' = 'athlete';
  try {
    const [profile] = await db.select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, session.user.id));
    if (profile?.role) role = profile.role;
  } catch {
    // DB failure — proceed as athlete, request will fail on data queries anyway
  }

  c.set('userRole', role);
  await next();
}
