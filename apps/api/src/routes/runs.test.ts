import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('Runs API', () => {
  it('GET /api/runs returns 401 without auth', async () => {
    const res = await app.request('/api/runs');
    expect(res.status).toBe(401);
  });

  it('POST /api/runs returns 401 without auth', async () => {
    const res = await app.request('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/runs/:id returns 401 without auth', async () => {
    const res = await app.request('/api/runs/00000000-0000-0000-0000-000000000001', {
      method: 'DELETE',
    });
    expect(res.status).toBe(401);
  });
});
