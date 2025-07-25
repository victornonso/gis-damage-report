import { NextResponse } from "next/server"
import { isDatabaseAvailable } from "@/lib/db"

export async function GET() {
  try {
    const dbStatus = await isDatabaseAvailable()

    return NextResponse.json({
      status: "ok",
      database: dbStatus ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
