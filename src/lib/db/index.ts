import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const isLocalhost = process.env.DATABASE_URL?.includes('localhost') ||
                    process.env.DATABASE_URL?.includes('127.0.0.1')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
})

export const db = drizzle(pool, { schema })
