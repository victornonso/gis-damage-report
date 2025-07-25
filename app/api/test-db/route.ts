import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connection
    const result = await query("SELECT NOW() as current_time, version() as postgres_version")

    // Test if our tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'reports', 'categories')
      ORDER BY table_name
    `)

    // Test sample data
    const categoriesResult = await query("SELECT COUNT(*) as count FROM categories")
    const reportsResult = await query("SELECT COUNT(*) as count FROM reports")
    const usersResult = await query("SELECT COUNT(*) as count FROM users")

    return NextResponse.json({
      status: "success",
      connection: {
        time: result.rows[0].current_time,
        version: result.rows[0].postgres_version.split(" ")[0] + " " + result.rows[0].postgres_version.split(" ")[1],
      },
      tables: tablesResult.rows.map((row) => row.table_name),
      data: {
        categories: Number.parseInt(categoriesResult.rows[0].count),
        reports: Number.parseInt(reportsResult.rows[0].count),
        users: Number.parseInt(usersResult.rows[0].count),
      },
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Make sure DATABASE_URL is set and Supabase is accessible",
      },
      { status: 500 },
    )
  }
}
