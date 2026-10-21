import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 120);
  const location = (searchParams.get("location") || searchParams.get("city") || "").trim().slice(0, 80);
  const source = searchParams.get("source");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  try {
    const supabase = createAdminClient();
    let query = supabase.from("jobs").select("*").eq("is_active", true).order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
    if (q) { const term = q.replace(/[%(),]/g, ""); query = query.or(`title.ilike.%${term}%,company_name.ilike.%${term}%,description.ilike.%${term}%`); }
    if (location) { const place = location.replace(/[%(),]/g, ""); query = query.or(`location_text.ilike.%${place}%,country.ilike.%${place}%,city.ilike.%${place}%`); }
    if (source && ["greenhouse", "lever", "company_career", "other"].includes(source)) query = query.eq("source", source);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: "Job storage is not configured. Check server environment variables and run the Supabase schema." }, { status: 503 });
  }
}
