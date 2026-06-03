# BarrierLab — PWA Implementation Plan (Phase 1, No AI)

> App name chosen by user. "Hurdle Hero" was already taken.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform PWA that lets hurdle athletes upload race video, manually annotate events (start, hurdles, finish), and get split-time statistics with run comparison.

**Architecture:** Single-page React PWA with local-first storage (video blobs + metadata in IndexedDB via Dexie). No backend. All computation is pure TypeScript in the browser. Routes: Dashboard → Annotate → Stats (per run) → Analytics (per run, deep metrics) → Trends (cross-run) → Compare.

**Tech Stack:** React 18 + TypeScript + Vite + Mantine v7 + Zustand + Dexie.js + Recharts + vite-plugin-pwa + Vitest + React Testing Library

---

## Review Notes / Improvements

- **Storage risk:** Storing full race videos in IndexedDB is the highest-risk part of this plan. It can work for small clips, but mobile browsers, iOS Safari, and low-storage devices often hit quota or eviction issues quickly. Safer Phase 1 framing: persist run metadata/events in Dexie, keep the uploaded `File` in memory for the current annotation session, and treat durable video persistence as optional or explicitly deferred.
- **PWA scope clarification:** "Offline-capable" is realistic for the app shell and previously loaded metadata views, but not guaranteed for re-opening uploaded local videos after a hard reload unless those files are actually persisted. The verification checklist should say that clearly so the implementation target stays honest.
- **Implementation bug traps:** A few snippets below are likely to cause trouble as written: calling `seekTo()` during render in `VideoPlayer`, never wiring video duration back to `AnnotatePage`, using `0.1s` as "frame-step", and leaving "Run Name Edit" in the task title without any implementation steps.
- **Data validation gap:** The compute layer should reject or normalize duplicate hurdle numbers, missing hurdles, and non-monotonic timestamps. Without that, stats can look valid while being wrong.
- **Execution hygiene:** Save this markdown as UTF-8 before further edits. The current file already shows garbled arrow/dash characters, which will make copied code and labels harder to trust.

### Decision Gates Before Implementation

- **Decide Phase 1 video persistence:** choose one of these explicitly before Task 5 or Task 9:
  1. Metadata-only persistence, uploaded video survives only for the active annotation session.
  2. Best-effort IndexedDB blob persistence for smaller files, with clear size/error fallbacks.
  3. Defer durable video persistence entirely to Phase 2 with OPFS.
- **Define annotation validity rules:** decide whether incomplete runs are allowed to save, whether duplicate hurdle marks overwrite or are rejected, and whether finish can be saved before all hurdles are marked in custom mode.
- **Define refresh behavior:** if the user reloads on `AnnotatePage`, decide whether the app should show "video missing, re-attach file" or attempt to restore from storage.
- **Define comparison/trend eligibility:** clarify whether partially annotated runs are hidden from Trends/Compare or shown with partial data and warnings.
- **Define success criteria for Phase 1:** the cleanest target is "manual annotation + trustworthy splits + local metadata persistence + installable app shell," not "robust offline video archive on every device."

---

## Competitor Context

| Tool | Platform | Hurdle-specific | Weaknesses |
|------|----------|-----------------|------------|
| Hurdle Analyzer | iOS only | Yes + AI | iOS only, expensive, 1–3 hurdles per clip |
| Track & Field AI | iOS only | Yes + AI | iOS only, freemium locked |
| Kinovea | Desktop only | No | Desktop, no automation, complex UI |
| TrackBoss | Web | No | Team-focused, no hurdle-specific stats |
| Onform | App + Web | No | Generic tool, manual |
| Dartfish | Desktop/App | No | Enterprise pricing |

**BarrierLab's gap:** First cross-platform web/PWA with hurdle-specific split automation, free, athlete-focused, works on any device from the field.

---

## Feature Scope (Phase 1)

**Core:**
- Upload video (any browser-supported format: mp4, mov, webm)
- Video player with frame-step, keyboard shortcuts, speed control
- Manual event marking: Start, H1–H10 (configurable count), Finish
- Timeline bar: click event → seek video
- **Stats page** (per run): split times, velocity bar chart, consistency metrics
- **Analytics page** (per run): advanced derived metrics — ratios, fatigue index, rhythm score, phase breakdown, comparisons within the run
- **Trends page** (cross-run): how each hurdle split and composite metrics evolve over sessions
- Run-to-run comparison: delta table + overlay chart
- Local persistence (IndexedDB)
- PWA: installable, offline-capable after first load

**Also included (suggested additions):**
- Discipline presets: 60m (5H), 100m/110m (10H), 400m (10H), custom
- Notes per run (conditions, fatigue, training context)
- Personal best tracking per hurdle segment

---

## File Structure

```
barrier-lab/
├── public/
│   ├── manifest.webmanifest
│   └── icons/                    # PWA icons (192, 512)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── types/
│   │   └── index.ts              # All shared types (Run, HurdleEvent, RunStats, etc.)
│   ├── db/
│   │   ├── schema.ts             # Dexie table definitions
│   │   └── index.ts              # DB instance + typed CRUD helpers
│   ├── lib/
│   │   ├── compute.ts            # Pure functions: computeStats, computeDelta, formatTime
│   │   └── csv.ts                # Export to CSV string
│   ├── store/
│   │   └── runs.ts               # Zustand store (in-memory cache on top of DB)
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx # List of runs + upload CTA
│   │   │   └── RunCard.tsx       # Single run card with name, date, total time
│   │   ├── annotate/
│   │   │   ├── AnnotatePage.tsx  # Layout: VideoPlayer + AnnotationControls
│   │   │   ├── VideoPlayer.tsx   # HTML5 <video> + custom transport controls
│   │   │   ├── useVideoPlayer.ts # Hook: currentTime, play/pause, seek, step
│   │   │   ├── AnnotationControls.tsx # Start/H1-Hn/Finish buttons + discipline selector
│   │   │   └── EventTimeline.tsx # Horizontal bar with event markers, click to seek
│   │   ├── stats/
│   │   │   ├── StatsPage.tsx         # Split times + velocity chart + consistency summary
│   │   │   ├── SplitTable.tsx        # Table of splits with PB highlight
│   │   │   ├── VelocityChart.tsx     # Bar chart of split durations
│   │   │   └── ConsistencyCard.tsx   # STD, best/worst hurdle, total time
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx     # Deep metrics for one run
│   │   │   ├── PhaseBreakdown.tsx    # Start phase / race phase / finish phase as % of total
│   │   │   ├── FatigueChart.tsx      # First-half vs second-half avg, fatigue index
│   │   │   ├── RhythmGauge.tsx       # Rhythm score (100 - CV*100), gauge-style display
│   │   │   ├── HurdleHeatmap.tsx     # Color-coded hurdle grid (fast=green, slow=red)
│   │   │   └── SegmentRatioChart.tsx # Each split as % of total time (horizontal bar)
│   │   ├── trends/
│   │   │   ├── TrendsPage.tsx        # Cross-run evolution for selected discipline
│   │   │   ├── TotalTimeTrend.tsx    # Line chart: total time over sessions
│   │   │   ├── HurdleSplitTrend.tsx  # Multi-line: per-hurdle split over sessions
│   │   │   ├── ConsistencyTrend.tsx  # Line chart: STD over sessions
│   │   │   └── FatigueTrend.tsx      # Line chart: fatigue index over sessions
│   │   └── compare/
│   │       ├── ComparePage.tsx   # Run selector + layout
│   │       ├── DeltaTable.tsx    # Split delta between two runs
│   │       └── OverlayChart.tsx  # Both runs on same Recharts chart
│   └── components/
│       ├── Layout.tsx            # AppShell with nav
│       └── DisciplineSelect.tsx  # Reusable preset picker
├── tests/
│   ├── lib/
│   │   ├── compute.test.ts
│   │   └── analytics.test.ts
│   ├── db/
│   │   └── index.test.ts
│   └── components/
│       ├── EventTimeline.test.tsx
│       └── SplitTable.test.tsx
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project Setup

**Files:**
- Create: `C:\Users\i.hliadchyshyn\Documents\Projects\barrier-lab\` (new project root)
- Create: `vite.config.ts`, `vitest.config.ts`, `package.json`

- [ ] **Step 1: Scaffold project**

```bash
cd C:\Users\i.hliadchyshyn\Documents\Projects
npm create vite@latest barrier-lab -- --template react-ts
cd barrier-lab
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @mantine/core @mantine/hooks @mantine/charts @mantine/notifications @emotion/react @emotion/server
npm install zustand dexie recharts react-router-dom
npm install -D vite-plugin-pwa @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
```

> Reviewer note: adding `fake-indexeddb` here keeps test setup centralized instead of introducing a surprise dependency later in Task 5.

- [ ] **Step 3: Configure vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BarrierLab',
        short_name: 'BarrierLab',
        theme_color: '#1971c2',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
    }),
  ],
});
```

- [ ] **Step 4: Configure vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
  },
});
```

- [ ] **Step 5: Create tests/setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Verify setup works**

```bash
npm run dev
```
Expected: Vite dev server starts on localhost:5173

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: project scaffold with vite, mantine, pwa, vitest"
```

> Reviewer note: dropping `git init` avoids accidentally nesting a repo inside an existing checkout.

---

## Task 2: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/index.ts

export type Discipline = '60m-hurdles' | '100m-hurdles' | '110m-hurdles' | '400m-hurdles' | 'custom';

export const DISCIPLINE_PRESETS: Record<Discipline, { label: string; hurdleCount: number }> = {
  '60m-hurdles':  { label: '60m Hurdles',  hurdleCount: 5  },
  '100m-hurdles': { label: '100m Hurdles', hurdleCount: 10 },
  '110m-hurdles': { label: '110m Hurdles', hurdleCount: 10 },
  '400m-hurdles': { label: '400m Hurdles', hurdleCount: 10 },
  'custom':       { label: 'Custom',        hurdleCount: 10 },
};

export type EventType = 'start' | 'hurdle' | 'finish';

