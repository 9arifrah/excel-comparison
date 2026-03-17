# Supabase Authentication Design Document

**Project:** Excel Comparison Application
**Date:** 2026-03-17
**Author:** Generated via Design Review
**Status:** Approved

## Overview

Add Supabase Authentication to protect the Excel comparison application, ensuring users can only access their own comparison data while maintaining backward compatibility with existing data through admin assignment.

## Requirements

1. **Authentication Methods:** Google OAuth, GitHub OAuth, Email/Password
2. **Existing Data:** Assign all existing comparisons to the first registered admin user
3. **Protection Scope:** ALL pages require authentication (no public access)
4. **Data Isolation:** Add `user_id` to comparisons table for proper data separation

## Architecture

### Component Structure

```
src/
├── app/
│   ├── login/                   # Login page (standalone route)
│   │   └── page.tsx            # Login page
│   ├── auth-callback/          # OAuth callback handler
│   │   └── route.ts           # OAuth callback handler
│   ├── compare/                # Protected comparison pages
│   ├── history/                # Protected history page
│   ├── page.tsx                # Protected home page
│   ├── layout.tsx              # Root layout with auth provider
│   └── middleware.ts           # Route protection middleware
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client for client components
│   │   └── server.ts          # Server client for server components
│   └── db/
│       └── schema.ts          # Updated with user_id and adminAssignments
└── scripts/
    └── migrate-existing-comparisons.ts  # One-time migration script (optional)
```

### Technology Stack

- **Auth Provider:** Supabase Auth
- **Next.js Version:** 16 (App Router)
- **Libraries:** `@supabase/ssr` (official package for Next.js App Router)
- **Database:** Supabase PostgreSQL (existing)

## Database Schema

### New Tables (Supabase Auth Auto-Created)

Supabase Auth automatically creates:
- `auth.users` - User accounts
- `auth.identities` - OAuth identities
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - Token refresh management

### Schema Changes

#### Update `comparisons` Table

```sql
-- Add user_id column (nullable during migration)
ALTER TABLE "comparisons"
ADD COLUMN "user_id" text NULL;

-- Create index for user queries
CREATE INDEX "comparisons_user_id_idx"
ON "comparisons"("user_id");

-- After migration, make NOT NULL and add foreign key
ALTER TABLE "comparisons"
ALTER COLUMN "user_id" SET NOT NULL,
ADD CONSTRAINT "comparisons_user_id_fkey"
  REFERENCES "auth.users"("id") ON DELETE CASCADE;
```

#### New `adminAssignments` Table

```sql
CREATE TABLE "admin_assignments" (
  "id" text PRIMARY KEY,
  "old_id" text NOT NULL,
  "assigned_to" text NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "admin_assignments_assigned_to_idx"
ON "admin_assignments"("assigned_to");
```

#### Database Function for First User Detection

To handle the race condition where multiple users might register simultaneously, we'll use a database function with proper locking:

```sql
-- Function to assign existing comparisons to first user (called via database trigger)
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
  IF existing_count >  THEN
    -- Use advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(123456789);

    -- Double-check after acquiring lock
    SELECT COUNT(*) INTO existing_count
    FROM "comparisons"
    WHERE "user_id" IS NULL;

    IF existing_count >  THEN
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

-- Trigger to automatically assign on first user signup
CREATE TRIGGER on_first_user_signup
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION assign_comparisons_to_first_user();
```

#### Row Level Security (RLS) Policies

Row Level Security provides defense-in-depth by enforcing data access at the database level. Even if application-level checks fail, RLS prevents unauthorized access.

**Enable RLS on comparisons table:**

