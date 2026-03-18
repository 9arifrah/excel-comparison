# OAuth Provider Setup Guide

This guide walks you through setting up Google and GitHub OAuth providers for your Supabase project.

## Project Information

- **Supabase Project**: 9arifrah's Project
- **Project URL**: https://mqduhdbmcxxukzrfwtsw.supabase.co
- **Region**: ap-southeast-1 (Singapore)
- **OAuth Callback URL**: `https://mqduhdbmcxxukzrfwtsw.supabase.co/auth/v1/callback`

## Important Redirect URLs

You need to configure these redirect URLs in both Supabase Dashboard and your OAuth provider consoles:

### For Local Development
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth-callback`

### For Production (when deployed)
- Site URL: `https://your-production-domain.com`
- Redirect URLs: `https://your-production-domain.com/auth-callback`

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Step 2: Configure OAuth Consent Screen

1. Click **External** and click **Create**
2. Fill in the required information:
   - **App name**: Excel Comparison
   - **User support email**: Your email
   - **Developer contact**: Your email
3. Click **Save and Continue** (you can skip scopes for now)
4. Click **Save and Continue** (skip test users)
5. Click **Back to Dashboard**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth 2.0 Client ID**
3. Select **Web application**
4. Configure:
   - **Name**: Excel Comparison Supabase
   - **Authorized redirect URIs**:
     ```
     https://mqduhdbmcxxukzrfwtsw.supabase.co/auth/v1/callback
     ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 4: Add Google Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **9arifrah's Project**
3. Navigate to **Authentication** > **Providers** > **Google**
4. Toggle **Enable** to ON
5. Paste your **Client ID** and **Client Secret**
6. Click **Save**

---

## GitHub OAuth Setup

### Step 1: Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the form:
   - **Application name**: Excel Comparison
   - **Homepage URL**: `http://localhost:3000` (use production URL when deployed)
   - **Authorization callback URL**:
     ```
     https://mqduhdbmcxxukzrfwtsw.supabase.co/auth/v1/callback
     ```
4. Click **Register application**

### Step 2: Generate Client Secret

1. After registering, click **Generate a new client secret**
2. Copy the **Client ID** and **Client Secret**

### Step 3: Add GitHub Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** > **Providers** > **GitHub**
3. Toggle **Enable** to ON
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

## Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000` (local) or production URL
   - **Redirect URLs** (add these):
     - `http://localhost:3000/auth-callback`
     - `http://localhost:3000/**` (for wildcard support in dev)
3. Click **Save**

---

## Update .env.local

Add the OAuth credentials to your `.env.local` file:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret
```

---

## Test the OAuth Flow

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. You should be redirected to the login page

4. Click "Continue with Google" or "Continue with GitHub"

5. Complete the OAuth flow

6. After successful login, you should be redirected back to the app with the user menu showing your account

---

## Troubleshooting

### "Redirect URL not allowed" error

**Solution**: Make sure the redirect URL is added in:
1. Supabase Dashboard > Authentication > URL Configuration
2. Google Cloud Console > OAuth 2.0 Client ID > Authorized redirect URIs
3. GitHub OAuth App > Authorization callback URL

### "Provider not enabled" error

**Solution**: Enable the provider in Supabase Dashboard > Authentication > Providers

### "Invalid OAuth state" error

**Solution**: Clear your browser cookies and try again

### Local development with OAuth

OAuth providers require HTTPS in production. For local development:
- Use `http://localhost:3000` - most providers allow this
- If you have issues, use a tunneling service like ngrok:
  ```bash
  ngrok http 3000
  ```
  Then use the ngrok HTTPS URL in your OAuth provider configuration

---

## Production Deployment

When deploying to production:

1. Update OAuth provider redirect URLs to include your production domain
2. Add production redirect URLs in Supabase Dashboard
3. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Update Site URL in Supabase to your production URL

---

## Security Best Practices

1. **Never commit OAuth secrets** to version control
2. **Use environment variables** for all sensitive credentials
3. **Enable PKCE** for mobile apps (Supabase handles this automatically)
4. **Set appropriate scopes** - only request what you need
5. **Monitor OAuth usage** in your provider dashboards
6. **Rotate secrets periodically**

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
