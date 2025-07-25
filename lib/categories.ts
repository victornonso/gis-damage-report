import { query } from "./db"

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  created_at: string
}

// Get all categories
export async function getCategories() {
  const result = await query(`
    SELECT * FROM categories 
    ORDER BY name ASC
  `)

  return result.rows as Category[]
}

// Get category by slug
export async function getCategoryBySlug(slug: string) {
  const result = await query(
    `
    SELECT * FROM categories WHERE slug = $1
  `,
    [slug],
  )

  return result.rows[0] as Category | undefined
}

// Get category by ID
export async function getCategoryById(id: number) {
  const result = await query(
    `
    SELECT * FROM categories WHERE id = $1
  `,
    [id],
  )

  return result.rows[0] as Category | undefined
}
