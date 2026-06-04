import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { profiles } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import type { AppVariables } from '../types';

export const profileRouter = new Hono<{ Variables: AppVariables }>();

profileRouter.use('*', requireAuth);

profileRouter.get('/', async (c) => {
  const userId = c.get('userId') as string;
  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (!profile) return c.json({ error: 'Not found' }, 404);
    return c.json(profile);
  } catch {
    return c.json({ error: 'Internal server error' }, 500);
  }
});
