import {
  boolean,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'STAFF',
  'PATIENT',
]);

export const procedureTypeEnum = pgEnum('procedure_type', [
  'EXAM',
  'SURGERY',
]);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('Asia/Seoul'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  role: userRoleEnum('role').notNull(),
  displayName: text('display_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const procedureCatalog = pgTable('procedure_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  procedureType: procedureTypeEnum('procedure_type').notNull(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  externalCode: text('external_code'),
  department: text('department').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  rowVersion: integer('row_version').notNull().default(1),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
