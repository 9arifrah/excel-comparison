-- Add fuzzy matching support to comparisons table
ALTER TABLE "comparisons" 
ADD COLUMN "comparison_method" text NOT NULL DEFAULT 'exact',
ADD COLUMN "similarity_threshold" integer;

-- Create index for comparison method
CREATE INDEX IF NOT EXISTS "comparisons_comparison_method_idx" ON "comparisons" ("comparison_method");