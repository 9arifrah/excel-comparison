import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const comparisons = pgTable('comparisons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'), // NEW: Nullable user ID field for authentication
  masterFile: text('master_file').notNull(),
  secondaryFile: text('secondary_file').notNull(),
  totalRows: integer('total_rows').notNull(),
  matchedRows: integer('matched_rows').notNull(),
  unmatchedRows: integer('unmatched_rows').notNull(),
  masterData: text('master_data').notNull(),
  secondaryData: text('secondary_data').notNull(),
  comparisonData: text('comparison_data').notNull(),
  masterColumns: text('master_columns'),
  secondaryColumns: text('secondary_columns'),
  comparisonMethod: text('comparison_method').notNull().default('exact'), // 'exact' or 'fuzzy'
  similarityThreshold: integer('similarity_threshold'), // Only for fuzzy matching (0-100)
  fuzzyAlgorithm: text('fuzzy_algorithm').default('jaro-winkler'), // 'jaro-winkler' or 'jaccard'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIndex: index('comparisons_created_at_idx').on(table.createdAt),
  userIdIndex: index('comparisons_user_id_idx').on(table.userId), // NEW: User ID index
  masterFileIndex: index('comparisons_master_file_idx').on(table.masterFile),
  secondaryFileIndex: index('comparisons_secondary_file_idx').on(table.secondaryFile),
  comparisonMethodIndex: index('comparisons_comparison_method_idx').on(table.comparisonMethod),
}))

export const adminAssignments = pgTable('admin_assignments', {
  id: text('id').primaryKey(),
  oldId: text('old_id').notNull(),
  assignedTo: text('assigned_to').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  assignedToIndex: index('admin_assignments_assigned_to_idx').on(table.assignedTo),
}))

export type Comparison = typeof comparisons.$inferSelect
export type NewComparison = typeof comparisons.$inferInsert

export type AdminAssignment = typeof adminAssignments.$inferSelect
export type NewAdminAssignment = typeof adminAssignments.$inferInsert