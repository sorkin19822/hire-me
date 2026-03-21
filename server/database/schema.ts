import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── pipeline_stages ────────────────────────────────────────────────────────

export const pipelineStages = sqliteTable('pipeline_stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  color: text('color').notNull().default('#6366f1'),
  isTerminal: integer('is_terminal', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── cv_versions ────────────────────────────────────────────────────────────

export const cvVersions = sqliteTable('cv_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  gdriveId: text('gdrive_id'),
  content: text('content'),
  importedAt: text('imported_at').notNull().default(sql`(datetime('now'))`),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
})

// ─── vacancies ───────────────────────────────────────────────────────────────

export const vacancies = sqliteTable('vacancies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company: text('company').notNull(),
  position: text('position').notNull(),
  applyDate: text('apply_date'),
  stageId: integer('stage_id').references(() => pipelineStages.id),
  notes: text('notes'),
  urlDou: text('url_dou'),
  urlLinkedin: text('url_linkedin'),
  urlSite: text('url_site'),
  cvVersionId: integer('cv_version_id').references(() => cvVersions.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── recruiters ──────────────────────────────────────────────────────────────

export const recruiters = sqliteTable('recruiters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vacancyId: integer('vacancy_id').references(() => vacancies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  telegram: text('telegram'),
  email: text('email'),
  linkedin: text('linkedin'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── messages ────────────────────────────────────────────────────────────────

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vacancyId: integer('vacancy_id').references(() => vacancies.id, { onDelete: 'cascade' }),
  recruiterId: integer('recruiter_id').references(() => recruiters.id, { onDelete: 'set null' }),
  source: text('source', { enum: ['telegram', 'email', 'manual'] }).notNull(),
  direction: text('direction', { enum: ['in', 'out'] }).notNull(),
  content: text('content').notNull(),
  sentAt: text('sent_at').notNull(),
  importedAt: text('imported_at').notNull().default(sql`(datetime('now'))`),
})

// ─── analysis ────────────────────────────────────────────────────────────────

export const analysis = sqliteTable('analysis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vacancyId: integer('vacancy_id').notNull().references(() => vacancies.id, { onDelete: 'cascade' }),
  companyScore: real('company_score'),
  recruiterScore: real('recruiter_score'),
  redFlags: text('red_flags'),
  greenFlags: text('green_flags'),
  summary: text('summary'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  passwordHash: text('password_hash'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── TypeScript types ────────────────────────────────────────────────────────

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export type PipelineStage = InferSelectModel<typeof pipelineStages>
export type NewPipelineStage = InferInsertModel<typeof pipelineStages>

export type CvVersion = InferSelectModel<typeof cvVersions>
export type NewCvVersion = InferInsertModel<typeof cvVersions>

export type Vacancy = InferSelectModel<typeof vacancies>
export type NewVacancy = InferInsertModel<typeof vacancies>

export type Recruiter = InferSelectModel<typeof recruiters>
export type NewRecruiter = InferInsertModel<typeof recruiters>

export type Message = InferSelectModel<typeof messages>
export type NewMessage = InferInsertModel<typeof messages>

export type Analysis = InferSelectModel<typeof analysis>
export type NewAnalysis = InferInsertModel<typeof analysis>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>
