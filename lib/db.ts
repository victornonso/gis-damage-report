import { Pool } from "pg"

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  : null

export { pool }

// Database query helper with error handling
export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error("Database not configured. Please set DATABASE_URL environment variable.")
  }

  try {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    return res
  } catch (error) {
    throw error
  }
}

// Get database client for transactions
export async function getClient() {
  if (!pool) {
    throw new Error("Database not configured. Please set DATABASE_URL environment variable.")
  }

  const client = await pool.connect()
  return client
}

// Check if database is available
export async function isDatabaseAvailable() {
  if (!pool) return false

  try {
    await pool.query("SELECT 1")
    return true
  } catch (error) {
    return false
  }
}
