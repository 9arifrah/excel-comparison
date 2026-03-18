-- Database Function and Trigger for First User Detection
-- Run these in Supabase Dashboard SQL Editor
-- Location: https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new

-- Step 1: Create the database function for first-user detection
CREATE OR REPLACE FUNCTION assign_comparisons_to_first_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
  first_user_id TEXT;
BEGIN
  -- Check if there are any comparisons without user_id
  SELECT COUNT(*) INTO existing_count
  FROM "comparisons"
  WHERE "user_id" IS NULL;

  -- Only proceed if there are unassigned comparisons
  IF existing_count > 0 THEN
    -- Use advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(123456789);

    -- Double-check after acquiring lock
    SELECT COUNT(*) INTO existing_count
    FROM "comparisons"
    WHERE "user_id" IS NULL;

    IF existing_count > 0 THEN
      -- Get the first user's ID
      first_user_id := NEW.id;

      -- Update all existing comparisons
      UPDATE "comparisons"
      SET "user_id" = first_user_id
      WHERE "user_id" IS NULL;

      -- Record assignments in admin_assignments table
      INSERT INTO "admin_assignments" ("id", "old_id", "assigned_to", "assigned_at")
      SELECT
        gen_random_uuid()::text,
        "id",
        first_user_id,
        now()
      FROM "comparisons"
      WHERE "user_id" = first_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger
CREATE TRIGGER on_first_user_signup
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION assign_comparisons_to_first_user();

-- Step 3: Enable Row Level Security policies
-- Enable RLS on comparisons table
ALTER TABLE "comparisons" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own comparisons
CREATE POLICY "users_can_only_view_own_comparisons"
ON "comparisons"
FOR SELECT
USING (auth.uid()::text = "user_id");

-- Policy: Users can only insert their own comparisons
CREATE POLICY "users_can_only_insert_own_comparisons"
ON "comparisons"
FOR INSERT
WITH CHECK (auth.uid()::text = "user_id");

-- Policy: Users can only update their own comparisons
CREATE POLICY "users_can_only_update_own_comparisons"
ON "comparisons"
FOR UPDATE
USING (auth.uid()::text = "user_id");

-- Policy: Users can only delete their own comparisons
CREATE POLICY "users_can_only_delete_own_comparisons"
ON "comparisons"
FOR DELETE
USING (auth.uid()::text = "user_id");

-- Enable RLS on admin_assignments table
ALTER TABLE "admin_assignments" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own admin assignments
CREATE POLICY "users_can_only_view_own_admin_assignments"
ON "admin_assignments"
FOR SELECT
USING (auth.uid()::text = "assigned_to");

-- Step 4: Verify all comparisons have userId (for Task 37)
-- Run this before enforcing NOT NULL constraint:
SELECT COUNT(*) FROM "comparisons" WHERE "user_id" IS NULL;
-- Expected: 0 (all comparisons have a user)

-- Step 5: Enforce NOT NULL constraint (only after confirming Step 4 returns 0)
ALTER TABLE "comparisons"
ALTER COLUMN "user_id" SET NOT NULL,
ADD CONSTRAINT "comparisons_user_id_fkey"
  REFERENCES "auth.users"("id") ON DELETE CASCADE;