export interface HurdleEvent {
  type: EventType;
  hurdleIndex?: number; // 1-based, only for type === 'hurdle'
  videoTime: number;    // seconds from video start
}

export interface Run {
  id: string;
  name: string;
  date: string;           // ISO date string
  discipline: Discipline;
  hurdleCount: number;
  events: HurdleEvent[];
  notes: string;
  createdAt: number;      // timestamp
}

export interface SplitStat {
  label: string;          // 'Start→H1', 'H1→H2', 'H10→Finish'
  duration: number;       // seconds
  isInterHurdle: boolean; // true for H→H splits only
}

export interface RunStats {
  totalTime: number | null;
  splits: SplitStat[];
  interHurdleSplits: number[];     // seconds, only H→H
  consistency: number | null;      // STD of interHurdleSplits
  bestHurdleIndex: number | null;  // 1-based
  worstHurdleIndex: number | null; // 1-based
}

export interface SplitDelta {
  label: string;
  durationA: number | null;
  durationB: number | null;
  delta: number | null; // B - A, negative = B faster
}
```

- [ ] **Step 2: No test needed** (types are compile-time only)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add core types"
```

---

## Task 3: Stats Computation Engine

**Files:**
- Create: `src/lib/compute.ts`
- Create: `tests/lib/compute.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/compute.test.ts
import { describe, it, expect } from 'vitest';
import { computeStats, computeDelta, formatTime, stdDev } from '../../src/lib/compute';
import type { HurdleEvent, Run } from '../../src/types';

const events: HurdleEvent[] = [
  { type: 'start',  videoTime: 0.00 },
  { type: 'hurdle', hurdleIndex: 1, videoTime: 2.75 },
  { type: 'hurdle', hurdleIndex: 2, videoTime: 4.10 },
  { type: 'hurdle', hurdleIndex: 3, videoTime: 5.42 },
  { type: 'finish', videoTime: 13.75 },
];

const makeRun = (evts: HurdleEvent[]): Run => ({
  id: '1', name: 'Test', date: '2026-06-01',
  discipline: '110m-hurdles', hurdleCount: 3,
  events: evts, notes: '', createdAt: 0,
});

describe('computeStats', () => {
  it('calculates total time', () => {
    const stats = computeStats(makeRun(events));
    expect(stats.totalTime).toBeCloseTo(13.75);
  });

  it('calculates splits correctly', () => {
    const stats = computeStats(makeRun(events));
    expect(stats.splits[0].label).toBe('Start→H1');
    expect(stats.splits[0].duration).toBeCloseTo(2.75);
    expect(stats.splits[1].label).toBe('H1→H2');
    expect(stats.splits[1].duration).toBeCloseTo(1.35);
    expect(stats.splits[3].label).toBe('H3→Finish');
    expect(stats.splits[3].duration).toBeCloseTo(8.33);
  });

  it('identifies inter-hurdle splits', () => {
    const stats = computeStats(makeRun(events));
    const inter = stats.splits.filter(s => s.isInterHurdle);
    expect(inter).toHaveLength(2); // H1→H2, H2→H3
  });

  it('returns null stats when events are incomplete', () => {
    const stats = computeStats(makeRun([{ type: 'start', videoTime: 0 }]));
    expect(stats.totalTime).toBeNull();
  });

  it('finds best and worst hurdle by inter-hurdle split', () => {
    const stats = computeStats(makeRun(events));
    // H1→H2 = 1.35, H2→H3 = 1.32 → best is H2→H3 (index 2), worst is H1→H2 (index 1)
    expect(stats.bestHurdleIndex).toBe(2);
    expect(stats.worstHurdleIndex).toBe(1);
  });
});

describe('computeDelta', () => {
  it('computes delta between two stat sets', () => {
    const a = computeStats(makeRun(events));
    const b = computeStats(makeRun([
      { type: 'start', videoTime: 0 },
      { type: 'hurdle', hurdleIndex: 1, videoTime: 2.80 },
      { type: 'hurdle', hurdleIndex: 2, videoTime: 4.05 },
      { type: 'hurdle', hurdleIndex: 3, videoTime: 5.30 },
      { type: 'finish', videoTime: 13.60 },
    ]));
    const delta = computeDelta(a, b);
    expect(delta[0].delta).toBeCloseTo(0.05);  // B Start→H1 is 0.05s slower
    expect(delta[1].delta).toBeCloseTo(-0.10); // B H1→H2 is 0.10s faster
  });
});

describe('formatTime', () => {
  it('formats sub-minute times as SS.mm', () => {
    expect(formatTime(13.75)).toBe('13.75');
  });
  it('formats over-minute times as M:SS.mm', () => {
    expect(formatTime(63.45)).toBe('1:03.45');
  });
});

describe('stdDev', () => {
  it('calculates standard deviation', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0);
  });
  it('returns 0 for single value', () => {
    expect(stdDev([5])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run tests/lib/compute.test.ts
```
Expected: FAIL — `computeStats is not defined`

- [ ] **Step 3: Implement compute.ts**

```typescript
// src/lib/compute.ts
import type { Run, HurdleEvent, RunStats, SplitStat, SplitDelta } from '../types';

export function formatTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2);
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function sortedEvents(run: Run): HurdleEvent[] {
  return [...run.events].sort((a, b) => a.videoTime - b.videoTime);
}

export function computeStats(run: Run): RunStats {
  const sorted = sortedEvents(run);
  const start  = sorted.find(e => e.type === 'start');
  const finish = sorted.find(e => e.type === 'finish');
  const hurdles = sorted
    .filter(e => e.type === 'hurdle')
    .sort((a, b) => (a.hurdleIndex ?? 0) - (b.hurdleIndex ?? 0));

  if (!start) {
    return { totalTime: null, splits: [], interHurdleSplits: [], consistency: null, bestHurdleIndex: null, worstHurdleIndex: null };
  }

  // Reviewer note: add validation before computing splits.
  // Recommended checks:
  // - no duplicate hurdleIndex values
  // - hurdleIndex values stay within 1..run.hurdleCount
  // - timestamps are non-decreasing in race order
  // - finish, if present, happens after the last hurdle

  const ordered: HurdleEvent[] = [start, ...hurdles, ...(finish ? [finish] : [])];
  const splits: SplitStat[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i];
    const to   = ordered[i + 1];
    const fromLabel = from.type === 'start' ? 'Start' : `H${from.hurdleIndex}`;
    const toLabel   = to.type === 'finish'  ? 'Finish' : `H${to.hurdleIndex}`;
    splits.push({
      label: `${fromLabel}→${toLabel}`,
      duration: to.videoTime - from.videoTime,
      isInterHurdle: from.type === 'hurdle' && to.type === 'hurdle',
    });
  }

  const interHurdleSplits = splits.filter(s => s.isInterHurdle).map(s => s.duration);
  const consistency = interHurdleSplits.length >= 2 ? stdDev(interHurdleSplits) : null;

  let bestHurdleIndex: number | null = null;
  let worstHurdleIndex: number | null = null;

  if (interHurdleSplits.length > 0) {
    const interSplits = splits.filter(s => s.isInterHurdle);
    const fastest = Math.min(...interHurdleSplits);
    const slowest = Math.max(...interHurdleSplits);
    const fastIdx = interSplits.findIndex(s => s.duration === fastest);
    const slowIdx = interSplits.findIndex(s => s.duration === slowest);
    // hurdleIndex of the target hurdle (the "to" hurdle in the split)
    bestHurdleIndex  = hurdles[fastIdx + 1]?.hurdleIndex ?? null;
    worstHurdleIndex = hurdles[slowIdx + 1]?.hurdleIndex ?? null;
  }

  return {
    totalTime: finish ? finish.videoTime - start.videoTime : null,
    splits,
    interHurdleSplits,
    consistency,
    bestHurdleIndex,
    worstHurdleIndex,
  };
}

export function computeDelta(a: RunStats, b: RunStats): SplitDelta[] {
  const labels = new Set([...a.splits.map(s => s.label), ...b.splits.map(s => s.label)]);
  return [...labels].map(label => {
    const sa = a.splits.find(s => s.label === label);
    const sb = b.splits.find(s => s.label === label);
    return {
      label,
      durationA: sa?.duration ?? null,
      durationB: sb?.duration ?? null,
      delta: sa && sb ? sb.duration - sa.duration : null,
    };
  });
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run tests/lib/compute.test.ts
```
Expected: all green, 0 failures

- [ ] **Step 5: Commit**

```bash
git add src/lib/compute.ts tests/lib/compute.test.ts && git commit -m "feat: stats computation engine with tests"
```

---

## Task 4: Analytics Computation Engine

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `tests/lib/analytics.test.ts`

These are pure functions that take a `RunStats` (or array of `RunStats`) and return derived metrics for the Analytics and Trends pages.

**Metrics to compute:**

| Metric | Formula | Meaning |
|--------|---------|---------|
| `phaseRatios` | start→H1 / total, H1→Hn / total, Hn→finish / total | How much of the race is acceleration, race, and finish phase |
| `fatigueIndex` | avg(last 3 inter-hurdle splits) / avg(first 3 inter-hurdle splits) | >1 = fading; <1 = finishing strong |
| `rhythmScore` | 100 − (STD / mean × 100), clamped 0–100 | 100 = perfectly even rhythm |
| `halfSplitAvg` | avg(first half H splits), avg(second half H splits) | Where speed is gained or lost |
| `segmentRatios` | each split / total | Each segment's share of total time |
| `velocityFadeSlope` | linear regression slope of inter-hurdle splits | Positive = slowing down |
| `peakSegment` | segment with smallest inter-hurdle split | Where top speed occurs |

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/analytics.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeAnalytics,
  computePhaseRatios,
  computeFatigueIndex,
  computeRhythmScore,
  computeVelocityFadeSlope,
  computeTrends,
} from '../../src/lib/analytics';
import { computeStats } from '../../src/lib/compute';
import type { Run } from '../../src/types';

