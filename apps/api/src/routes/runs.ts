import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { runs } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import type { HurdleEvent } from '@barrier-lab/types';

const hurdleEventSchema = z.object({
  type:        z.enum(['start', 'hurdle', 'finish']),
  hurdleIndex: z.number().optional(),
  videoTime:   z.number(),
});

const createSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1),
  discipline:  z.string().min(1),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hurdleCount: z.number().int().min(1),
  events:      z.array(hurdleEventSchema).default([]),
  notes:       z.string().default(''),
  seasonId:    z.string().uuid().optional(),
  createdAt:   z.number(),
});

const updateSchema = z.object({
  events:   z.array(hurdleEventSchema).optional(),
  notes:    z.string().optional(),
  seasonId: z.string().uuid().nullable().optional(),
  name:     z.string().min(1).optional(),
});

export const runsRouter = new Hono();

runsRouter.use('*', requireAuth);

runsRouter.get('/', async (c) => {
  const userId   = c.get('userId') as string;
  const seasonId = c.req.query('season_id');
  const limit    = Math.min(Number(c.req.query('limit') ?? 100), 500);
  const offset   = Number(c.req.query('offset') ?? 0);

  const rows = await db.select().from(runs)
    .where(and(
      eq(runs.userId, userId),
      ...(seasonId ? [eq(runs.seasonId, seasonId)] : []),
    ))
    .orderBy(desc(runs.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

runsRouter.post('/', zValidator('json', createSchema), async (c) => {
  const userId = c.get('userId') as string;
  const body   = c.req.valid('json');
  const [row]  = await db.insert(runs).values({
    ...body,
    userId,
    events: body.events as HurdleEvent[],
    createdAt: new Date(body.createdAt),
  }).returning();
  return c.json(row, 201);
});

runsRouter.get('/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const [row]  = await db.select().from(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)));
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

runsRouter.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const body   = c.req.valid('json');
  const [row]  = await db.update(runs).set(body)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

runsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const [row]  = await db.delete(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});
