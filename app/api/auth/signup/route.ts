// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, createUser } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone } = await request.json()

    // Reject duplicate
    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Create user with default role 'citizen'
    const user = await createUser({ email, password, full_name, phone })
    return NextResponse.json({ message: "Account created", user }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    )
  }
}
