// app/api/reports/lgas/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const { rows } = await query(`SELECT DISTINCT lga FROM reports ORDER BY lga`, []);
  return NextResponse.json(rows.map(r => r.lga));
}
