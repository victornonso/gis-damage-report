// app/api/users/settings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { updateUserSettings } from "@/lib/users"

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.forbidden()

  const user = session.user as any
  const body = await request.json()
  const { lgaName, email, phone } = body

  if (!lgaName || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  // Extract first word as the LGA code, lowercase
  const lga = lgaName.split(" ")[0].toLowerCase()

  const ok = await updateUserSettings(
    String(user.id),
    { lga, email, phone }
  )

  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
  return NextResponse.json({ success: true, lga })
}
