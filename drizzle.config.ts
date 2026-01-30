import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:Rajawali_09@db.mqduhdbmcxxukzrfwtsw.supabase.co:5432/postgres',
  },
})
