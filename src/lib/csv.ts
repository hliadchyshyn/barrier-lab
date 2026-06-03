import type { Run } from '../types';
import { computeStats } from './compute';

export function runsToCSV(runs: Run[]): string {
  const rows: string[] = ['Run,Date,Discipline,Segment,Duration (s)'];
  for (const run of runs) {
    const stats = computeStats(run);
    for (const split of stats.splits) {
      rows.push([run.name, run.date, run.discipline, split.label, split.duration.toFixed(3)].join(','));
    }
    if (stats.totalTime != null) {
      rows.push([run.name, run.date, run.discipline, 'TOTAL', stats.totalTime.toFixed(3)].join(','));
    }
  }
  return rows.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
