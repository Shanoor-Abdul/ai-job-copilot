import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 120);
  const city = (searchParams.get("city") || "").trim().slice(0, 80);
  const source = searchParams.get("source");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  try {
    const supabase = createAdminClient();
    let query = supabase.from("jobs").select("*").eq("is_active", true).order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
    if (q) query = query.or(`title.ilike.%${q.replace(/[%(),]/g, "")}%,company_name.ilike.%${q.replace(/[%(),]/g, "")}%`);
    if (city) query = query.ilike("location_text", `%${city}%`);
    if (source && ["greenhouse", "lever", "company_career", "other"].includes(source)) query = query.eq("source", source);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: "Job storage is not configured. Check server environment variables and run the Supabase schema." }, { status: 503 });
  }
}