function makeRun(times: number[], id = '1'): Run {
  const events = [
    { type: 'start' as const, videoTime: 0 },
    ...times.map((t, i) => ({ type: 'hurdle' as const, hurdleIndex: i + 1, videoTime: t })),
    { type: 'finish' as const, videoTime: times[times.length - 1] + 2.5 },
  ];
  return { id, name: `Run ${id}`, date: '2026-06-01', discipline: '110m-hurdles' as const,
           hurdleCount: times.length, events, notes: '', createdAt: 0 };
}

// Even rhythm: each hurdle at exactly 1.30s apart
const evenRun  = makeRun([2.75, 4.05, 5.35, 6.65, 7.95, 9.25, 10.55, 11.85, 13.15, 14.45]);
// Fading run:  last hurdles slower
const fadeRun  = makeRun([2.75, 4.05, 5.38, 6.74, 8.15, 9.62, 11.15, 12.74, 14.39, 16.10]);

describe('computePhaseRatios', () => {
  it('returns ratios that sum to 1', () => {
    const stats = computeStats(evenRun);
    const ratios = computePhaseRatios(stats);
    expect(ratios.start + ratios.race + ratios.finish).toBeCloseTo(1, 5);
  });
  it('returns null when total time is null', () => {
    const emptyStats = computeStats({ ...evenRun, events: [] });
    expect(computePhaseRatios(emptyStats)).toBeNull();
  });
});

describe('computeFatigueIndex', () => {
  it('returns ~1.0 for even run', () => {
    const stats = computeStats(evenRun);
    const idx = computeFatigueIndex(stats);
    expect(idx).not.toBeNull();
    expect(Math.abs(idx! - 1.0)).toBeLessThan(0.01);
  });
  it('returns >1 for fading run', () => {
    const stats = computeStats(fadeRun);
    const idx = computeFatigueIndex(stats);
    expect(idx).not.toBeNull();
    expect(idx!).toBeGreaterThan(1.05);
  });
  it('returns null when fewer than 6 inter-hurdle splits', () => {
    const shortRun = makeRun([2.75, 4.05, 5.35]);
    const stats = computeStats(shortRun);
    expect(computeFatigueIndex(stats)).toBeNull();
  });
});

describe('computeRhythmScore', () => {
  it('returns near 100 for even run', () => {
    const stats = computeStats(evenRun);
    expect(computeRhythmScore(stats)!).toBeGreaterThan(95);
  });
  it('returns lower score for uneven run', () => {
    const stats = computeStats(fadeRun);
    expect(computeRhythmScore(stats)!).toBeLessThan(computeRhythmScore(computeStats(evenRun))!);
  });
});

describe('computeVelocityFadeSlope', () => {
  it('returns ~0 for even run', () => {
    const stats = computeStats(evenRun);
    expect(Math.abs(computeVelocityFadeSlope(stats)!)).toBeLessThan(0.01);
  });
  it('returns positive value (slowing) for fade run', () => {
    const stats = computeStats(fadeRun);
    expect(computeVelocityFadeSlope(stats)!).toBeGreaterThan(0.01);
  });
});

