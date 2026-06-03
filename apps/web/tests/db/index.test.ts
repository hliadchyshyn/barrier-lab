import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db';
import type { Run } from '../../src/types';

const sampleRun: Run = {
  id: 'test-1',
  name: 'Test Run',
  date: '2026-06-01',
  discipline: '110m-hurdles',
  hurdleCount: 10,
  events: [],
  notes: '',
  createdAt: Date.now(),
};

beforeEach(async () => {
  await db.runs.clear();
});

describe('db.runs', () => {
  it('saves and retrieves a run', async () => {
    await db.runs.put(sampleRun);
    const found = await db.runs.get('test-1');
    expect(found?.name).toBe('Test Run');
  });

  it('deletes a run', async () => {
    await db.runs.put(sampleRun);
    await db.runs.delete('test-1');
    const found = await db.runs.get('test-1');
    expect(found).toBeUndefined();
  });

  it('lists all runs', async () => {
    await db.runs.put(sampleRun);
    await db.runs.put({ ...sampleRun, id: 'test-2', name: 'Run 2' });
    const all = await db.runs.toArray();
    expect(all).toHaveLength(2);
  });
});
