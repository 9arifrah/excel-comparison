const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

const connectionString = 'postgresql://postgres:Rajawali_09@db.mqduhdbmcxxukzrfwtsw.supabase.co:5432/postgres'

async function createTable() {
  console.log('Connecting to database...')
  const client = postgres(connectionString)
  
  // Read SQL file
  const sqlFile = path.join(__dirname, '../drizzle/0000_sleepy_malcolm_colcord.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')
  
  console.log('Creating comparisons table...')
  
  try {
    await client.unsafe(sql)
    console.log('✓ Table created successfully!')
  } catch (error) {
    console.error('Error creating table:', error)
    process.exit(1)
  }
  
  await client.end()
}

createTable()