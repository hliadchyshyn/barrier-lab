import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('Video API', () => {
  it('POST /api/runs/:id/video-upload-url returns 401 without auth', async () => {
    const res = await app.request(
      '/api/runs/00000000-0000-0000-0000-000000000001/video-upload-url',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: 'video/mp4' }) },
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/runs/:id/video-url returns 401 without auth', async () => {
    const res = await app.request('/api/runs/00000000-0000-0000-0000-000000000001/video-url');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/runs/:id/video returns 401 without auth', async () => {
    const res = await app.request(
      '/api/runs/00000000-0000-0000-0000-000000000001/video',
      { method: 'DELETE' },
    );
    expect(res.status).toBe(401);
  });
});