```sql
-- Enable RLS
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

## Middleware & Route Protection

### Middleware (`src/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          req.cookies.delete({ name, ...options })
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Auth Check in Server Components

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const user = session.user
  // ... rest of component
}
```

## UI Components

### Login Page (`src/app/login/page.tsx`)

**Features:**
- Google OAuth button
- GitHub OAuth button
- Email/password form
- Error messages for failed login
- Loading states during OAuth flow

### User Menu Component (`src/components/user-menu.tsx`)

**Features:**
- Display user email
- Display user avatar (from provider or initial)
- Logout button
- Visual indication of authenticated state

### Auth Provider Layout

**Location:** `src/app/layout.tsx`

**Purpose:**
- Wrap application with Supabase AuthProvider
- Provide auth context to all components
- Handle session refresh

## API Integration

### Supabase Client Setup

**Browser Client (`src/lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client (`src/lib/supabase/server.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### API Route Updates

**Update all protected API routes:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // ... existing logic

  // Add user_id when creating comparison
  const userId = session.user.id
}
```

**Affected Routes:**
- `/api/compare` - Create comparison with user_id
- `/api/history` - Fetch only user's comparisons
- `/api/history/[id]` - Delete only user's comparisons
- `/api/comparison/[id]` - Fetch only user's comparisons

## Migration Strategy

### Phase 1: Environment Setup

**Environment Variables (`.env.local`):**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (configured in Supabase Dashboard)
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
```

### Phase 2: Install Dependencies

```bash
npm install @supabase/ssr
```

### Phase 3: Supabase Dashboard Configuration

1. Enable Authentication di Supabase project
2. Configure Google OAuth:
   - Buat project di Google Cloud Console
   - Add OAuth consent screen
   - Get Client ID and Secret
3. Configure GitHub OAuth:
   - Buat OAuth App di GitHub Developer Settings
   - Set Authorization callback URL
   - Get Client ID and Secret
4. Enable Email provider (opsional)
5. Copy environment variables

### Phase 4: Database Migration

**Step 1:** Add nullable user_id column
```sql
ALTER TABLE "comparisons"
ADD COLUMN "user_id" text NULL;
CREATE INDEX "comparisons_user_id_idx"
ON "comparisons"("user_id");
```

**Step 2:** Create adminAssignments table
```sql
CREATE TABLE "admin_assignments" (
  "id" text PRIMARY KEY,
  "old_id" text NOT NULL,
  "assigned_to" text NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "admin_assignments_assigned_to_idx"
ON "admin_assignments"("assigned_to");
```

**Step 3:** Create database function and trigger for first-user detection
```sql
-- Function to assign existing comparisons to first user
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

-- Trigger to automatically assign on first user signup
CREATE TRIGGER on_first_user_signup
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION assign_comparisons_to_first_user();
```

**Step 4:** Enable Row Level Security policies
```sql
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

**Step 5:** One-time migration script (optional - trigger handles this automatically)

### Phase 5: Optional Manual Migration Script

**Note:** The database trigger created in Step 3 automatically assigns existing comparisons to the first user who signs up. This manual script is only needed if you want to migrate data before deploying or need to reassign data.

**`scripts/migrate-existing-comparisons.ts`:**

```typescript
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
```

### Phase 6: Enforce Constraints

After the first user has registered and the database trigger has assigned existing comparisons, enforce the NOT NULL constraint:

```sql
-- Make userId NOT NULL
ALTER TABLE "comparisons"
ALTER COLUMN "user_id" SET NOT NULL,
ADD CONSTRAINT "comparisons_user_id_fkey"
  REFERENCES "auth.users"("id") ON DELETE CASCADE;
```

## Edge Cases & Error Handling

### 1. OAuth Failure

```typescript
// src/app/auth-callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `/login?error=${error}&description=${errorDescription}`
    )
  }

  // ... rest of callback logic
}
```

### 2. Session Expiry

```typescript
// Middleware handles this automatically
// Invalid session → redirect to login
```

### 3. First User Admin Assignment

The first user admin assignment is handled automatically by a database trigger to prevent race conditions. The trigger `on_first_user_signup` fires when a new user is created and:

1. Checks if there are comparisons without user_id
2. Uses `pg_advisory_xact_lock` to prevent race conditions
3. Assigns all unassigned comparisons to the first user
4. Records the assignment in the `admin_assignments` table

**Note:** The migration script is still available for manual use if needed, but the database trigger handles the automatic first-user assignment safely.

### 4. User Data Access Control

**All queries must include user filter:**
```typescript
// Always filter by userId
const userComparisons = await db
  .select()
  .from(comparisons)
  .where(eq(comparisons.userId, session.user.id))
```

### 5. Logout

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
```

## Testing Strategy

### Manual Testing Checklist

**Authentication Flow:**
- [ ] Google OAuth redirects correctly
- [ ] GitHub OAuth redirects correctly
- [ ] Email signup creates account
- [ ] Email login works with correct credentials
- [ ] Wrong email/password shows error
- [ ] OAuth error redirects back to login with error message

**Route Protection:**
- [ ] Unauthenticated user redirected to `/login`
- [ ] Authenticated user can access protected routes
- [ ] Authenticated user redirected to home when accessing `/login`
- [ ] API routes return 401 when unauthenticated

**Data Isolation:**
- [ ] User only sees their own comparisons in history
- [ ] User cannot access comparisons by ID they don't own
- [ ] Admin can see all migrated comparisons

**Admin Assignment:**
- [ ] First user is marked as admin
- [ ] Existing comparisons assigned to admin
- [ ] New users don't get existing comparisons

**Session Management:**
- [ ] Login persists across browser refresh
- [ ] Logout clears session and redirects
- [ ] Session expires and redirects to login

## Rollback Plan

### Remove Authentication (if needed)

**1. Database Rollback:**
```sql
-- Drop foreign key constraint
ALTER TABLE "comparisons"
DROP CONSTRAINT IF EXISTS "comparisons_user_id_fkey";

-- Remove user_id column
ALTER TABLE "comparisons"
DROP COLUMN IF EXISTS "user_id";

-- Drop admin assignments table
DROP TABLE IF EXISTS "admin_assignments";
```

**2. Code Rollback:**
- Revert middleware changes
- Remove auth checks from API routes
- Remove (auth) route group structure
- Remove auth provider from layout

**3. Feature Flag (Optional):**

Add environment variable to conditionally enable auth:
```typescript
const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

if (ENABLE_AUTH) {
  // Auth checks
}
```

## Implementation Order

1. Install dependencies (`@supabase/ssr`)
2. Configure Supabase Auth dashboard (Google + GitHub OAuth)
3. Add environment variables (OAuth client IDs)
4. Run database migration:
   - Add nullable user_id column
   - Create admin_assignments table
   - Create database trigger for first-user detection
   - Enable RLS policies
5. Implement middleware with route protection
6. Create login page and auth-callback route
7. Update root layout with auth provider
8. Update API routes with auth checks and user_id filtering
9. Test auth flow (login, logout, session management)
10. First user registers (auto-admin via trigger)
11. Enable NOT NULL constraint on user_id
12. Full testing (data isolation, OAuth providers, RLS)

## Success Criteria

✅ All pages require authentication to access
✅ Users can only see their own comparison data (app-level + RLS)
✅ Google + GitHub + Email login all working
✅ Existing data preserved and assigned to admin user (via trigger)
✅ Session management works correctly
✅ Logout functionality works
✅ No data leakage between users (RLS enforced at database level)
✅ First-user detection handles race conditions safely
