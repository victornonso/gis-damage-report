import { type NextRequest, NextResponse } from "next/server"
import { getReportById, updateReportStatus, getReportUpdates } from "@/lib/reports"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = Number.parseInt(params.id)

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 })
    }

    const report = await getReportById(reportId)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Get report updates/history
    const updates = await getReportUpdates(reportId)

    return NextResponse.json({
      report: {
        ...report,
        updates,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 })
    }

    const { status, message, assigned_to, updatedBy } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const updatedReport = await updateReportStatus(
      reportId,
      status,
      message,
      updatedBy, // In production, get from auth session
      assigned_to,
    )

    if (!updatedReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Report updated successfully",
      report: updatedReport,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}
