# Supabase Authentication Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Authentication to protect all pages, ensuring users can only access their own comparison data while preserving existing data through automatic first-user assignment.

**Architecture:** Server-side auth checks using @supabase/ssr for Next.js 16 App Router, with Row Level Security (RLS) for defense-in-depth, and automatic database trigger for first-user data migration.

**Tech Stack:** @supabase/ssr, Next.js 16 App Router, Drizzle ORM, PostgreSQL

---

## File Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx                    # NEW: Login page with OAuth buttons
│   ├── auth-callback/
│   │   └── route.ts                    # NEW: OAuth callback handler
│   ├── layout.tsx                      # MODIFY: Add type declaration
│   └── middleware.ts                   # NEW: Route protection middleware
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # NEW: Browser client
│   │   └── server.ts                   # NEW: Server client
│   ├── env.ts                          # NEW: Environment validation
│   └── db/
│       └── schema.ts                   # MODIFY: Add userId and adminAssignments
├── components/
│   └── user-menu.tsx                   # NEW: User menu component
└── app/api/
    ├── compare/route.ts                # MODIFY: Add user filtering
    ├── history/route.ts                # MODIFY: Add user filtering
    ├── history/[id]/route.ts           # MODIFY: Add user filtering
    └── comparison/[id]/route.ts        # MODIFY: Add user filtering
```

---

## Phase 1: Supabase Project Setup

### Task 1: Create Supabase Project and Configure OAuth Providers

**Files:**
- Create: `.env.local`

- [ ] **Step 1: Create a new Supabase project**

1. Go to https://app.supabase.com
2. Click "New Project"
3. Enter project name: "excel-comparison"
4. Enter database password (save it securely)
5. Select region closest to your users
6. Click "Create new project"
7. Wait for project to be provisioned (2-3 minutes)

- [ ] **Step 2: Get project credentials**

1. Go to Project Settings > API
2. Copy these values for next step:
   - Project URL
   - anon public key

- [ ] **Step 3: Configure Google OAuth**

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project or select existing
3. Go to APIs & Services > OAuth consent screen
4. Configure consent screen (External)
5. Go to APIs & Services > Credentials
6. Create OAuth 2.0 Client ID (Web application)
7. Add authorized redirect URI: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
8. Copy Client ID and create Client Secret
9. Save both values for next step

- [ ] **Step 4: Configure GitHub OAuth**

1. Go to GitHub > Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Application name: "Excel Comparison"
4. Homepage URL: `http://localhost:3000` (dev) or production URL
5. Authorization callback URL: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
6. Click "Register application"
7. Copy Client ID and generate Client Secret
8. Save both values for next step

- [ ] **Step 5: Enable providers in Supabase Dashboard**

1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Enter Client ID and Secret from Step 3
4. Save

5. Go to Authentication > Providers > GitHub
6. Enable GitHub provider
7. Enter Client ID and Secret from Step 4
8. Save

- [ ] **Step 6: Enable Email provider (optional)**

1. Go to Authentication > Providers > Email
2. Enable Email provider
3. Confirm email templates are configured
4. Save

- [ ] **Step 7: Configure redirect URLs**

1. Go to Authentication > URL Configuration
2. Site URL: `http://localhost:3000` (dev) or production URL
3. Redirect URLs: Add `http://localhost:3000/auth-callback`
4. Save

- [ ] **Step 8: Create .env.local file**

```bash
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
EOF
```

Replace values with actual credentials from Steps 2, 3, and 4.

- [ ] **Step 9: Verify .env.local is gitignored**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` should be in the list. If not:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 10: Commit**

```bash
git add .gitignore
git commit -m "chore: ensure .env.local is gitignored"
```

---

## Phase 2: Package Installation

### Task 2: Install @supabase/ssr Package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove old @supabase/supabase-js package**

```bash
npm uninstall @supabase/supabase-js
```

Expected: Package removed from node_modules and package.json

- [ ] **Step 2: Install @supabase/ssr package**

```bash
npm install @supabase/ssr
```

Expected: Package added to package.json dependencies

- [ ] **Step 3: Verify installation**

```bash
grep "@supabase/ssr" package.json
```

Expected: Line showing `"@supabase/ssr": "^version"`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: replace @supabase/supabase-js with @supabase/ssr for Next.js 16 App Router"
```

