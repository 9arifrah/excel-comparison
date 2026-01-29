# Supabase Setup Guide

This document provides instructions for setting up Supabase as the database backend for this Next.js application.

## Installation Status

✅ `@supabase/supabase-js` has been installed
✅ Configuration files created

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the required information:
   - Name: Your project name
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the nearest region to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (typically 1-2 minutes)

### 2. Get Your Credentials

Once your project is ready:

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. For database connection with Prisma:
   - Go to Project Settings → Database
   - Copy the connection string (make sure to replace `[YOUR-PASSWORD]` with your actual database password)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist):

```bash
# Copy from .env.local.example and fill in your values
cp .env.local.example .env.local
```

Then update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For Prisma with Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**Important**: Never commit `.env.local` to version control!

### 4. Update Prisma Schema (Optional - if migrating from SQLite)

If you want to use Supabase PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:

```prisma
// Example schema for Supabase
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Define your models here
model ExampleTable {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Add your fields
}
```

2. Run migrations:

```bash
npm run db:generate
npm run db:push
```

### 5. Using Supabase in Your Code

#### Basic Usage

```typescript
import { supabase } from '@/lib/supabase';

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Data:', data);
}
```

#### Server Component Example

```typescript
import { supabase } from '@/lib/supabase';

export default async function Page() {
  const { data: users } = await supabase
    .from('users')
    .select('*');

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

#### Client Component Example

```typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('users')
        .select('*');
      setUsers(data || []);
    }
    fetchUsers();
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

#### Real-time Subscriptions

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function RealtimeComponent() {
  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'your_table'
        },
        (payload) => {
          console.log('Change received!', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>Listening for changes...</div>;
}
```

### 6. Authentication (Optional)

Supabase provides built-in authentication. See `src/lib/supabase-example.ts` for examples:

```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/supabase-example';

// Sign up
await signUp('user@example.com', 'password123');

// Sign in
await signIn('user@example.com', 'password123');

// Get current user
const user = await getCurrentUser();

// Sign out
await signOut();
```

## File Structure

```
src/lib/
├── supabase.ts           # Main Supabase client configuration
├── supabase-example.ts   # Example functions and usage
└── db.ts                 # Prisma client (if using Prisma with Supabase)

.env.local.example        # Environment variables template
SUPABASE_SETUP.md        # This file
```

## Next Steps

### Option 1: Use Supabase Directly (Recommended)

Use the Supabase client directly in your code:
- Import from `@/lib/supabase`
- Use Supabase SDK for all database operations
- Leverage real-time subscriptions
- Use Supabase Auth for authentication

### Option 2: Use Prisma with Supabase

Keep using Prisma ORM with Supabase PostgreSQL:
- Update `prisma/schema.prisma`
- Set `DATABASE_URL` to your Supabase connection string
- Run `npm run db:push` to sync schema
- Use existing `@/lib/db.ts` for Prisma operations

### Option 3: Hybrid Approach

Use both:
- Prisma for complex queries and type safety
- Supabase SDK for real-time features and simple operations
- Supabase Auth for authentication

## Troubleshooting

### Connection Errors

**Error**: "Invalid API key"
- **Solution**: Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

**Error**: "Connection refused"
- **Solution**: Verify your `DATABASE_URL` is correct and your Supabase project is active

### Row Level Security (RLS)

Supabase requires RLS policies for table access:

1. Go to Supabase Dashboard → Database → Tables
2. Click on your table
3. Go to "RLS Policies" tab
4. Enable RLS
5. Add policies for INSERT, SELECT, UPDATE, DELETE

Example policy for allowing all reads:

```sql
CREATE POLICY "Enable read access for all users"
ON public.your_table
FOR SELECT
USING (true);
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Security Best Practices

1. **Never expose service role keys** in client-side code
2. **Use RLS policies** to restrict data access
3. **Validate inputs** before database operations
4. **Use environment variables** for sensitive data
5. **Enable authentication** for protected routes
6. **Keep dependencies updated** regularly

## Support

For issues or questions:
1. Check [Supabase Documentation](https://supabase.com/docs)
2. Search [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Ask in [Supabase Discord](https://supabase.com/discord)