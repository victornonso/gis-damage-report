import { query } from "./db"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  role: "citizen" | "admin" | "super_admin"
  lga?: string
  ward?: string
  created_at: string
  updated_at: string
}

// Get user by email
export async function getUserByEmail(email: string) {
  const result = await query(
    `
    SELECT * FROM users WHERE email = $1
  `,
    [email],
  )

  return result.rows[0] as User | undefined
}

// Get user by ID
export async function getUserById(id: number) {
  const result = await query(
    `
    SELECT id, email, full_name, phone, role, lga, ward, created_at, updated_at 
    FROM users WHERE id = $1
  `,
    [id],
  )

  return result.rows[0] as User | undefined
}

// Create new user
export async function createUser(userData: {
  email: string
  full_name: string
  phone?: string
  password: string
  role?: string
  lga?: string
  ward?: string
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const result = await query(
    `
    INSERT INTO users (email, full_name, phone, password_hash, role, lga, ward)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, full_name, phone, role, lga, ward, created_at, updated_at
  `,
    [
      userData.email,
      userData.full_name,
      userData.phone,
      hashedPassword,
      userData.role || "citizen",
      userData.lga,
      userData.ward,
    ],
  )

  return result.rows[0] as User
}

// Verify user password
export async function verifyPassword(email: string, password: string) {
  const result = await query(
    `
    SELECT id, email, password_hash FROM users WHERE email = $1
  `,
    [email],
  )

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]
  const isValid = await bcrypt.compare(password, user.password_hash)

  if (isValid) {
    return await getUserById(user.id)
  }

  return null
}

// Get users by LGA (for admin)
export async function getUsersByLGA(lga: string) {
  const result = await query(
    `
    SELECT id, email, full_name, phone, role, ward, created_at
    FROM users 
    WHERE lga = $1 AND role = 'citizen'
    ORDER BY created_at DESC
  `,
    [lga],
  )

  return result.rows as User[]
}


export interface UserSettings {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  lga: string | null
  ward: string | null
  created_at: string
  updated_at: string
}


export async function updateUserSettings(
  id: string,
  fields: {
    lga: string
    email: string
    phone: string
  }
): Promise<boolean> {
  const res = await query(
    `
    UPDATE users
       SET lga   = $2,
           email = $3,
           phone = $4,
           updated_at = NOW()
     WHERE id = $1
  `,
    [id, fields.lga, fields.email, fields.phone]
  )
  return res.rowCount === 1
}