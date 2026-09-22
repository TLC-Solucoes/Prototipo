import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não definida')
  process.exit(1)
}

const sql = neon(url)
const statements = readFileSync('db/schema.sql', 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`aplicados ${statements.length} comandos`)
