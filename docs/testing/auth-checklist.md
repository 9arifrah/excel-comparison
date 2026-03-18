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
