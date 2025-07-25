import { query, isDatabaseAvailable } from "./db"

// Mock data for when database is not available
const mockReports = [
  {
    id: 1,
    title: "Large pothole on Lagos-Ibadan Expressway",
    description: "Deep pothole causing vehicle damage near Berger bus stop",
    category: "roads",
    category_name: "Roads & Potholes",
    category_slug: "roads",
    category_color: "#ef4444",
    status: "submitted",
    urgency: "high",
    latitude: 6.5244,
    longitude: 3.3792,
    ward: "Ojodu",
    lga: "Ikeja",
    street: "Lagos-Ibadan Expressway",
    landmark: "Near Berger Bus Stop",
    user_id: 1,
    assigned_to: null,
    photo_url: null,
    upvotes: 23,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    resolved_at: null,
    reported_by: "Adebayo O.",
  },
  {
    id: 2,
    title: "Broken street light on Allen Avenue",
    description: "Street light has been out for 2 weeks, creating safety concerns",
    category: "streetlights",
    category_name: "Street Lighting",
    category_slug: "streetlights",
    category_color: "#f59e0b",
    status: "in-progress",
    urgency: "medium",
    latitude: 6.5355,
    longitude: 3.3087,
    ward: "Allen",
    lga: "Ikeja",
    street: "Allen Avenue",
    landmark: "Opposite UBA Bank",
    user_id: 2,
    assigned_to: "Public Works Dept",
    photo_url: null,
    upvotes: 15,
    created_at: "2024-01-12T10:00:00Z",
    updated_at: "2024-01-18T10:00:00Z",
    resolved_at: null,
    reported_by: "Fatima A.",
  },
  {
    id: 3,
    title: "Blocked drainage causing flooding",
    description: "Drainage system blocked with debris, water overflowing during rain",
    category: "drainage",
    category_name: "Drainage & Flooding",
    category_slug: "drainage",
    category_color: "#3b82f6",
    status: "resolved",
    urgency: "high",
    latitude: 6.4474,
    longitude: 3.3903,
    ward: "Victoria Island",
    lga: "Lagos Island",
    street: "Ahmadu Bello Way",
    landmark: "Near Silverbird Galleria",
    user_id: 3,
    assigned_to: "Environmental Dept",
    photo_url: null,
    upvotes: 8,
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
    resolved_at: "2024-01-20T10:00:00Z",
    reported_by: "Chidi N.",
  },
]

const mockStats = {
  total_reports: "156",
  submitted: "45",
  in_progress: "23",
  resolved: "88",
  this_month: "34",
}

export interface Report {
  id: number
  title: string
  description: string
  category: string
  status: "submitted" | "in-progress" | "resolved" | "rejected"
  urgency: "low" | "medium" | "high" | "critical"
  latitude?: number
  longitude?: number
  ward?: string
  lga?: string
  street?: string
  landmark?: string
  user_id?: number
  assigned_to?: string
  photo_url?: string
  upvotes: number
  created_at: string
  updated_at: string
  resolved_at?: string
  reported_by?: string
}

export interface ReportWithCategory extends Report {
  category_name: string
  category_slug: string
  category_color: string
  lastUpdate?: string
  reportedAt?: string
}

// Get all reports with optional filters
export async function getReports(
  filters: ReportFilters = {}): Promise<{ reports: ReportWithCategory[]; total: number }> {
  const {
    status,
    category,
    lga,
    ward,
    search,
    limit = 50,
    offset = 0,
  } = filters

  const dbAvailable = await isDatabaseAvailable()
  if (!dbAvailable) {

    // Apply mock filters
    let all = mockReports.slice()
    if (status && status !== "all")      all = all.filter(r => r.status === status)
    if (category && category !== "all")  all = all.filter(r => r.category_slug === category)
    if (lga && lga !== "all") {
      const want = lga.toLowerCase()
      all = all.filter(r => r.lga?.toLowerCase() === want)
    }
    if (ward && ward !== "all") {
      const want = ward.toLowerCase()
      all = all.filter(r => r.ward?.toLowerCase() === want)
    }
    if (search) {
      const q = search.toLowerCase()
      all = all.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    }

    const total = all.length
    const page = all.slice(offset, offset + limit)
    return { reports: page as any, total }
  }

  // Build WHERE clause for real DB
  let where = "WHERE 1=1"
  const params: any[] = []
  let idx = 0

  if (status && status !== "all") {
    idx++; where += ` AND r.status = $${idx}`; params.push(status)
  }
  if (category && category !== "all") {
    idx++; where += ` AND c.slug = $${idx}`; params.push(category)
  }
  if (lga && lga !== "all") {
    idx++; where += ` AND LOWER(r.lga) = LOWER($${idx})`; params.push(lga)
  }
  if (ward && ward !== "all") {
    idx++; where += ` AND LOWER(r.ward) = LOWER($${idx})`; params.push(ward)
  }
  if (search) {
    idx++
    where += ` AND (r.title ILIKE $${idx} OR r.description ILIKE $${idx})`
    params.push(`%${search}%`)
  }

  // 1) total count
  const countSQL = `
    SELECT COUNT(*) AS cnt
    FROM reports r
    LEFT JOIN categories c ON r.category_id = c.id
    ${where}
  `
  const countRes = await query(countSQL, params)
  const total = Number(countRes.rows[0].cnt)

  // 2) fetch page
  const pageSQL = `
    SELECT
      r.*,
      c.name      AS category_name,
      c.slug      AS category_slug,
      c.color     AS category_color,
      u.full_name AS reported_by,
      TO_CHAR(
          (r.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos',
          'FMMonth DD, YYYY HH12:MI AM'
        ) AS "reportedAt",

      -- grab latest update for each report:

            -- scalar subqueries for latest update
      (
        SELECT ru.message
        FROM report_updates ru
        WHERE ru.report_id = r.id
        ORDER BY ru.created_at DESC
        LIMIT 1
      ) AS "lastUpdate",
      (
        SELECT ru.created_at
        FROM report_updates ru
        WHERE ru.report_id = r.id
        ORDER BY ru.created_at DESC
        LIMIT 1
      ) AS "update_reportedAt"

      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u       ON r.user_id     = u.id

    ${where}
    ORDER BY r.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `
  const pageParams = [...params, limit, offset]

  let pageRes
  try {
    pageRes = await query(pageSQL, pageParams)
  } catch (err) {

  }

  return {
    reports: pageRes.rows as ReportWithCategory[],
    total,
  }
}

