import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { seasons } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';

const createSchema = z.object({
  name:       z.string().min(1),
  discipline: z.string().min(1),
  startedAt:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endedAt:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateSchema = createSchema.partial();

export const seasonsRouter = new Hono();

seasonsRouter.use('*', requireAuth);

seasonsRouter.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const rows = await db.select().from(seasons)
    .where(eq(seasons.userId, userId))
    .orderBy(seasons.startedAt);
  return c.json(rows);
});

seasonsRouter.post('/', zValidator('json', createSchema), async (c) => {
  const userId = c.get('userId') as string;
  const body = c.req.valid('json');
  const [row] = await db.insert(seasons).values({ ...body, userId }).returning();
  return c.json(row, 201);
});

seasonsRouter.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const [row] = await db.update(seasons).set(body)
    .where(and(eq(seasons.id, id), eq(seasons.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

seasonsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const [row] = await db.delete(seasons)
    .where(and(eq(seasons.id, id), eq(seasons.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});
