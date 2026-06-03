import Dexie, { type Table } from 'dexie';
import type { Run } from '../types';

export class BarrierLabDB extends Dexie {
  runs!: Table<Run, string>;

  constructor() {
    super('barrier-lab-db');
    this.version(1).stores({
      runs: 'id, date, createdAt',
    });
    // version 2: videos table dropped — video files live in OPFS
    this.version(2).stores({
      runs: 'id, date, createdAt',
      videos: null,
    });
  }
}