---

### Task 2: Create Environment Variable Validation

**Files:**
- Create: `src/lib/env.ts`

- [ ] **Step 1: Create environment validation utility**

```typescript
// src/lib/env.ts
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  supabaseUrl: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_OAUTH_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
} as const
```

- [ ] **Step 2: Test environment validation (should fail initially)**

```bash
node -e "import('./src/lib/env.ts').then(m => console.log(m.env))"
```

Expected: Error about missing NEXT_PUBLIC_SUPABASE_URL (we'll add this in next task)

- [ ] **Step 3: Create .env.local.example file**

```bash
cat > .env.local.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (configured in Supabase Dashboard)
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
EOF
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/env.ts .env.local.example
git commit -m "feat: add environment variable validation utility"
```

---

## Phase 2: Database Schema Updates

### Task 3: Update Drizzle Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add userId field to comparisons table**

```typescript
// In src/lib/db/schema.ts, modify the comparisons table definition:

import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const comparisons = pgTable('comparisons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
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
  comparisonMethod: text('comparison_method').notNull().default('exact'),
  similarityThreshold: integer('similarity_threshold'),
  fuzzyAlgorithm: text('fuzzy_algorithm').default('jaro-winkler'),
  // NEW: User ownership field (nullable initially)
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIndex: index('comparisons_created_at_idx').on(table.createdAt),
  masterFileIndex: index('comparisons_master_file_idx').on(table.masterFile),
  secondaryFileIndex: index('comparisons_secondary_file_idx').on(table.secondaryFile),
  comparisonMethodIndex: index('comparisons_comparison_method_idx').on(table.comparisonMethod),
  // NEW: Index for user queries
  userIdIndex: index('comparisons_user_id_idx').on(table.userId),
}))
```

- [ ] **Step 2: Add adminAssignments table**

```typescript
// Add after the comparisons table in src/lib/db/schema.ts:

export const adminAssignments = pgTable('admin_assignments', {
  id: text('id').primaryKey(),
  oldId: text('old_id').notNull(),
  assignedTo: text('assigned_to').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  assignedToIndex: index('admin_assignments_assigned_to_idx').on(table.assignedTo),
}))

export type AdminAssignment = typeof adminAssignments.$inferSelect
export type NewAdminAssignment = typeof adminAssignments.$inferInsert
```

- [ ] **Step 3: Run db:generate to create migration**

```bash
npm run db:generate
```

Expected: New migration file created in drizzle/ folder

- [ ] **Step 4: Run db:push to apply migration**

```bash
npm run db:push
```

Expected: Schema updated in database

- [ ] **Step 5: Verify schema changes**

```bash
npm run db:studio
```

Expected: Drizzle Studio opens showing userId column and adminAssignments table

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat: add userId and adminAssignments to database schema"
```

---

### Task 4: Create Database Function and Trigger (via Supabase SQL Editor)

**Files:**
- N/A (run in Supabase Dashboard SQL Editor)

- [ ] **Step 1: Open Supabase Dashboard SQL Editor**

Navigate to: https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new

- [ ] **Step 2: Create the database function for first-user detection**

```sql
-- Copy and paste this into Supabase SQL Editor:
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
```

Click "Run" to execute.

Expected: "Success. No rows returned"

- [ ] **Step 3: Create the trigger**

```sql
-- Copy and paste this into Supabase SQL Editor:
CREATE TRIGGER on_first_user_signup
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION assign_comparisons_to_first_user();
```

Click "Run" to execute.

Expected: "Success. No rows returned"

- [ ] **Step 4: Enable Row Level Security policies**

```sql
-- Copy and paste this into Supabase SQL Editor:

-- Enable RLS on comparisons table
ALTER TABLE "comparisons" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own comparisons
CREATE POLICY "users_can_only_view_own_comparisons"
ON "comparisons"
FOR SELECT
USING (auth.uid() = "user_id");

-- Policy: Users can only insert their own comparisons
CREATE POLICY "users_can_only_insert_own_comparisons"
ON "comparisons"
FOR INSERT
WITH CHECK (auth.uid() = "user_id");

-- Policy: Users can only update their own comparisons
CREATE POLICY "users_can_only_update_own_comparisons"
ON "comparisons"
FOR UPDATE
USING (auth.uid() = "user_id");

-- Policy: Users can only delete their own comparisons
CREATE POLICY "users_can_only_delete_own_comparisons"
ON "comparisons"
FOR DELETE
USING (auth.uid() = "user_id");

-- Enable RLS on admin_assignments table
ALTER TABLE "admin_assignments" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own admin assignments
CREATE POLICY "users_can_only_view_own_admin_assignments"
ON "admin_assignments"
FOR SELECT
USING (auth.uid() = "assigned_to");
```

Click "Run" to execute.

Expected: "Success. No rows returned" for each statement

- [ ] **Step 5: Document the SQL changes**

Create a file to track manual database changes:

```bash
mkdir -p docs/database
cat > docs/database/manual-changes.sql << 'EOF'
-- Database Function and Trigger for First User Detection
-- Run these in Supabase Dashboard SQL Editor
-- Location: https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new

CREATE OR REPLACE FUNCTION assign_comparisons_to_first_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
  first_user_id TEXT;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM "comparisons"
  WHERE "user_id" IS NULL;

  IF existing_count > 0 THEN
    PERFORM pg_advisory_xact_lock(123456789);

    SELECT COUNT(*) INTO existing_count
    FROM "comparisons"
    WHERE "user_id" IS NULL;

    IF existing_count > 0 THEN
      first_user_id := NEW.id;

      UPDATE "comparisons"
      SET "user_id" = first_user_id
      WHERE "user_id" IS NULL;

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

CREATE TRIGGER on_first_user_signup
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION assign_comparisons_to_first_user();

-- Row Level Security Policies
ALTER TABLE "comparisons" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_only_view_own_comparisons"
ON "comparisons" FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "users_can_only_insert_own_comparisons"
ON "comparisons" FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_can_only_update_own_comparisons"
ON "comparisons" FOR UPDATE USING (auth.uid() = "user_id");

CREATE POLICY "users_can_only_delete_own_comparisons"
ON "comparisons" FOR DELETE USING (auth.uid() = "user_id");

ALTER TABLE "admin_assignments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_only_view_own_admin_assignments"
ON "admin_assignments" FOR SELECT USING (auth.uid() = "assigned_to");
EOF
```

- [ ] **Step 6: Commit**

```bash
git add docs/database/manual-changes.sql
git commit -m "docs: add manual database changes for auth (trigger and RLS)"
```

---

### Task 4a: Create Optional Manual Migration Script

**Files:**
- Create: `scripts/migrate-existing-comparisons.ts`

**Note:** The database trigger handles first-user assignment automatically. This script is only needed if you want to migrate data before deploying or need to reassign data.

- [ ] **Step 1: Install @supabase/supabase-js for the script**

```bash
npm install --save-dev @supabase/supabase-js
```

Expected: Package added to devDependencies

- [ ] **Step 2: Create migration script**

```typescript
// scripts/migrate-existing-comparisons.ts
import { createClient } from '@supabase/supabase-js'
import { db } from '../src/lib/db'
import { comparisons, adminAssignments } from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function migrateExistingComparisons(adminUserId: string) {
  console.log('Starting migration of existing comparisons...')

  // Get all existing comparisons
  const allComparisons = await db.select().from(comparisons)
  console.log(`Found ${allComparisons.length} existing comparisons`)

  // Track migrated IDs
  const migratedIds: string[] = []

  for (const comp of allComparisons) {
    // Record old ID mapping
    await db.insert(adminAssignments).values({
      id: crypto.randomUUID(),
      oldId: comp.id,
      assignedTo: adminUserId,
    })

    // Update comparison with admin user_id
    await db.update(comparisons)
      .set({ userId: adminUserId })
      .where(eq(comparisons.id, comp.id))

    migratedIds.push(comp.id)
  }

  console.log(`Successfully migrated ${migratedIds.length} comparisons`)
  return migratedIds
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const adminUserId = process.argv[2]
  if (!adminUserId) {
    console.error('Usage: tsx scripts/migrate-existing-comparisons.ts <admin-user-id>')
    process.exit(1)
  }
  migrateExistingComparisons(adminUserId)
    .then(() => {
      console.log('Migration complete!')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
```

- [ ] **Step 3: Add tsx for running TypeScript scripts**

```bash
npm install --save-dev tsx
```

- [ ] **Step 4: Update package.json with migration script**

Add to `scripts` section in package.json:

```json
"migrate-comparisons": "tsx scripts/migrate-existing-comparisons.ts"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-existing-comparisons.ts package.json package-lock.json
git commit -m "feat: add manual migration script for existing comparisons"
```

---

## Phase 3: Supabase Client Setup

### Task 5: Create Supabase Server Client

**Files:**
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
```

Note: Type declarations are not needed as @supabase/ssr provides built-in TypeScript support.

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/server.ts
git commit -m "feat: add Supabase server client for Next.js 16"
```

---

### Task 6: Create Supabase Browser Client

**Files:**
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Create browser client**

```typescript
// src/lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/client.ts
git commit -m "feat: add Supabase browser client"
```

---

## Phase 4: Middleware and Route Protection

**IMPORTANT:** Complete Task 8 (Login Page) BEFORE this task to avoid 404 errors!

### Task 7: Create Middleware for Route Protection

**Files:**
- Create: `src/middleware.ts`

**Prerequisite:** Task 8 (Login Page) must be completed first, otherwise all pages will redirect to /login which doesn't exist yet.

- [ ] **Step 1: Create middleware file**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if no session (except login page)
  if (!session && req.nextUrl.pathname !== '/login') {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to home if already authenticated and trying to access login page
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Test middleware (restart dev server)**

```bash
# Stop current dev server if running, then:
npm run dev
```

Expected: All pages redirect to /login (which doesn't exist yet, so 404)

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add route protection middleware"
```

---

## Phase 5: Login Page and Authentication UI

### Task 8: Create Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/user-menu.tsx`

- [ ] **Step 1: Create login page component**

```typescript
// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Choose your sign-in method to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue with Google
            </Button>
            <Button
              onClick={handleGithubLogin}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create user menu component**

```typescript
// src/components/user-menu.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const [email, setEmail] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = email
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 3: Update root layout to include user menu**

```typescript
// src/app/layout.tsx - Add the user menu to the layout
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserMenu } from "@/components/user-menu"; // NEW

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excel Comparison",
  description: "High-performance Excel file comparison tool optimized for processing files with 150,000+ rows. Compare, analyze, and export results instantly.",
  keywords: ["Excel", "Comparison", "File Analysis", "Data Processing", "Next.js", "TypeScript", "Big Data"],
  authors: [{ name: "9arifrah" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Excel Comparison",
    description: "Compare Excel files with 150,000+ rows instantly. Fast, accurate, and easy-to-use.",
    url: "https://github.com/9arifrah/excel-comparison",
    siteName: "Excel Comparison",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel Comparison",
    description: "Compare Excel files with 150,000+ rows instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* NEW: Add header with user menu */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">Excel Comparison</span>
            </div>
            <UserMenu />
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Test login page**

```bash
npm run dev
```

Expected: Login page visible at http://localhost:3000/login

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/user-menu.tsx src/app/layout.tsx
git commit -m "feat: add login page and user menu"
```

---

### Task 9: Create OAuth Callback Route

**Files:**
- Create: `src/app/auth-callback/route.ts`

- [ ] **Step 1: Create OAuth callback handler**

```typescript
// src/app/auth-callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${error}&description=${errorDescription}`, request.url)
    )
  }

  // Exchange authorization code for session
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home page after successful login
  return NextResponse.redirect(new URL('/', request.url))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth-callback/route.ts
git commit -m "feat: add OAuth callback handler"
```

---

## Phase 6: API Route Updates for User Filtering

### Task 10: Update Compare API Route

**Files:**
- Modify: `src/app/api/compare/route.ts`

- [ ] **Step 1: Add auth check and user_id to comparison**

```typescript
// src/app/api/compare/route.ts - Update the POST function

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { compareExcelFiles } from '@/lib/excel-comparison'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server' // NEW

// ... keep existing notifyProgressService function ...

export async function POST(request: NextRequest) {
  try {
    // NEW: Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id // NEW

    // ... keep existing form data parsing ...

    // ... keep existing validation logic ...

    // ... keep existing comparison logic ...

    // Save comparison to database with userId
    const [comparison] = await db.insert(comparisons).values({
      masterFile: masterFile.name,
      secondaryFile: secondaryFile.name,
      totalRows: result.totalRows,
      matchedRows: result.matchedRows,
      unmatchedRows: result.unmatchedRows,
      masterData: JSON.stringify(result.masterData),
      secondaryData: JSON.stringify(result.secondaryData),
      comparisonData: JSON.stringify(result.comparisonData),
      masterColumns: JSON.stringify(masterColumns),
      secondaryColumns: JSON.stringify(secondaryColumns),
      comparisonMethod: result.comparisonMethod,
      similarityThreshold: result.similarityThreshold,
      fuzzyAlgorithm: result.fuzzyAlgorithm,
      userId: userId, // NEW
    }).returning()

    // Return result summary
    return NextResponse.json({
      id: comparison.id,
      // ... keep existing return values ...
    })
  } catch (error) {
    console.error('Error comparing files:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test API returns 401 without auth**

```bash
curl -X POST http://localhost:3000/api/compare \
  -F "masterFile=@test.xlsx" \
  -F "secondaryFile=@test.xlsx" \
  -F "masterColumns=[]" \
  -F "secondaryColumns=[]"
```

Expected: `{"error":"Authentication required"}` with status 401

- [ ] **Step 3: Commit**

```bash
git add src/app/api/compare/route.ts
git commit -m "feat: add authentication check to compare API"
```

---

### Task 11: Update History API Route

**Files:**
- Modify: `src/app/api/history/route.ts`

- [ ] **Step 1: Add user filtering**

```typescript
// src/app/api/history/route.ts - Complete replacement

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server' // NEW

export async function GET() {
  try {
    // NEW: Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id // NEW

    // NEW: Filter by userId
    const result = await db
      .select({
        id: comparisons.id,
        masterFile: comparisons.masterFile,
        secondaryFile: comparisons.secondaryFile,
        totalRows: comparisons.totalRows,
        matchedRows: comparisons.matchedRows,
        unmatchedRows: comparisons.unmatchedRows,
        masterColumns: comparisons.masterColumns,
        secondaryColumns: comparisons.secondaryColumns,
        comparisonMethod: comparisons.comparisonMethod,
        fuzzyAlgorithm: comparisons.fuzzyAlgorithm,
        similarityThreshold: comparisons.similarityThreshold,
        createdAt: comparisons.createdAt
      })
      .from(comparisons)
      .where(eq(comparisons.userId, userId)) // NEW
      .orderBy(desc(comparisons.createdAt))

    // Parse JSON columns
    const parsedComparisons = result.map(comp => ({
      ...comp,
      masterColumns: comp.masterColumns ? JSON.parse(comp.masterColumns) : [],
      secondaryColumns: comp.secondaryColumns ? JSON.parse(comp.secondaryColumns) : []
    }))

    return NextResponse.json(parsedComparisons)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test API returns 401 without auth**

```bash
curl http://localhost:3000/api/history
```

Expected: `{"error":"Authentication required"}` with status 401

- [ ] **Step 3: Commit**

```bash
git add src/app/api/history/route.ts
git commit -m "feat: add user filtering to history API"
```

---

### Task 12: Update History Delete API Route

**Files:**
- Modify: `src/app/api/history/[id]/route.ts`

- [ ] **Step 1: Read existing file and add user check**

First, read the existing file to understand its structure:

```bash
cat src/app/api/history/[id]/route.ts
```

Then update it with auth checks:

```typescript
// src/app/api/history/[id]/route.ts - Complete replacement

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server' // NEW

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // NEW: Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id // NEW

    // NEW: Check ownership before deleting
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))
      .limit(1)

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    // Delete the comparison
    await db
      .delete(comparisons)
      .where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test API returns 401 without auth**

```bash
curl -X DELETE http://localhost:3000/api/history/some-id
```

Expected: `{"error":"Authentication required"}` with status 401

- [ ] **Step 3: Commit**

```bash
git add src/app/api/history/[id]/route.ts
git commit -m "feat: add ownership check to history delete API"
```

---

### Task 13: Update Comparison Detail API Route

**Files:**
- Modify: `src/app/api/comparison/[id]/route.ts`

- [ ] **Step 1: Read existing file and add user check**

First, read the existing file:

```bash
cat src/app/api/comparison/[id]/route.ts
```

Then update it with auth checks:

```typescript
// src/app/api/comparison/[id]/route.ts - Complete replacement

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server' // NEW

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // NEW: Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id // NEW

    // NEW: Filter by both id and userId
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))
      .limit(1)

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsedComparison = {
      ...comparison,
      masterData: JSON.parse(comparison.masterData),
      secondaryData: JSON.parse(comparison.secondaryData),
      comparisonData: JSON.parse(comparison.comparisonData),
      masterColumns: comparison.masterColumns ? JSON.parse(comparison.masterColumns) : [],
      secondaryColumns: comparison.secondaryColumns ? JSON.parse(comparison.secondaryColumns) : [],
    }

    return NextResponse.json(parsedComparison)
  } catch (error) {
    console.error('Error fetching comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test API returns 401 without auth**

```bash
curl http://localhost:3000/api/comparison/some-id
```

Expected: `{"error":"Authentication required"}` with status 401

- [ ] **Step 3: Commit**

```bash
git add src/app/api/comparison/[id]/route.ts
git commit -m "feat: add ownership check to comparison detail API"
```

---

### Task 14: Update Export API Route

**Files:**
- Modify: `src/app/api/export/[id]/route.ts`

- [ ] **Step 1: Add user ownership check**

```typescript
// src/app/api/export/[id]/route.ts - Add auth check at the beginning of GET function

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server' // NEW

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // NEW: Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id // NEW

    // NEW: Filter by both id and userId
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))
      .limit(1)

    // ... keep rest of the export logic the same ...
  } catch (error) {
    console.error('Error exporting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test API returns 401 without auth**

```bash
curl http://localhost:3000/api/export/some-id
```

Expected: `{"error":"Authentication required"}` with status 401

- [ ] **Step 3: Commit**

```bash
git add src/app/api/export/[id]/route.ts
git commit -m "feat: add ownership check to export API"
```

---

## Phase 7: Testing and Verification

### Task 15: End-to-End Authentication Testing

**Files:**
- N/A (manual testing)

- [ ] **Step 1: Test unauthenticated access**

```bash
# Stop dev server and restart
npm run dev
```

Visit: http://localhost:3000
Expected: Redirect to /login

Visit: http://localhost:3000/history
Expected: Redirect to /login

- [ ] **Step 2: Configure Supabase OAuth providers**

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google OAuth:
   - Add Google Cloud Console project
   - Configure OAuth consent screen
   - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
3. Enable GitHub OAuth:
   - Create OAuth App in GitHub
   - Set Authorization callback URL
   - Copy Client ID and Secret to Supabase

- [ ] **Step 3: Test sign-up flow**

1. Visit: http://localhost:3000/login
2. Click "Continue with Google" or "Continue with GitHub"
3. Complete OAuth flow
4. Expected: Redirect to home page, see user avatar in header

- [ ] **Step 4: Test data isolation**

1. Create a comparison as User A
2. Note the comparison ID
3. Logout
4. Sign up as User B (different Google/GitHub account)
5. Visit: http://localhost:3000/history
6. Expected: User B should NOT see User A's comparisons

- [ ] **Step 5: Test API authentication**

```bash
# Test that API returns 401 without auth
curl -w "\nHTTP Status: %{http_code}\n" http://localhost:3000/api/history
```

Expected: HTTP Status: 401

- [ ] **Step 6: Verify first-user data migration**

If you had existing comparisons before implementing auth:

1. Sign up as the first user
2. Visit: http://localhost:3000/history
3. Expected: All existing comparisons are visible and assigned to first user

- [ ] **Step 7: Test logout**

1. Click user menu in header
2. Click "Log out"
3. Expected: Redirect to /login

- [ ] **Step 8: Document test results**

```bash
mkdir -p docs/testing
cat > docs/testing/auth-checklist.md << 'EOF'
# Authentication Testing Checklist

## Route Protection
- [ ] Unauthenticated users redirected to /login from all pages
- [ ] Authenticated users cannot access /login (redirected to home)
- [ ] API routes return 401 when unauthenticated

## OAuth Flow
- [ ] Google OAuth login works
- [ ] GitHub OAuth login works
- [ ] OAuth errors redirect back to /login with error message
- [ ] Successful login redirects to home page

## Data Isolation
- [ ] Users only see their own comparisons in history
- [ ] Users cannot access other users' comparisons by ID
- [ ] API routes filter data by user_id

## Session Management
- [ ] Login persists across browser refresh
- [ ] Logout clears session and redirects to /login
- [ ] Session expires and redirects to /login

## First User Migration
- [ ] First user is marked as admin automatically
- [ ] Existing comparisons assigned to first user via trigger
- [ ] New users don't get existing comparisons

## UI Components
- [ ] User menu displays correct email/initials
- [ ] Logout button works correctly
- [ ] Login page displays all provider options
EOF
```

- [ ] **Step 9: Commit testing documentation**

```bash
git add docs/testing/auth-checklist.md
git commit -m "docs: add authentication testing checklist"
```

---

### Task 16: Enforce NOT NULL Constraint on userId

**Files:**
- N/A (run in Supabase SQL Editor)

**IMPORTANT:** Only do this after confirming first-user migration worked!

- [ ] **Step 1: Verify all comparisons have userId**

Run in Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM "comparisons" WHERE "user_id" IS NULL;
```

Expected: 0 (all comparisons have a user)

- [ ] **Step 2: Enforce NOT NULL constraint**

```sql
ALTER TABLE "comparisons"
ALTER COLUMN "user_id" SET NOT NULL,
ADD CONSTRAINT "comparisons_user_id_fkey"
  REFERENCES "auth.users"("id") ON DELETE CASCADE;
```

Expected: "Success. No rows returned"

- [ ] **Step 3: Update Drizzle schema**

```typescript
// src/lib/db/schema.ts - Change userId field to non-nullable

// In the comparisons table definition:
userId: text('user_id').notNull(), // Changed from nullable
```

- [ ] **Step 4: Run db:push**

```bash
npm run db:push
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: enforce NOT NULL constraint on userId field"
```

---

## Phase 8: Production Deployment Preparation

### Task 17: Environment Variables Setup for Production

**Files:**
- N/A (configure in hosting platform)

- [ ] **Step 1: Configure environment variables in production**

Add these to your hosting platform (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
```

- [ ] **Step 2: Update OAuth redirect URLs in Supabase**

Add your production domain to Supabase Dashboard:

1. Go to Authentication > URL Configuration
2. Add your production URL to "Site URL"
3. Add to "Redirect URLs": `https://your-domain.com/auth-callback`

- [ ] **Step 3: Update Google OAuth redirect URLs**

1. Go to Google Cloud Console
2. Add production URL to authorized redirect URLs

- [ ] **Step 4: Update GitHub OAuth redirect URLs**

1. Go to GitHub OAuth App settings
2. Update Authorization callback URL

- [ ] **Step 5: Document production setup**

```bash
cat > docs/deployment.md << 'EOF'
# Production Deployment

## Environment Variables

Add these to your hosting platform:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
\`\`\`

## OAuth Redirect URLs

### Supabase Dashboard
- Site URL: \`https://your-domain.com\`
- Redirect URLs: \`https://your-domain.com/auth-callback\`

### Google Cloud Console
- Authorized redirect URL: \`https://your-project.supabase.co/auth/v1/callback\`

### GitHub OAuth App
- Authorization callback URL: \`https://your-project.supabase.co/auth/v1/callback\`

## Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] OAuth providers enabled in Supabase
- [ ] Redirect URLs configured for all providers
- [ ] Database trigger and RLS policies applied
- [ ] First user has registered and existing data migrated
- [ ] NOT NULL constraint enforced on userId
EOF
```

- [ ] **Step 6: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: add production deployment guide"
```

---

## Summary

This implementation plan adds complete Supabase Authentication to the Excel Comparison application with:

- **Authentication Methods:** Google OAuth, GitHub OAuth, Email/Password
- **Data Security:** Row Level Security (RLS) at database level + app-level auth checks
- **User Isolation:** Each user only sees their own comparison data
- **Migration Safety:** Automatic first-user data migration via database trigger
- **Route Protection:** All pages and API routes require authentication
- **Production Ready:** Complete deployment documentation

**Total Tasks:** 17
**Estimated Time:** 4-6 hours

---

## Rollback Plan

If needed, rollback steps are documented in the design spec at `docs/superpowers/specs/2026-03-17-supabase-auth-design.md` under "Rollback Plan".