describe('computeTrends', () => {
  it('returns one data point per run, sorted by date', () => {
    const runsData = [
      { run: makeRun([2.80, 4.12, 5.45, 6.78, 8.11, 9.44, 10.77, 12.10, 13.43, 14.76], 'a'), date: '2026-05-01' },
      { run: makeRun([2.75, 4.05, 5.35, 6.65, 7.95, 9.25, 10.55, 11.85, 13.15, 14.45], 'b'), date: '2026-05-15' },
    ].map(({ run, date }) => ({ ...run, date }));
    const trends = computeTrends(runsData);
    expect(trends).toHaveLength(2);
    expect(trends[0].date).toBe('2026-05-01');
    expect(trends[0].totalTime).toBeDefined();
    expect(trends[0].fatigueIndex).toBeDefined();
    expect(trends[0].rhythmScore).toBeDefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/lib/analytics.test.ts
```

- [ ] **Step 3: Implement analytics.ts**

```typescript
// src/lib/analytics.ts
import type { RunStats, Run } from '../types';
import { computeStats } from './compute';

export interface PhaseRatios {
  start: number;  // Start→H1 / total
  race: number;   // H1→Hn / total
  finish: number; // Hn→Finish / total
}

export interface RunAnalytics {
  phaseRatios: PhaseRatios | null;
  fatigueIndex: number | null;   // >1 = fading, <1 = finishing strong
  rhythmScore: number | null;    // 0–100, higher = more consistent
  velocityFadeSlope: number | null; // positive = slowing across race
  halfSplitAvg: { first: number; second: number } | null;
  peakSegmentLabel: string | null;
  segmentRatios: { label: string; ratio: number }[];
}

export interface TrendPoint {
  date: string;
  runName: string;
  totalTime: number | null;
  fatigueIndex: number | null;
  rhythmScore: number | null;
  consistency: number | null;
  hurdleSplits: Record<string, number>; // 'H1→H2': 1.32
}

function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const num   = xs.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
  const den   = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

export function computePhaseRatios(stats: RunStats): PhaseRatios | null {
  if (!stats.totalTime || stats.splits.length < 2) return null;
  const startSplit  = stats.splits[0];
  const finishSplit = stats.splits[stats.splits.length - 1];
  const raceSplits  = stats.splits.slice(1, -1);
  const raceTime    = raceSplits.reduce((sum, s) => sum + s.duration, 0);
  const total = stats.totalTime;
  return {
    start:  startSplit.duration / total,
    race:   raceTime / total,
    finish: finishSplit.duration / total,
  };
}

export function computeFatigueIndex(stats: RunStats): number | null {
  const splits = stats.interHurdleSplits;
  if (splits.length < 6) return null;
  const half     = Math.floor(splits.length / 2);
  const firstAvg = splits.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const lastAvg  = splits.slice(-half).reduce((a, b) => a + b, 0) / half;
  return firstAvg === 0 ? null : lastAvg / firstAvg;
}

export function computeRhythmScore(stats: RunStats): number | null {
  const splits = stats.interHurdleSplits;
  if (splits.length < 2 || stats.consistency === null) return null;
  const mean = splits.reduce((a, b) => a + b, 0) / splits.length;
  if (mean === 0) return null;
  const cv = stats.consistency / mean; // coefficient of variation
  return Math.max(0, Math.min(100, 100 - cv * 100));
}

export function computeVelocityFadeSlope(stats: RunStats): number | null {
  if (stats.interHurdleSplits.length < 3) return null;
  return linearRegressionSlope(stats.interHurdleSplits);
}

export function computeAnalytics(stats: RunStats): RunAnalytics {
  const splits = stats.interHurdleSplits;
  const half   = Math.floor(splits.length / 2);

  return {
    phaseRatios:       computePhaseRatios(stats),
    fatigueIndex:      computeFatigueIndex(stats),
    rhythmScore:       computeRhythmScore(stats),
    velocityFadeSlope: computeVelocityFadeSlope(stats),
    halfSplitAvg: splits.length >= 4
      ? {
          first:  splits.slice(0, half).reduce((a, b) => a + b, 0) / half,
          second: splits.slice(-half).reduce((a, b) => a + b, 0) / half,
        }
      : null,
    peakSegmentLabel: stats.splits.length > 0
      ? stats.splits.filter(s => s.isInterHurdle)
          .reduce((best, s) => s.duration < best.duration ? s : best,
                  stats.splits.filter(s => s.isInterHurdle)[0])?.label ?? null
      : null,
    segmentRatios: stats.totalTime
      ? stats.splits.map(s => ({ label: s.label, ratio: s.duration / stats.totalTime! }))
      : [],
  };
}

export function computeTrends(runs: Run[]): TrendPoint[] {
  return [...runs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(run => {
      const stats = computeStats(run);
      const hurdleSplits: Record<string, number> = {};
      stats.splits.filter(s => s.isInterHurdle).forEach(s => {
        hurdleSplits[s.label] = s.duration;
      });
      return {
        date:         run.date,
        runName:      run.name,
        totalTime:    stats.totalTime,
        fatigueIndex: computeFatigueIndex(stats),
        rhythmScore:  computeRhythmScore(stats),
        consistency:  stats.consistency,
        hurdleSplits,
      };
    });
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/lib/analytics.test.ts
```
Expected: all green

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts tests/lib/analytics.test.ts && git commit -m "feat: analytics engine — fatigue index, rhythm score, phase ratios, trends"
```

---

## Task 5: Database Layer (Dexie / IndexedDB)

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `tests/db/index.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/db/index.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/db/index.test.ts
```

- [ ] **Step 3: Install fake-indexeddb for tests**

```bash
npm install -D fake-indexeddb
```

Add to `tests/setup.ts`:
```typescript
import 'fake-indexeddb/auto';
```

- [ ] **Step 4: Implement schema.ts**

```typescript
// src/db/schema.ts
import Dexie, { type Table } from 'dexie';
import type { Run } from '../types';

export class HurdleHeroDB extends Dexie {
  runs!: Table<Run, string>;

  constructor() {
    super('barrier-lab-db');
    this.version(1).stores({
      runs: 'id, date, createdAt',
    });
  }
}
```

- [ ] **Step 5: Implement index.ts**

```typescript
// src/db/index.ts
export { HurdleHeroDB } from './schema';
import { HurdleHeroDB } from './schema';
export const db = new HurdleHeroDB();
```

- [ ] **Step 6: Run — expect PASS**

```bash
npx vitest run tests/db/index.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/db/ tests/db/ && git commit -m "feat: IndexedDB layer with Dexie"
```

---

## Task 6: Zustand Store

**Files:**
- Create: `src/store/runs.ts`

- [ ] **Step 1: Implement store**

```typescript
// src/store/runs.ts
import { create } from 'zustand';
import { db } from '../db';
import type { Run } from '../types';

interface RunsStore {
  runs: Run[];
  loaded: boolean;
  loadAll: () => Promise<void>;
  addRun: (run: Run) => Promise<void>;
  updateRun: (id: string, updates: Partial<Run>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  compareIds: [string | null, string | null];
  setCompareId: (slot: 0 | 1, id: string | null) => void;
}

export const useRunsStore = create<RunsStore>((set, get) => ({
  runs: [],
  loaded: false,
  compareIds: [null, null],

  loadAll: async () => {
    const runs = await db.runs.orderBy('createdAt').reverse().toArray();
    set({ runs, loaded: true });
  },

  addRun: async (run) => {
    await db.runs.put(run);
    set(s => ({ runs: [run, ...s.runs] }));
  },

  updateRun: async (id, updates) => {
    await db.runs.update(id, updates);
    set(s => ({
      runs: s.runs.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  },

  deleteRun: async (id) => {
    await db.runs.delete(id);
    set(s => ({ runs: s.runs.filter(r => r.id !== id) }));
  },

  setCompareId: (slot, id) => {
    set(s => {
      const ids: [string | null, string | null] = [...s.compareIds] as [string | null, string | null];
      ids[slot] = id;
      return { compareIds: ids };
    });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/runs.ts && git commit -m "feat: zustand store for runs"
```

---

## Task 7: App Shell + Routing

**Files:**
- Modify: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/router.tsx`
- Create: `src/components/Layout.tsx`

- [ ] **Step 1: Implement main.tsx**

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Implement router.tsx**

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AnnotatePage } from './features/annotate/AnnotatePage';
import { StatsPage } from './features/stats/StatsPage';
import { ComparePage } from './features/compare/ComparePage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/',                element: <DashboardPage /> },
      { path: '/annotate/:runId', element: <AnnotatePage /> },
      { path: '/stats/:runId',    element: <StatsPage /> },
      { path: '/compare',         element: <ComparePage /> },
    ],
  },
]);
```

- [ ] **Step 3: Implement Layout.tsx**

```tsx
// src/components/Layout.tsx
import { AppShell, NavLink, Group, Text } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconChartBar, IconArrowsLeftRight } from '@tabler/icons-react';

export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg" c="blue">⚡ BarrierLab</Text>
          <Group>
            <NavLink label="Runs"    leftSection={<IconHome size={16} />}
              active={pathname === '/'} onClick={() => navigate('/')} />
            <NavLink label="Compare" leftSection={<IconArrowsLeftRight size={16} />}
              active={pathname === '/compare'} onClick={() => navigate('/compare')} />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main><Outlet /></AppShell.Main>
    </AppShell>
  );
}
```

- [ ] **Step 4: Implement App.tsx**

```tsx
// src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 5: Verify in browser** — navigation tabs render, no console errors

- [ ] **Step 6: Commit**

```bash
git add src/ && git commit -m "feat: app shell with mantine and routing"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`
- Create: `src/features/dashboard/RunCard.tsx`
- Create: `src/components/DisciplineSelect.tsx`

- [ ] **Step 1: DisciplineSelect.tsx**

```tsx
// src/components/DisciplineSelect.tsx
import { Select } from '@mantine/core';
import { DISCIPLINE_PRESETS } from '../types';
import type { Discipline } from '../types';

interface Props {
  value: Discipline;
  onChange: (v: Discipline) => void;
}

export function DisciplineSelect({ value, onChange }: Props) {
  const data = Object.entries(DISCIPLINE_PRESETS).map(([k, v]) => ({
    value: k, label: v.label,
  }));
  return (
    <Select data={data} value={value} onChange={v => onChange(v as Discipline)} label="Discipline" />
  );
}
```

- [ ] **Step 2: RunCard.tsx**

```tsx
// src/features/dashboard/RunCard.tsx
import { Card, Text, Badge, Group, ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical, IconTrash, IconChartBar, IconVideo } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { computeStats, formatTime } from '../../lib/compute';
import type { Run } from '../../types';

interface Props {
  run: Run;
  onDelete: () => void;
}

export function RunCard({ run, onDelete }: Props) {
  const navigate = useNavigate();
  const stats = computeStats(run);
  const totalLabel = stats.totalTime ? formatTime(stats.totalTime) : '—';

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{run.name}</Text>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconVideo size={14} />}
              onClick={() => navigate(`/annotate/${run.id}`)}>Annotate</Menu.Item>
            <Menu.Item leftSection={<IconChartBar size={14} />}
              onClick={() => navigate(`/stats/${run.id}`)}>Stats</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />}
              onClick={onDelete}>Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Group gap="xs">
        <Badge variant="light">{run.discipline}</Badge>
        <Text size="sm" c="dimmed">{run.date}</Text>
        <Text size="sm" fw={500} ml="auto">{totalLabel}</Text>
      </Group>
    </Card>
  );
}
```

- [ ] **Step 3: DashboardPage.tsx**

```tsx
// src/features/dashboard/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Button, Stack, Title, Text, Modal, TextInput, Group, FileButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useRunsStore } from '../../store/runs';
import { RunCard } from './RunCard';
import { DisciplineSelect } from '../../components/DisciplineSelect';
import { DISCIPLINE_PRESETS } from '../../types';
import type { Discipline, Run } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function DashboardPage() {
  const { runs, loaded, loadAll, addRun, deleteRun } = useRunsStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('110m-hurdles');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => { if (!loaded) loadAll(); }, [loaded]);

  const handleCreate = async () => {
    if (!videoFile || !name.trim()) return;
    const id = uuidv4();
    const preset = DISCIPLINE_PRESETS[discipline];
    const run: Run = {
      id, name: name.trim(), date: new Date().toISOString().slice(0, 10),
      discipline, hurdleCount: preset.hurdleCount,
      events: [], notes: '', createdAt: Date.now(),
    };
    await addRun(run);
    // Store video as blob in separate Dexie table (see Task 9 for video storage)
    sessionStorage.setItem(`video-${id}`, 'pending');
    navigate(`/annotate/${id}`, { state: { videoFile } });
    setModalOpen(false);
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>My Runs</Title>
        <Button onClick={() => setModalOpen(true)}>+ New Run</Button>
      </Group>

      {runs.length === 0 && <Text c="dimmed">No runs yet. Upload a video to get started.</Text>}

      {runs.map(run => (
        <RunCard key={run.id} run={run}
          onDelete={() => deleteRun(run.id)} />
      ))}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Run">
        <Stack>
          <TextInput label="Run name" placeholder="Morning session, Heat 1..." value={name} onChange={e => setName(e.target.value)} />
          <DisciplineSelect value={discipline} onChange={setDiscipline} />
          <FileButton onChange={setVideoFile} accept="video/*">
            {props => <Button variant="outline" {...props}>
              {videoFile ? videoFile.name : 'Select video file'}
            </Button>}
          </FileButton>
          <Button disabled={!videoFile || !name.trim()} onClick={handleCreate}>Create</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
```

- [ ] **Step 4: Install uuid**

```bash
npm install uuid && npm install -D @types/uuid
```

- [ ] **Step 5: Test in browser** — create a run, see it in list, delete works

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/ src/components/DisciplineSelect.tsx && git commit -m "feat: dashboard with run list and create modal"
```

---

## Task 9: Video Player Hook + Component

**Files:**
- Create: `src/features/annotate/useVideoPlayer.ts`
- Create: `src/features/annotate/VideoPlayer.tsx`

- [ ] **Step 1: Implement useVideoPlayer.ts**

```typescript
// src/features/annotate/useVideoPlayer.ts
import { useRef, useState, useCallback, useEffect } from 'react';

const STEP = 1 / 30; // approximate fine-step; true frame-step is not reliably available from HTML5 video

export function useVideoPlayer(videoSrc: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDuration   = () => setDuration(video.duration);
    const onPlay       = () => setPlaying(true);
    const onPause      = () => setPlaying(false);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, v.duration));
  }, []);

  const stepBack    = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) - STEP), [seekTo]);
  const stepForward = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) + STEP), [seekTo]);

  const changeRate = useCallback((rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space')       { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowLeft')   { e.preventDefault(); stepBack(); }
      if (e.code === 'ArrowRight')  { e.preventDefault(); stepForward(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, stepBack, stepForward]);

  return { videoRef, currentTime, duration, playing, playbackRate, togglePlay, seekTo, stepBack, stepForward, changeRate };
}
```

- [ ] **Step 2: Implement VideoPlayer.tsx**

```tsx
// src/features/annotate/VideoPlayer.tsx
import { ActionIcon, Group, Text, Slider, SegmentedControl, Stack } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipBack, IconPlayerSkipForward } from '@tabler/icons-react';
import { useVideoPlayer } from './useVideoPlayer';
import { formatTime } from '../../lib/compute';

interface Props {
  src: string | null;
  onTimeChange?: (t: number) => void;
  seekToTime?: number | null;
}

export function VideoPlayer({ src, onTimeChange, seekToTime }: Props) {
  const { videoRef, currentTime, duration, playing, playbackRate,
          togglePlay, seekTo, stepBack, stepForward, changeRate } = useVideoPlayer(src);

  // Reviewer note: perform external seeks in an effect, not during render.
  // As written, calling seekTo() here creates a render side effect and can re-seek on every render.

  return (
    <Stack gap="xs">
      <video
        ref={videoRef}
        src={src ?? undefined}
        style={{ width: '100%', maxHeight: '50vh', background: '#000', borderRadius: 8 }}
        onTimeUpdate={() => onTimeChange?.(videoRef.current?.currentTime ?? 0)}
      />
      <Slider
        value={duration ? (currentTime / duration) * 100 : 0}
        onChange={v => seekTo((v / 100) * duration)}
        label={null}
        size="sm"
      />
      <Group justify="center" gap="xs">
        <ActionIcon onClick={stepBack}    variant="subtle"><IconPlayerSkipBack size={20} /></ActionIcon>
        <ActionIcon onClick={togglePlay}  variant="filled" size="lg">
          {playing ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
        </ActionIcon>
        <ActionIcon onClick={stepForward} variant="subtle"><IconPlayerSkipForward size={20} /></ActionIcon>
        <Text size="sm" c="dimmed">{formatTime(currentTime)} / {formatTime(duration)}</Text>
        <SegmentedControl
          size="xs"
          value={String(playbackRate)}
          onChange={v => changeRate(Number(v))}
          data={['0.25', '0.5', '1', '2'].map(v => ({ label: `${v}×`, value: v }))}
        />
      </Group>
    </Stack>
  );
}
```

- [ ] **Step 3: Verify in browser** — video plays, space bar toggles, arrows step, playback rate works

- [ ] **Step 4: Commit**

```bash
git add src/features/annotate/ && git commit -m "feat: video player with keyboard controls"
```

---

## Task 10: Annotation Controls + Timeline

**Files:**
- Create: `src/features/annotate/AnnotationControls.tsx`
- Create: `src/features/annotate/EventTimeline.tsx`
- Create: `src/features/annotate/AnnotatePage.tsx`
- Create: `tests/components/EventTimeline.test.tsx`

- [ ] **Step 1: Write failing test for EventTimeline**

```tsx
// tests/components/EventTimeline.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventTimeline } from '../../src/features/annotate/EventTimeline';
import type { HurdleEvent } from '../../src/types';

const events: HurdleEvent[] = [
  { type: 'start', videoTime: 0 },
  { type: 'hurdle', hurdleIndex: 1, videoTime: 2.75 },
  { type: 'finish', videoTime: 13.75 },
];

describe('EventTimeline', () => {
  it('renders event markers', () => {
    render(<EventTimeline events={events} duration={14} onSeek={vi.fn()} currentTime={0} />);
    expect(screen.getByTitle('Start')).toBeInTheDocument();
    expect(screen.getByTitle('H1')).toBeInTheDocument();
    expect(screen.getByTitle('Finish')).toBeInTheDocument();
  });

  it('calls onSeek when marker is clicked', () => {
    const onSeek = vi.fn();
    render(<EventTimeline events={events} duration={14} onSeek={onSeek} currentTime={0} />);
    fireEvent.click(screen.getByTitle('H1'));
    expect(onSeek).toHaveBeenCalledWith(2.75);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement EventTimeline.tsx**

```tsx
// src/features/annotate/EventTimeline.tsx
import { Box, Tooltip } from '@mantine/core';
import type { HurdleEvent } from '../../types';

interface Props {
  events: HurdleEvent[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

function eventLabel(e: HurdleEvent) {
  if (e.type === 'start')  return 'Start';
  if (e.type === 'finish') return 'Finish';
  return `H${e.hurdleIndex}`;
}

function eventColor(e: HurdleEvent) {
  if (e.type === 'start')  return 'green';
  if (e.type === 'finish') return 'red';
  return 'blue';
}

export function EventTimeline({ events, duration, currentTime, onSeek }: Props) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box pos="relative" h={32} bg="gray.1" style={{ borderRadius: 4, overflow: 'visible' }}>
      {/* Playhead */}
      <Box pos="absolute" top={0} bottom={0} w={2} bg="orange"
        style={{ left: `${pct}%`, zIndex: 1 }} />

      {events.map((evt, i) => {
        const left = duration > 0 ? (evt.videoTime / duration) * 100 : 0;
        return (
          <Tooltip key={i} label={eventLabel(evt)}>
            <Box
              pos="absolute" top="4px" w={16} h={24}
              bg={eventColor(evt)}
              title={eventLabel(evt)}
              style={{
                left: `calc(${left}% - 8px)`,
                borderRadius: 3,
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => onSeek(evt.videoTime)}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/components/EventTimeline.test.tsx
```

- [ ] **Step 5: Implement AnnotationControls.tsx**

```tsx
// src/features/annotate/AnnotationControls.tsx
import { Button, Group, Stack, Text, Badge, NumberInput } from '@mantine/core';
import type { HurdleEvent, Run } from '../../types';

interface Props {
  run: Run;
  events: HurdleEvent[];
  currentTime: number;
  onMark: (event: HurdleEvent) => void;
  onUndo: () => void;
}

export function AnnotationControls({ run, events, currentTime, onMark, onUndo }: Props) {
  const hasStart  = events.some(e => e.type === 'start');
  const hasFinish = events.some(e => e.type === 'finish');
  const markedHurdles = events.filter(e => e.type === 'hurdle').map(e => e.hurdleIndex!);
  const nextHurdle = Array.from({ length: run.hurdleCount }, (_, i) => i + 1)
    .find(i => !markedHurdles.includes(i));

  return (
    <Stack>
      <Group>
        <Button color="green" disabled={hasStart}
          onClick={() => onMark({ type: 'start', videoTime: currentTime })}>
          Mark Start
        </Button>

        <Button color="blue"
          disabled={!hasStart || hasFinish || nextHurdle === undefined}
          onClick={() => nextHurdle && onMark({ type: 'hurdle', hurdleIndex: nextHurdle, videoTime: currentTime })}>
          Mark H{nextHurdle ?? '—'}
        </Button>

        <Button color="red"
          disabled={!hasStart || hasFinish || markedHurdles.length < run.hurdleCount}
          onClick={() => onMark({ type: 'finish', videoTime: currentTime })}>
          Mark Finish
        </Button>

        <Button variant="subtle" onClick={onUndo} disabled={events.length === 0}>
          Undo
        </Button>
      </Group>

      <Group gap="xs">
        {['start', ...Array.from({ length: run.hurdleCount }, (_, i) => `h${i+1}`), 'finish']
          .map(key => {
            const done = key === 'start' ? hasStart
              : key === 'finish' ? hasFinish
              : markedHurdles.includes(Number(key.slice(1)));
            return <Badge key={key} color={done ? 'green' : 'gray'} variant="dot">
              {key === 'start' ? 'S' : key === 'finish' ? 'F' : key.toUpperCase()}
            </Badge>;
          })
        }
      </Group>
    </Stack>
  );
}
```

- [ ] **Step 6: Implement AnnotatePage.tsx**

```tsx
// src/features/annotate/AnnotatePage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Stack, Button, Group, Textarea, Title, Divider } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { VideoPlayer } from './VideoPlayer';
import { AnnotationControls } from './AnnotationControls';
import { EventTimeline } from './EventTimeline';
import type { HurdleEvent } from '../../types';

export function AnnotatePage() {
  const { runId } = useParams<{ runId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { runs, updateRun } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  const [events, setEvents]         = useState<HurdleEvent[]>(run?.events ?? []);
  const [videoSrc, setVideoSrc]     = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Accept video file passed via navigation state
  useEffect(() => {
    const file: File | undefined = location.state?.videoFile;
    if (file) setVideoSrc(URL.createObjectURL(file));
  }, []);

  // Reviewer note:
  // - revoke the object URL on cleanup to avoid leaks
  // - wire video duration back from VideoPlayer; right now EventTimeline always receives 0
  // - define refresh behavior, because navigation-state video files disappear on reload

  const handleMark = (evt: HurdleEvent) => setEvents(prev => [...prev, evt]);
  const handleUndo = () => setEvents(prev => prev.slice(0, -1));

  const handleSave = async () => {
    if (!run) return;
    await updateRun(run.id, { events });
    navigate(`/stats/${run.id}`);
  };

  if (!run) return <div>Run not found</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{run.name}</Title>
        <Button onClick={handleSave}>Save & View Stats</Button>
      </Group>

      <VideoPlayer
        src={videoSrc}
        onTimeChange={t => { setCurrentTime(t); }}
        seekToTime={seekTarget}
      />

      <EventTimeline
        events={events}
        duration={duration}
        currentTime={currentTime}
        onSeek={t => setSeekTarget(t)}
      />

      <Divider />

      <AnnotationControls
        run={run}
        events={events}
        currentTime={currentTime}
        onMark={handleMark}
        onUndo={handleUndo}
      />
    </Stack>
  );
}
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/features/annotate/ tests/components/ && git commit -m "feat: annotation interface with timeline and keyboard controls"
```

---

## Task 11: Statistics Page (Split Times + Charts)

**Files:**
- Create: `src/features/stats/SplitTable.tsx`
- Create: `src/features/stats/VelocityChart.tsx`
- Create: `src/features/stats/ConsistencyCard.tsx`
- Create: `src/features/stats/StatsPage.tsx`
- Create: `tests/components/SplitTable.test.tsx`

- [ ] **Step 1: Write SplitTable test**

```tsx
// tests/components/SplitTable.test.tsx
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SplitTable } from '../../src/features/stats/SplitTable';
import type { SplitStat } from '../../src/types';

const splits: SplitStat[] = [
  { label: 'Start→H1', duration: 2.75, isInterHurdle: false },
  { label: 'H1→H2',   duration: 1.35, isInterHurdle: true  },
];

describe('SplitTable', () => {
  it('renders split labels and times', () => {
    render(
      <MantineProvider><SplitTable splits={splits} bestHurdleIndex={null} worstHurdleIndex={null} /></MantineProvider>
    );
    expect(screen.getByText('Start→H1')).toBeInTheDocument();
    expect(screen.getByText('2.750')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement SplitTable.tsx**

```tsx
// src/features/stats/SplitTable.tsx
import { Table, Badge } from '@mantine/core';
import type { SplitStat } from '../../types';

interface Props {
  splits: SplitStat[];
  bestHurdleIndex: number | null;
  worstHurdleIndex: number | null;
}

export function SplitTable({ splits, bestHurdleIndex, worstHurdleIndex }: Props) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Segment</Table.Th>
          <Table.Th>Time (s)</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {splits.map(s => {
          const hNum = Number(s.label.match(/H(\d+)→/)?.[1]);
          const isBest  = s.isInterHurdle && hNum === bestHurdleIndex;
          const isWorst = s.isInterHurdle && hNum === worstHurdleIndex;
          return (
            <Table.Tr key={s.label}>
              <Table.Td>{s.label}</Table.Td>
              <Table.Td>{s.duration.toFixed(3)}</Table.Td>
              <Table.Td>
                {isBest  && <Badge color="green" size="xs">Best</Badge>}
                {isWorst && <Badge color="red"   size="xs">Worst</Badge>}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
```

- [ ] **Step 4: Implement VelocityChart.tsx**

```tsx
// src/features/stats/VelocityChart.tsx
import { BarChart } from '@mantine/charts';
import type { SplitStat } from '../../types';

interface Props { splits: SplitStat[] }

export function VelocityChart({ splits }: Props) {
  const data = splits.map(s => ({ segment: s.label, 'Split (s)': Number(s.duration.toFixed(3)) }));
  return (
    <BarChart
      h={220}
      data={data}
      dataKey="segment"
      series={[{ name: 'Split (s)', color: 'blue' }]}
      tickLine="x"
    />
  );
}
```

- [ ] **Step 5: Implement ConsistencyCard.tsx**

```tsx
// src/features/stats/ConsistencyCard.tsx
import { SimpleGrid, Paper, Text, Title } from '@mantine/core';
import { formatTime } from '../../lib/compute';
import type { RunStats } from '../../types';

interface Props { stats: RunStats }

export function ConsistencyCard({ stats }: Props) {
  return (
    <SimpleGrid cols={4}>
      {[
        { label: 'Total Time', value: stats.totalTime != null ? formatTime(stats.totalTime) : '—' },
        { label: 'Consistency (STD)', value: stats.consistency != null ? `${stats.consistency.toFixed(3)}s` : '—' },
        { label: 'Best Hurdle',  value: stats.bestHurdleIndex  != null ? `H${stats.bestHurdleIndex}`  : '—' },
        { label: 'Worst Hurdle', value: stats.worstHurdleIndex != null ? `H${stats.worstHurdleIndex}` : '—' },
      ].map(({ label, value }) => (
        <Paper key={label} withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">{label}</Text>
          <Title order={3}>{value}</Title>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
```

- [ ] **Step 6: Implement StatsPage.tsx**

```tsx
// src/features/stats/StatsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { computeStats } from '../../lib/compute';
import { downloadCSV, runsToCSV } from '../../lib/csv';
import { SplitTable } from './SplitTable';
import { VelocityChart } from './VelocityChart';
import { ConsistencyCard } from './ConsistencyCard';

export function StatsPage() {
  const { runId } = useParams<{ runId: string }>();
  const { runs } = useRunsStore();
  const navigate = useNavigate();
  const run = runs.find(r => r.id === runId);

  if (!run) return <div>Run not found</div>;

  const stats = computeStats(run);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{run.name}</Title>
        <Group>
          <Button variant="outline" onClick={() => navigate(`/annotate/${run.id}`)}>Re-annotate</Button>
          <Button variant="outline" onClick={() => {
            downloadCSV(runsToCSV([run]), `${run.name}-splits.csv`);
          }}>Export CSV</Button>
        </Group>
      </Group>

      <ConsistencyCard stats={stats} />
      <VelocityChart splits={stats.splits} />
      <SplitTable splits={stats.splits} bestHurdleIndex={stats.bestHurdleIndex} worstHurdleIndex={stats.worstHurdleIndex} />
    </Stack>
  );
}
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add src/features/stats/ tests/components/SplitTable.test.tsx && git commit -m "feat: statistics page with splits, chart, consistency metrics"
```

---

## Task 11b: Analytics Page (Deep Metrics per Run)

**Files:**
- Create: `src/features/analytics/AnalyticsPage.tsx`
- Create: `src/features/analytics/PhaseBreakdown.tsx`
- Create: `src/features/analytics/FatigueChart.tsx`
- Create: `src/features/analytics/RhythmGauge.tsx`
- Create: `src/features/analytics/HurdleHeatmap.tsx`
- Create: `src/features/analytics/SegmentRatioChart.tsx`

- [ ] **Step 1: Implement PhaseBreakdown.tsx**

Visualizes Start phase / Race phase / Finish phase as horizontal stacked bar (% of total time).

```tsx
// src/features/analytics/PhaseBreakdown.tsx
import { Box, Group, Text, Tooltip, Stack } from '@mantine/core';
import type { PhaseRatios } from '../../lib/analytics';

interface Props { ratios: PhaseRatios }

function PhaseBar({ label, ratio, color }: { label: string; ratio: number; color: string }) {
  return (
    <Tooltip label={`${label}: ${(ratio * 100).toFixed(1)}%`}>
      <Box h="100%" style={{ flex: ratio, background: color, minWidth: 30 }} />
    </Tooltip>
  );
}

export function PhaseBreakdown({ ratios }: Props) {
  return (
    <Stack gap="xs">
      <Text fw={600}>Phase Breakdown</Text>
      <Box h={36} style={{ display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
        <PhaseBar label="Start (acceleration)" ratio={ratios.start}  color="var(--mantine-color-green-5)" />
        <PhaseBar label="Race (hurdle-to-hurdle)" ratio={ratios.race}   color="var(--mantine-color-blue-5)" />
        <PhaseBar label="Finish"                  ratio={ratios.finish} color="var(--mantine-color-orange-5)" />
      </Box>
      <Group gap="md">
        {[['Start', ratios.start, 'green'], ['Race', ratios.race, 'blue'], ['Finish', ratios.finish, 'orange']]
          .map(([label, ratio, color]) => (
            <Group key={String(label)} gap={4}>
              <Box w={12} h={12} bg={`${color}.5`} style={{ borderRadius: 2 }} />
              <Text size="xs">{label}: {((ratio as number) * 100).toFixed(1)}%</Text>
            </Group>
          ))}
      </Group>
    </Stack>
  );
}
```

- [ ] **Step 2: Implement FatigueChart.tsx**

Shows first-half vs second-half average split side by side, plus fatigue index.

```tsx
// src/features/analytics/FatigueChart.tsx
import { BarChart } from '@mantine/charts';
import { Stack, Text, Badge, Group } from '@mantine/core';

interface Props {
  firstHalfAvg: number;
  secondHalfAvg: number;
  fatigueIndex: number;
}

export function FatigueChart({ firstHalfAvg, secondHalfAvg, fatigueIndex }: Props) {
  const data = [
    { half: 'First half', 'Avg split (s)': Number(firstHalfAvg.toFixed(3)) },
    { half: 'Second half', 'Avg split (s)': Number(secondHalfAvg.toFixed(3)) },
  ];
  const label = fatigueIndex > 1.03 ? 'Fading' : fatigueIndex < 0.97 ? 'Finishing strong' : 'Even';
  const color = fatigueIndex > 1.03 ? 'red' : fatigueIndex < 0.97 ? 'green' : 'blue';

  return (
    <Stack gap="xs">
      <Group>
        <Text fw={600}>Fatigue Analysis</Text>
        <Badge color={color}>{label} — index: {fatigueIndex.toFixed(3)}</Badge>
      </Group>
      <BarChart h={180} data={data} dataKey="half"
        series={[{ name: 'Avg split (s)', color: 'blue' }]} tickLine="x" />
    </Stack>
  );
}
```

- [ ] **Step 3: Implement RhythmGauge.tsx**

Displays rhythm score (0–100) as a large number with color coding and description.

```tsx
// src/features/analytics/RhythmGauge.tsx
import { Paper, Text, Title, Stack, RingProgress, Group } from '@mantine/core';

interface Props { score: number }

export function RhythmGauge({ score }: Props) {
  const color = score >= 90 ? 'green' : score >= 75 ? 'blue' : score >= 60 ? 'yellow' : 'red';
  const label = score >= 90 ? 'Elite consistency'
              : score >= 75 ? 'Good rhythm'
              : score >= 60 ? 'Moderate variation'
              : 'High variation — check technique';

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="center" gap="xl">
        <RingProgress
          size={120}
          thickness={12}
          sections={[{ value: score, color }]}
          label={<Text ta="center" fw={700} size="xl">{score.toFixed(0)}</Text>}
        />
        <Stack gap={4}>
          <Text fw={600}>Rhythm Score</Text>
          <Text size="sm" c="dimmed">{label}</Text>
          <Text size="xs" c="dimmed">100 = perfectly even hurdle-to-hurdle cadence</Text>
        </Stack>
      </Group>
    </Paper>
  );
}
```

- [ ] **Step 4: Implement HurdleHeatmap.tsx**

Color-coded grid where each hurdle's inter-split is shown from green (fastest) to red (slowest).

```tsx
// src/features/analytics/HurdleHeatmap.tsx
import { Box, Text, Tooltip, Group, Stack } from '@mantine/core';
import type { SplitStat } from '../../types';

interface Props { splits: SplitStat[] }

function interpolateColor(ratio: number): string {
  // 0 = green (fast), 1 = red (slow)
  const r = Math.round(ratio * 220);
  const g = Math.round((1 - ratio) * 200);
  return `rgb(${r},${g},60)`;
}

export function HurdleHeatmap({ splits }: Props) {
  const interSplits = splits.filter(s => s.isInterHurdle);
  if (interSplits.length === 0) return null;
  const min = Math.min(...interSplits.map(s => s.duration));
  const max = Math.max(...interSplits.map(s => s.duration));
  const range = max - min || 1;

  return (
    <Stack gap="xs">
      <Text fw={600}>Hurdle Speed Heatmap</Text>
      <Group gap={6}>
        {interSplits.map(s => {
          const ratio = (s.duration - min) / range;
          return (
            <Tooltip key={s.label} label={`${s.label}: ${s.duration.toFixed(3)}s`}>
              <Box
                w={44} h={44}
                style={{ background: interpolateColor(ratio), borderRadius: 6, cursor: 'default' }}
              >
                <Text ta="center" size="xs" c="white" fw={700} pt={4}>
                  {s.label.split('→')[0]}
                </Text>
                <Text ta="center" size="xs" c="white">
                  {s.duration.toFixed(2)}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </Group>
      <Group gap="xs">
        <Box w={12} h={12} style={{ background: 'rgb(0,200,60)', borderRadius: 2 }} />
        <Text size="xs">Fast</Text>
        <Box w={12} h={12} style={{ background: 'rgb(220,0,60)', borderRadius: 2 }} />
        <Text size="xs">Slow</Text>
      </Group>
    </Stack>
  );
}
```

- [ ] **Step 5: Implement SegmentRatioChart.tsx**

Each split as a % of total time — horizontal stacked/bar chart.

```tsx
// src/features/analytics/SegmentRatioChart.tsx
import { BarChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';

interface Props { ratios: { label: string; ratio: number }[] }

export function SegmentRatioChart({ ratios }: Props) {
  const data = ratios.map(r => ({
    segment: r.label,
    '% of total': Number((r.ratio * 100).toFixed(2)),
  }));

  return (
    <Stack gap="xs">
      <Text fw={600}>Segment Share of Total Time</Text>
      <BarChart h={220} data={data} dataKey="segment"
        series={[{ name: '% of total', color: 'violet' }]}
        tickLine="x" />
    </Stack>
  );
}
```

- [ ] **Step 6: Implement AnalyticsPage.tsx**

```tsx
// src/features/analytics/AnalyticsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button, Alert, Text } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { computeStats } from '../../lib/compute';
import { computeAnalytics } from '../../lib/analytics';
import { PhaseBreakdown } from './PhaseBreakdown';
import { FatigueChart } from './FatigueChart';
import { RhythmGauge } from './RhythmGauge';
import { HurdleHeatmap } from './HurdleHeatmap';
import { SegmentRatioChart } from './SegmentRatioChart';

export function AnalyticsPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { runs } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  if (!run) return <div>Run not found</div>;

  const stats    = computeStats(run);
  const analysis = computeAnalytics(stats);

  const canAnalyze = stats.totalTime !== null && stats.interHurdleSplits.length >= 2;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Analytics — {run.name}</Title>
        <Button variant="subtle" onClick={() => navigate(`/stats/${run.id}`)}>← Splits</Button>
      </Group>

      {!canAnalyze && (
        <Alert color="orange">Not enough data. Annotate all hurdles to unlock analytics.</Alert>
      )}

      {canAnalyze && (
        <>
          {analysis.phaseRatios && <PhaseBreakdown ratios={analysis.phaseRatios} />}

          {analysis.rhythmScore !== null && <RhythmGauge score={analysis.rhythmScore} />}

          {analysis.halfSplitAvg && analysis.fatigueIndex !== null && (
            <FatigueChart
              firstHalfAvg={analysis.halfSplitAvg.first}
              secondHalfAvg={analysis.halfSplitAvg.second}
              fatigueIndex={analysis.fatigueIndex}
            />
          )}

          <HurdleHeatmap splits={stats.splits} />

          {analysis.segmentRatios.length > 0 && (
            <SegmentRatioChart ratios={analysis.segmentRatios} />
          )}

          {analysis.velocityFadeSlope !== null && (
            <Text size="sm" c="dimmed">
              Velocity fade slope: {analysis.velocityFadeSlope > 0
                ? `+${analysis.velocityFadeSlope.toFixed(4)}s/hurdle (slowing)`
                : `${analysis.velocityFadeSlope.toFixed(4)}s/hurdle (accelerating)`}
            </Text>
          )}
        </>
      )}
    </Stack>
  );
}
```

- [ ] **Step 7: Update router.tsx to add analytics route**

```typescript
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
// add to children:
{ path: '/analytics/:runId', element: <AnalyticsPage /> },
```

- [ ] **Step 8: Add "Analytics" button in StatsPage**

```tsx
<Button variant="outline" onClick={() => navigate(`/analytics/${run.id}`)}>Deep Analytics</Button>
```

- [ ] **Step 9: Test in browser**
  - Open a run with all 10 hurdles marked
  - Stats page → click "Deep Analytics"
  - See phase bar, rhythm gauge, fatigue chart, heatmap, segment ratios

- [ ] **Step 10: Commit**

```bash
git add src/features/analytics/ src/router.tsx && git commit -m "feat: analytics page with phase breakdown, fatigue index, rhythm score, heatmap"
```

---

## Task 11c: Trends Page (Cross-Run Evolution)

**Files:**
- Create: `src/features/trends/TrendsPage.tsx`
- Create: `src/features/trends/TotalTimeTrend.tsx`
- Create: `src/features/trends/HurdleSplitTrend.tsx`
- Create: `src/features/trends/ConsistencyTrend.tsx`
- Create: `src/features/trends/FatigueTrend.tsx`

- [ ] **Step 1: Implement TotalTimeTrend.tsx**

```tsx
// src/features/trends/TotalTimeTrend.tsx
import { LineChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';
import { formatTime } from '../../lib/compute';

interface Props { points: TrendPoint[] }

export function TotalTimeTrend({ points }: Props) {
  const data = points
    .filter(p => p.totalTime !== null)
    .map(p => ({ date: p.date, 'Total time (s)': Number(p.totalTime!.toFixed(3)) }));

  if (data.length < 2) return <Text c="dimmed" size="sm">Need at least 2 runs to show trend.</Text>;

  const best = Math.min(...data.map(d => d['Total time (s)']));
  const latest = data[data.length - 1]['Total time (s)'];
  const delta = latest - best;

  return (
    <Stack gap="xs">
      <Text fw={600}>Total Time Trend</Text>
      <Text size="xs" c="dimmed">
        Best: {formatTime(best)} · Latest: {formatTime(latest)} · vs PB: {delta > 0 ? `+${delta.toFixed(3)}s` : `${delta.toFixed(3)}s`}
      </Text>
      <LineChart h={200} data={data} dataKey="date"
        series={[{ name: 'Total time (s)', color: 'blue' }]} curveType="monotone" />
    </Stack>
  );
}
```

- [ ] **Step 2: Implement HurdleSplitTrend.tsx**

Multi-line chart — one line per hurdle-to-hurdle split.

```tsx
// src/features/trends/HurdleSplitTrend.tsx
import { LineChart } from '@mantine/charts';
import { Stack, Text, MultiSelect } from '@mantine/core';
import { useState } from 'react';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

const COLORS = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'cyan', 'grape', 'lime'];

export function HurdleSplitTrend({ points }: Props) {
  const allLabels = Array.from(new Set(points.flatMap(p => Object.keys(p.hurdleSplits))));
  const [selected, setSelected] = useState<string[]>(allLabels.slice(0, 3));

  const data = points.map(p => {
    const row: Record<string, string | number> = { date: p.date };
    selected.forEach(label => { row[label] = p.hurdleSplits[label] ?? null; });
    return row;
  });

  const series = selected.map((label, i) => ({ name: label, color: COLORS[i % COLORS.length] }));

  return (
    <Stack gap="xs">
      <Text fw={600}>Per-Hurdle Split Trends</Text>
      <MultiSelect
        data={allLabels}
        value={selected}
        onChange={setSelected}
        label="Show splits"
        placeholder="Select splits to compare"
        maxValues={5}
      />
      {data.length >= 2
        ? <LineChart h={220} data={data} dataKey="date" series={series} curveType="monotone" />
        : <Text c="dimmed" size="sm">Need at least 2 runs.</Text>}
    </Stack>
  );
}
```

- [ ] **Step 3: Implement ConsistencyTrend.tsx**

```tsx
// src/features/trends/ConsistencyTrend.tsx
import { LineChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

export function ConsistencyTrend({ points }: Props) {
  const data = points
    .filter(p => p.consistency !== null)
    .map(p => ({ date: p.date, 'Consistency STD (s)': Number(p.consistency!.toFixed(4)) }));

  if (data.length < 2) return null;

  const trend = data[data.length - 1]['Consistency STD (s)'] < data[0]['Consistency STD (s)']
    ? '↓ Improving (lower = more consistent)' : '↑ Worsening';

  return (
    <Stack gap="xs">
      <Text fw={600}>Consistency Trend (STD of inter-hurdle splits)</Text>
      <Text size="xs" c="dimmed">{trend}</Text>
      <LineChart h={180} data={data} dataKey="date"
        series={[{ name: 'Consistency STD (s)', color: 'orange' }]} curveType="monotone" />
    </Stack>
  );
}
```

- [ ] **Step 4: Implement FatigueTrend.tsx**

```tsx
// src/features/trends/FatigueTrend.tsx
import { LineChart, ReferenceLine } from '@mantine/charts';
import { LineChart as RechartsLine } from 'recharts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

export function FatigueTrend({ points }: Props) {
  const data = points
    .filter(p => p.fatigueIndex !== null)
    .map(p => ({ date: p.date, 'Fatigue index': Number(p.fatigueIndex!.toFixed(3)) }));

  if (data.length < 2) return null;

  return (
    <Stack gap="xs">
      <Text fw={600}>Fatigue Index Trend</Text>
      <Text size="xs" c="dimmed">1.0 = even pace · {'>'} 1.0 = fading · {'<'} 1.0 = finishing strong</Text>
      <LineChart h={180} data={data} dataKey="date"
        series={[{ name: 'Fatigue index', color: 'red' }]}
        curveType="monotone"
        referenceLines={[{ y: 1, color: 'gray', label: 'Even' }]}
      />
    </Stack>
  );
}
```

- [ ] **Step 5: Implement TrendsPage.tsx**

```tsx
// src/features/trends/TrendsPage.tsx
import { Stack, Title, Select, Text } from '@mantine/core';
import { useState } from 'react';
import { useRunsStore } from '../../store/runs';
import { computeTrends } from '../../lib/analytics';
import { TotalTimeTrend } from './TotalTimeTrend';
import { HurdleSplitTrend } from './HurdleSplitTrend';
import { ConsistencyTrend } from './ConsistencyTrend';
import { FatigueTrend } from './FatigueTrend';
import { DISCIPLINE_PRESETS } from '../../types';
import type { Discipline } from '../../types';

export function TrendsPage() {
  const { runs } = useRunsStore();
  const [discipline, setDiscipline] = useState<Discipline>('110m-hurdles');
  const filtered = runs.filter(r => r.discipline === discipline);
  const points = computeTrends(filtered);

  return (
    <Stack>
      <Title order={2}>Season Trends</Title>
      <Select
        label="Discipline"
        value={discipline}
        onChange={v => setDiscipline(v as Discipline)}
        data={Object.entries(DISCIPLINE_PRESETS).map(([k, v]) => ({ value: k, label: v.label }))}
        style={{ maxWidth: 280 }}
      />
      {filtered.length < 2 && (
        <Text c="dimmed">Add at least 2 annotated runs for this discipline to see trends.</Text>
      )}
      {filtered.length >= 2 && (
        <>
          <TotalTimeTrend points={points} />
          <HurdleSplitTrend points={points} />
          <ConsistencyTrend points={points} />
          <FatigueTrend points={points} />
        </>
      )}
    </Stack>
  );
}
```

- [ ] **Step 6: Update router.tsx**

```typescript
import { TrendsPage } from './features/trends/TrendsPage';
// add:
{ path: '/trends', element: <TrendsPage /> },
```

- [ ] **Step 7: Add Trends to Layout nav**

```tsx
<NavLink label="Trends" leftSection={<IconTrendingUp size={16} />}
  active={pathname === '/trends'} onClick={() => navigate('/trends')} />
```

- [ ] **Step 8: Test in browser**
  - Create 3+ runs with full annotations
  - Navigate to Trends → select discipline
  - See total time line chart going down (improvement)
  - Select specific hurdle splits to track

- [ ] **Step 9: Commit**

```bash
git add src/features/trends/ src/router.tsx src/components/Layout.tsx && git commit -m "feat: trends page — total time, per-hurdle, consistency, fatigue index over sessions"
```

---

## Task 12: Comparison Page

**Files:**
- Create: `src/features/compare/DeltaTable.tsx`
- Create: `src/features/compare/OverlayChart.tsx`
- Create: `src/features/compare/ComparePage.tsx`

- [ ] **Step 1: Implement DeltaTable.tsx**

```tsx
// src/features/compare/DeltaTable.tsx
import { Table, Text } from '@mantine/core';
import type { SplitDelta } from '../../types';

interface Props { deltas: SplitDelta[] }

export function DeltaTable({ deltas }: Props) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Segment</Table.Th>
          <Table.Th>Run A</Table.Th>
          <Table.Th>Run B</Table.Th>
          <Table.Th>Delta</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {deltas.map(d => (
          <Table.Tr key={d.label}>
            <Table.Td>{d.label}</Table.Td>
            <Table.Td>{d.durationA?.toFixed(3) ?? '—'}</Table.Td>
            <Table.Td>{d.durationB?.toFixed(3) ?? '—'}</Table.Td>
            <Table.Td>
              {d.delta != null && (
                <Text c={d.delta < 0 ? 'green' : d.delta > 0 ? 'red' : 'dimmed'} fw={600}>
                  {d.delta > 0 ? '+' : ''}{d.delta.toFixed(3)}
                </Text>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
```

- [ ] **Step 2: Implement OverlayChart.tsx**

```tsx
// src/features/compare/OverlayChart.tsx
import { BarChart } from '@mantine/charts';
import type { SplitDelta } from '../../types';

interface Props { deltas: SplitDelta[]; nameA: string; nameB: string }

export function OverlayChart({ deltas, nameA, nameB }: Props) {
  const data = deltas.map(d => ({
    segment: d.label,
    [nameA]: d.durationA ?? 0,
    [nameB]: d.durationB ?? 0,
  }));

  return (
    <BarChart
      h={250}
      data={data}
      dataKey="segment"
      series={[
        { name: nameA, color: 'blue' },
        { name: nameB, color: 'orange' },
      ]}
      tickLine="x"
    />
  );
}
```

- [ ] **Step 3: Implement ComparePage.tsx**

```tsx
// src/features/compare/ComparePage.tsx
import { useState } from 'react';
import { Stack, Title, Select, Group, Text } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { computeStats, computeDelta } from '../../lib/compute';
import { DeltaTable } from './DeltaTable';
import { OverlayChart } from './OverlayChart';

export function ComparePage() {
  const { runs } = useRunsStore();
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);

  const runA = runs.find(r => r.id === idA);
  const runB = runs.find(r => r.id === idB);

  const options = runs.map(r => ({ value: r.id, label: r.name }));

  const statsA = runA ? computeStats(runA) : null;
  const statsB = runB ? computeStats(runB) : null;
  const deltas = statsA && statsB ? computeDelta(statsA, statsB) : [];

  return (
    <Stack>
      <Title order={2}>Compare Runs</Title>
      <Group>
        <Select label="Run A" placeholder="Select run" data={options}
          value={idA} onChange={setIdA} style={{ flex: 1 }} />
        <Select label="Run B" placeholder="Select run" data={options}
          value={idB} onChange={setIdB} style={{ flex: 1 }} />
      </Group>

      {runA && runB && deltas.length > 0 ? (
        <>
          <Text size="sm" c="dimmed">
            Green delta = Run B is faster. Red = Run B is slower.
          </Text>
          <OverlayChart deltas={deltas} nameA={runA.name} nameB={runB.name} />
          <DeltaTable deltas={deltas} />
        </>
      ) : (
        <Text c="dimmed">Select two runs to compare their splits.</Text>
      )}
    </Stack>
  );
}
```

- [ ] **Step 4: Test in browser** — select 2 runs, delta table shows colored values, chart renders both bars

- [ ] **Step 5: Commit**

```bash
git add src/features/compare/ && git commit -m "feat: run comparison with delta table and overlay chart"
```

---

## Task 13: Notes + Personal Best + Run Name Edit

**Files:**
- Modify: `src/features/stats/StatsPage.tsx`
- Modify: `src/features/dashboard/RunCard.tsx`

- [ ] **Step 1: Add notes textarea to StatsPage**

In `StatsPage.tsx`, add a debounced `Textarea` below `ConsistencyCard`. Import `useDebouncedCallback` from `@mantine/hooks` and `updateRun` from the store:

```tsx
const [notes, setNotes] = useState(run.notes);
const saveNotes = useDebouncedCallback((v: string) => updateRun(run.id, { notes: v }), 800);

// In JSX:
<Textarea
  label="Session notes"
  placeholder="Weather, fatigue level, training context, coach feedback..."
  value={notes}
  onChange={e => { setNotes(e.target.value); saveNotes(e.target.value); }}
  autosize minRows={2}
/>
```

- [ ] **Step 2: Personal best tracking**

Modify `SplitStat` type to include `isPB?: boolean`.

In `StatsPage.tsx`, after computing stats for the current run:

```tsx
const historicSplits = runs
  .filter(r => r.id !== run.id && r.discipline === run.discipline)
  .flatMap(r => computeStats(r).splits);

const statsWithPB = {
  ...stats,
  splits: stats.splits.map(s => ({
    ...s,
    isPB: !historicSplits.some(h => h.label === s.label && h.duration <= s.duration),
  })),
};
```

In `SplitTable.tsx`, show `<Badge color="yellow" size="xs">PB</Badge>` when `split.isPB === true`.

> Reviewer note: the task title promises run-name editing, but no step implements it. Either add a rename flow here or remove it from the title so the plan can actually be completed.

- [ ] **Step 3: Commit**

```bash
git add src/ && git commit -m "feat: session notes and per-split personal best tracking"
```

---

## Task 14: PWA Finalization

**Files:**
- Modify: `vite.config.ts` (already configured in Task 1)
- Create: `public/icons/192.png`, `public/icons/512.png`

- [ ] **Step 1: Add PWA icons**

Create simple placeholder icons (use any 192×192 and 512×512 PNG). For production, use a proper logo generator (e.g. https://favicon.io/).

```bash
# Quick approach: copy any PNG and resize
# Or use a tool like sharp in a one-off script
```

- [ ] **Step 2: Build and verify PWA**

```bash
npm run build && npm run preview
```

Open Chrome DevTools → Application → Manifest — verify it shows correctly.
Try installing via the browser's "Add to Home Screen" / install button.

- [ ] **Step 3: Verify offline** — load app, disconnect network, reload — app still works for previously visited runs.

> Reviewer note: narrow this acceptance criterion to the app shell plus previously loaded metadata/screens. Uploaded video playback after reload is not guaranteed unless video files are actually persisted locally.

- [ ] **Step 4: Final test run**

```bash
npx vitest run --coverage
```
Expected: coverage ≥ 80%, 0 failures

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat: pwa manifest and offline support - phase 1 complete"
```

---

## Verification Checklist

End-to-end test flow:

1. Open app → Dashboard shows empty state
2. Click "+ New Run" → select video file, enter name, choose discipline → Create
3. AnnotatePage opens with video → press Space to play, Arrow keys to step
4. Click "Mark Start" at video start time
5. Click "Mark H1" through "Mark H10" at each hurdle clearance
6. Click "Mark Finish" — Save & View Stats
7. StatsPage shows: total time, 12 split rows, velocity bar chart, consistency STD, best/worst hurdle badges
8. Click Export CSV → downloads file, open in Excel — data is correct
9. Go back, create second run, annotate it
10. Go to Compare → select both runs → overlay chart + delta table with green/red coloring
11. Open Chrome DevTools → Application → Manifest → install PWA
12. Open installed app, disconnect network → app loads, all functionality works (except video upload requires file system)
13. Run `npx vitest run --coverage` → ≥80% coverage

---

## Phase 2 Roadmap (future, no AI)

- **Athlete profiles** — multiple athletes per device (for coaches managing a squad)
- **Video storage via OPFS** — replace blob-in-IndexedDB with Origin Private File System for large (500MB+) video files
- **Side-by-side video playback** — two videos synced to their respective event timelines
- **PDF report** — printable race analysis with charts, shareable with coaches
- **CSV / JSON export** — raw data export for external tools (spreadsheets, R, Python analysis)
- **Goal setting** — set target times per hurdle, show progress toward goals

## Phase 3 Roadmap (AI)

- Auto hurdle detection (YOLO / RT-DETR)
- Pose estimation (MediaPipe BlazePose) — lead leg angle, trail leg mechanics
- AI coach feedback ("H6-H8 show 5% velocity drop — check stride rhythm")
