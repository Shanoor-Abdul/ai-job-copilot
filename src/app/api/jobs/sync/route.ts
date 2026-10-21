import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGreenhouse, fetchLever } from "@/lib/jobs/connectors";
import type { NormalizedJob } from "@/lib/jobs/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = process.env.JOB_SYNC_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const greenhouseBoards = (process.env.GREENHOUSE_BOARD_TOKENS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const leverSites = (process.env.LEVER_SITE_NAMES || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!greenhouseBoards.length && !leverSites.length) {
    return NextResponse.json({ error: "No sources configured. Set GREENHOUSE_BOARD_TOKENS or LEVER_SITE_NAMES." }, { status: 400 });
  }

  const results: Array<{ source: string; board: string; fetched: number; error?: string }> = [];
  const normalized: NormalizedJob[] = [];

  for (const board of greenhouseBoards) {
    try {
      const rows = await fetchGreenhouse(board);
      normalized.push(...rows);
      results.push({ source: "greenhouse", board, fetched: rows.length });
    } catch (error) {
      results.push({ source: "greenhouse", board, fetched: 0, error: error instanceof Error ? error.message : "Fetch failed" });
    }
  }
  for (const site of leverSites) {
    try {
      const rows = await fetchLever(site);
      normalized.push(...rows);
      results.push({ source: "lever", board: site, fetched: rows.length });
    } catch (error) {
      results.push({ source: "lever", board: site, fetched: 0, error: error instanceof Error ? error.message : "Fetch failed" });
    }
  }

  if (!normalized.length) {
    return NextResponse.json({ imported: 0, results, warning: "No jobs fetched. Check board identifiers and source availability." }, { status: 200 });
  }

  try {
    const supabase = createAdminClient();
    let imported = 0;
    let failed = 0;
    // Keep requests bounded and make each row idempotent through the database unique key.
    for (const job of normalized) {
      const row = {
        source: job.source, source_board: job.sourceBoard, external_id: job.externalId,
        company_name: job.companyName, title: job.title, location_text: job.locationText,
        city: job.city, country: job.country, workplace_type: job.workplaceType,
        description: job.description, apply_url: job.applyUrl, published_at: job.publishedAt,
        source_updated_at: job.sourceUpdatedAt, last_seen_at: new Date().toISOString(),
        is_active: job.isActive, content_hash: job.contentHash
      };
      const { error } = await supabase.from("jobs").upsert(row, { onConflict: "source,source_board,external_id" });
      if (error) failed++; else imported++;
    }
    return NextResponse.json({ imported, failed, fetched: normalized.length, results, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Could not write to database. Check Supabase configuration and schema." }, { status: 503 });
  }
}
