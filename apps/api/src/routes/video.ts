import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { runs } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { getUploadUrl, getDownloadUrl, deleteObject } from '../lib/r2';

export const videoRouter = new Hono();

videoRouter.use('*', requireAuth);

function videoKey(userId: string, runId: string): string {
  return `${userId}/${runId}.mp4`;
}

// POST /api/runs/:id/video-upload-url
videoRouter.post(
  '/:id/video-upload-url',
  zValidator('json', z.object({ contentType: z.string() })),
  async (c) => {
    const userId = c.get('userId') as string;
    const id     = c.req.param('id');
    const { contentType } = c.req.valid('json');

    const [run] = await db.select().from(runs)
      .where(and(eq(runs.id, id), eq(runs.userId, userId)));
    if (!run) return c.json({ error: 'Not found' }, 404);

    const key = videoKey(userId, id);
    const url = await getUploadUrl(key, contentType);

    await db.update(runs).set({ videoKey: key }).where(eq(runs.id, id));

    return c.json({ url, key });
  },
);

// PATCH /api/runs/:id/video-uploaded
videoRouter.patch('/:id/video-uploaded', async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const [row]  = await db.update(runs)
    .set({ videoUploaded: true })
    .where(and(eq(runs.id, id), eq(runs.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

// GET /api/runs/:id/video-url
videoRouter.get('/:id/video-url', async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const [run]  = await db.select().from(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)));

  if (!run) return c.json({ error: 'Not found' }, 404);
  if (!run.videoKey || !run.videoUploaded) return c.json({ error: 'No video' }, 404);

  const url = await getDownloadUrl(run.videoKey);
  return c.json({ url });
});

// DELETE /api/runs/:id/video
videoRouter.delete('/:id/video', async (c) => {
  const userId = c.get('userId') as string;
  const id     = c.req.param('id');
  const [run]  = await db.select().from(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)));

  if (!run) return c.json({ error: 'Not found' }, 404);

  if (run.videoKey) {
    await deleteObject(run.videoKey).catch(() => {});
    await db.update(runs)
      .set({ videoKey: null, videoUploaded: false })
      .where(eq(runs.id, id));
  }

  return c.json({ ok: true });
});
