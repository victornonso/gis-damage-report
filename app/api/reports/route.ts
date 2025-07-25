// app/api/reports/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getReports, createReport } from "@/lib/reports"
import { getCategoryBySlug } from "@/lib/categories"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      lga: searchParams.get("lga") || undefined, 
      ward: searchParams.get("ward") || undefined,
      search: searchParams.get("search") || undefined,
      limit: Number.parseInt(searchParams.get("limit") || "50"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
    }

    const { reports, total } = await getReports(filters)
    return NextResponse.json({ reports, total })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, location, ward, street, urgency, user_id } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, or category" },
        { status: 400 }
      )
    }

    const categoryData = await getCategoryBySlug(category)
    if (!categoryData) {
      return NextResponse.json({ error: "Invalid category slug" }, { status: 400 })
    }

    const reportData = {
      title,
      description,
      category_id: categoryData.id,
      urgency: urgency || "medium",
      latitude: location?.lat,
      longitude: location?.lng,
      ward: ward || "",
      lga: body.lga || "Ikeja",
      street: street || "",
      landmark: body.landmark || "",
      user_id: user_id || null,
      photo_url: body.photo_url || null,
    }

    const newReport = await createReport(reportData)
    return NextResponse.json(
      { message: "Report submitted successfully", report: newReport },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create report" },
      { status: 500 }
    )
  }
}
