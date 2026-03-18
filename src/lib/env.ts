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
