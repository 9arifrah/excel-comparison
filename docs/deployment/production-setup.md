# Production Environment Setup

This document outlines the steps required to configure Supabase Authentication for production deployment.

## Prerequisites

- Supabase project created and configured
- OAuth providers enabled (Google, GitHub)
- Database schema updated with userId field
- Row Level Security (RLS) policies configured

## Environment Variables

Add the following environment variables to your hosting platform (Vercel, Netlify, etc.):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (configured in Supabase Dashboard)
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
```

## Supabase Dashboard Configuration

### 1. Authentication > URL Configuration

Set the following in your Supabase Dashboard:

- **Site URL**: Your production URL (e.g., `https://your-app.vercel.app`)
- **Redirect URLs**: Add `https://your-app.vercel.app/auth-callback`

### 2. Authentication > Providers

#### Google OAuth

1. Go to Google Cloud Console
2. Update authorized redirect URIs to include production URL:
   - `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret to Supabase Dashboard

#### GitHub OAuth

1. Go to GitHub > Settings > Developer settings > OAuth Apps
2. Update Homepage URL and Authorization callback URL to production URLs
3. Copy Client ID and Secret to Supabase Dashboard

### 3. Database Changes

Run the following SQL in Supabase SQL Editor (see `docs/database/manual-changes.sql`):

1. Create first-user detection function
2. Create trigger on auth.users table
3. Enable RLS policies
4. Enforce NOT NULL constraint on userId (after verification)

### 4. Email Provider (Optional)

If using email/password authentication:

1. Go to Authentication > Providers > Email
2. Enable Email provider
3. Configure email templates
4. Set up SMTP or use Supabase's built-in email service

## Deployment Steps

1. **Set environment variables** in your hosting platform
2. **Configure OAuth providers** in both Supabase and provider consoles
3. **Run database migrations** via Supabase SQL Editor
4. **Deploy your application** (Vercel, Netlify, etc.)
5. **Test authentication flow** in production
6. **Verify RLS policies** are working correctly

## Post-Deployment Verification

After deployment, verify:

- [ ] Unauthenticated users are redirected to login
- [ ] OAuth login flow works (Google, GitHub)
- [ ] Users can only see their own data
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] API routes return 401 without authentication

## Troubleshooting

### OAuth Redirect Errors

If OAuth fails with redirect errors:

1. Verify redirect URLs match exactly in both Supabase and OAuth provider
2. Check that environment variables are set correctly in production
3. Ensure Site URL in Supabase matches your production URL

### RLS Policy Issues

If users can't see their data:

1. Verify RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename = 'comparisons'`
2. Check that userId is being set correctly in API routes
3. Test queries with auth.uid() in Supabase SQL Editor

### First User Migration Not Working

If existing data isn't assigned to first user:

1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_first_user_signup'`
2. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'assign_comparisons_to_first_user'`
3. Check auth.users table for new user after signup
