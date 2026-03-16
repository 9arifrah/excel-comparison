-- Add fuzzy_algorithm column to comparisons table
ALTER TABLE "comparisons"
ADD COLUMN "fuzzy_algorithm" VARCHAR(20)
DEFAULT 'jaro-winkler'
CHECK (fuzzy_algorithm IN ('jaro-winkler', 'jaccard'));

COMMENT ON COLUMN "comparisons"."fuzzy_algorithm" IS
'Fuzzy matching algorithm used: jaro-winkler or jaccard';

-- Rollback: Remove fuzzy_algorithm column
-- ALTER TABLE "comparisons" DROP COLUMN IF EXISTS "fuzzy_algorithm";
