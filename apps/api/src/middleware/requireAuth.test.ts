import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireAuth } from './requireAuth';

describe('requireAuth middleware', () => {
  it('returns 401 when no session cookie', async () => {
    const testApp = new Hono();
    testApp.use('/protected', requireAuth);
    testApp.get('/protected', (c) => c.json({ ok: true }));

    const res = await testApp.request('/protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});
