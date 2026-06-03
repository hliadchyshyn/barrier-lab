import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { profiles, runs, user, verification } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const adminRouter = new Hono();

adminRouter.use('*', requireAuth, requireAdmin);

// GET /api/admin/users — list all users with run count and video count
adminRouter.get('/users', async (c) => {
  const rows = await db
    .select({
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       profiles.role,
      createdAt:  user.createdAt,
      runCount:   sql<number>`cast(count(${runs.id}) as int)`,
      videoCount: sql<number>`cast(sum(case when ${runs.videoUploaded} then 1 else 0 end) as int)`,
    })
    .from(user)
    .leftJoin(profiles, eq(profiles.id, user.id))
    .leftJoin(runs, eq(runs.userId, user.id))
    .groupBy(user.id, user.name, user.email, profiles.role, user.createdAt)
    .orderBy(user.createdAt);

  return c.json(rows);
});

// DELETE /api/admin/users/:id — delete user (cascades via FK)
adminRouter.delete('/users/:id', async (c) => {
  const id = c.req.param('id');
  await db.delete(user).where(eq(user.id, id));
  return c.json({ ok: true });
});

// POST /api/admin/users/:id/reset-password — generate reset token
adminRouter.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id');
  const [targetUser] = await db.select({ email: user.email })
    .from(user).where(eq(user.id, id));
  if (!targetUser) return c.json({ error: 'Not found' }, 404);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(verification).values({
    id:         crypto.randomUUID(),
    identifier: `reset-password:${targetUser.email}`,
    value:      token,
    expiresAt,
  });

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
  const resetUrl = `${baseUrl}/api/auth/reset-password?token=${token}`;
  return c.json({ resetUrl });
});

// GET /api/admin/stats
adminRouter.get('/stats', async (c) => {
  const [[users], [runStats]] = await Promise.all([
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(user),
    db.select({
      totalRuns:  sql<number>`cast(count(*) as int)`,
      videoCount: sql<number>`cast(sum(case when ${runs.videoUploaded} then 1 else 0 end) as int)`,
    }).from(runs),
  ]);

  return c.json({
    totalUsers:  users.total,
    totalRuns:   runStats.totalRuns,
    videoCount:  runStats.videoCount,
  });
});
