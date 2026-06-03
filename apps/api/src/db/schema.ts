import {
  pgTable, pgEnum, uuid, text, boolean,
  date, jsonb, timestamp, integer,
} from 'drizzle-orm/pg-core';
import type { HurdleEvent } from '@barrier-lab/types';

export const roleEnum = pgEnum('role', ['athlete', 'coach']);
export const membershipStatusEnum = pgEnum('membership_status', ['pending', 'active', 'revoked']);

// id is text to match better-auth user.id type
export const profiles = pgTable('profiles', {
  id:          text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  role:        roleEnum('role').default('athlete').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const seasons = pgTable('seasons', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  discipline: text('discipline').notNull(),
  startedAt:  date('started_at').notNull(),
  endedAt:    date('ended_at'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export const runs = pgTable('runs', {
  id:            uuid('id').primaryKey(),
  userId:        text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  seasonId:      uuid('season_id').references(() => seasons.id, { onDelete: 'set null' }),
  name:          text('name').notNull(),
  discipline:    text('discipline').notNull(),
  date:          date('date').notNull(),
  hurdleCount:   integer('hurdle_count').notNull(),
  events:        jsonb('events').notNull().$type<HurdleEvent[]>().default([]),
  notes:         text('notes').notNull().default(''),
  videoKey:      text('video_key'),
  videoUploaded: boolean('video_uploaded').notNull().default(false),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
});

export const teamMemberships = pgTable('team_memberships', {
  id:        uuid('id').primaryKey().defaultRandom(),
  coachId:   text('coach_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  athleteId: text('athlete_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status:    membershipStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runShares = pgTable('run_shares', {
  id:         uuid('id').primaryKey().defaultRandom(),
  runId:      uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  sharedWith: text('shared_with').references(() => profiles.id, { onDelete: 'cascade' }),
  token:      text('token'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export * from './auth-schema';
