import { db } from '../db';
import { api } from './apiClient';

const MIGRATION_KEY = 'barrier_lab_migrated_v1';

export async function migrateLocalRunsIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const localRuns = await db.runs.toArray();
  if (localRuns.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  const results = await Promise.allSettled(
    localRuns.map(run => api.post('/api/runs', run)),
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`Local migration: ${failed}/${localRuns.length} runs failed. Will retry next login.`);
    return;
  }

  localStorage.setItem(MIGRATION_KEY, 'true');
}
