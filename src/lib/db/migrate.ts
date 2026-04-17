// DEPRECATED: Migrations are now managed via Supabase CLI.
// Use `supabase db push` to apply migrations from supabase/migrations/.
// This file is kept for reference only.

import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './index'

async function main() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  console.log('Migrations complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
