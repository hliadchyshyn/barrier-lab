import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('Seasons API', () => {
  it('GET /api/seasons returns 401 without auth', async () => {
    const res = await app.request('/api/seasons');
    expect(res.status).toBe(401);
  });

  it('POST /api/seasons returns 401 without auth', async () => {
    const res = await app.request('/api/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', discipline: '110m-hurdles', startedAt: '2025-01-01' }),
    });
    expect(res.status).toBe(401);
  });
});