// Get single report by ID
export async function getReportById(id: number) {
  const dbAvailable = await isDatabaseAvailable()

  if (!dbAvailable) {
    return mockReports.find((r) => r.id === id)
  }

  const result = await query(
    `
    SELECT
      r.*,
      c.name      AS category_name,
      c.slug      AS category_slug,
      c.color     AS category_color,
      u.full_name AS reported_by
    FROM reports r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN users u       ON r.user_id     = u.id
    WHERE r.id = $1
  `,
    [id],
  )

  return result.rows[0] as ReportWithCategory | undefined
}

// Create new report
export async function createReport(reportData: {
  title: string
  description: string
  category_id: number
  urgency: string
  latitude?: number
  longitude?: number
  ward?: string
  lga?: string
  street?: string
  landmark?: string
  user_id?: number
  photo_url?: string
}) {
  const result = await query(
    `
    INSERT INTO reports (
      title, description, category_id, urgency,
      latitude, longitude, ward, lga, street, landmark,
      user_id, photo_url
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8, $9, $10,
      $11, $12
    )
    RETURNING *
  `,
    [
      reportData.title,
      reportData.description,
      reportData.category_id,
      reportData.urgency,
      reportData.latitude,
      reportData.longitude,
      reportData.ward,
      reportData.lga,
      reportData.street,
      reportData.landmark,
      reportData.user_id,
      reportData.photo_url,
    ],
  )

  return result.rows[0] as Report
}

// Update report status
export async function updateReportStatus(
  reportId: number,
  status: string,
  message?: string,
  updatedBy?: number,
  assignedTo?: string,
) {
  await query("BEGIN", [])
  try {
    await query(
      `
      UPDATE reports 
      SET status = $1,
          assigned_to = $2,
          updated_at = CURRENT_TIMESTAMP
          ${status === "resolved" ? ", resolved_at = CURRENT_TIMESTAMP" : ""}
      WHERE id = $3
    `,
      [status, assignedTo, reportId],
    )

    await query(
      `
      INSERT INTO report_updates (
        report_id, status, message, updated_by
      ) VALUES ($1, $2, $3, $4)
    `,
      [reportId, status, message, updatedBy],
    )

    await query("COMMIT", [])
    return await getReportById(reportId)
  } catch (error) {
    await query("ROLLBACK", [])
    throw error
  }
}

// Get report updates/history
export async function getReportUpdates(reportId: number) {
  const result = await query(
    `
    SELECT
      ru.*,
      u.full_name AS updated_by_name
    FROM report_updates ru
    LEFT JOIN users u ON ru.updated_by = u.id
    WHERE ru.report_id = $1
    ORDER BY ru.created_at DESC
  `,
    [reportId],
  )

  return result.rows
}

// Toggle upvote
export async function toggleUpvote(reportId: number, userId: number) {
  await query("BEGIN", [])
  try {
    const existingUpvote = await query(
      `SELECT id FROM upvotes WHERE report_id = $1 AND user_id = $2`,
      [reportId, userId],
    )

    if (existingUpvote.rows.length > 0) {
      await query(
        `DELETE FROM upvotes WHERE report_id = $1 AND user_id = $2`,
        [reportId, userId],
      )
      await query(`UPDATE reports SET upvotes = upvotes - 1 WHERE id = $1`, [reportId])
    } else {
      await query(
        `INSERT INTO upvotes (report_id, user_id) VALUES ($1, $2)`,
        [reportId, userId],
      )
      await query(`UPDATE reports SET upvotes = upvotes + 1 WHERE id = $1`, [reportId])
    }

    await query("COMMIT", [])
    return await getReportById(reportId)
  } catch (error) {
    await query("ROLLBACK", [])
    throw error
  }
}

// Get dashboard statistics
export async function getDashboardStats(lga?: string) {
  const dbAvailable = await isDatabaseAvailable()
  if (!dbAvailable) {
    return mockStats
  }

  let whereClause = ""
  const params: any[] = []
  if (lga) {
    whereClause = "WHERE LOWER(lga) = LOWER($1)"
    params.push(lga)
  }

  const result = await query(
    `
    SELECT
      COUNT(*) AS total_reports,
      COUNT(*) FILTER (WHERE status = 'submitted')   AS submitted,
      COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
      COUNT(*) FILTER (WHERE status = 'resolved')    AS resolved,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS this_month
    FROM reports
    ${whereClause}
  `,
    params,
  )

  return result.rows[0]
}
