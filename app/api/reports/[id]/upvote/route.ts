import { type NextRequest, NextResponse } from "next/server"
import { toggleUpvote } from "@/lib/reports"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 })
    }

    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const updatedReport = await toggleUpvote(reportId, userId)

    if (!updatedReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Upvote toggled successfully",
      report: updatedReport,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle upvote" }, { status: 500 })
  }
}
