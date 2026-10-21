import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGreenhouse, fetchLever } from "@/lib/jobs/connectors";
import type { NormalizedJob } from "@/lib/jobs/types";

export const runtime = "nodejs";
export const maxDuration = 60;
type SourceResult = { source: "greenhouse" | "lever"; board: string; fetched: number; error?: string };

export async function POST(request: NextRequest) {
  const secret = process.env.JOB_SYNC_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const greenhouseBoards = (process.env.GREENHOUSE_BOARD_TOKENS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const leverSites = (process.env.LEVER_SITE_NAMES || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!greenhouseBoards.length && !leverSites.length) {
    return NextResponse.json({ error: "No sources configured. Set GREENHOUSE_BOARD_TOKENS or LEVER_SITE_NAMES." }, { status: 400 });
  }

  const startedAt = new Date().toISOString();
  const results: SourceResult[] = [];
  const normalized: NormalizedJob[] = [];
  let runId: string | null = null;
  let supabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    supabase = createAdminClient();
    const { data } = await supabase.from("job_sync_runs").insert({ started_at: startedAt, status: "running", source_results: [] }).select("id").single();
    runId = data?.id ?? null;
  } catch {
    // Keep ingestion operational if the run-history migration has not been applied yet.
  }

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

  const fetched = normalized.length;
  let upserted = 0;
  let failed = 0;
  let databaseError: string | null = null;
  if (fetched) {
    try {
      supabase ??= createAdminClient();
      const rows = normalized.map((job) => ({
        source: job.source, source_board: job.sourceBoard, external_id: job.externalId,
        company_name: job.companyName, title: job.title, location_text: job.locationText,
        city: job.city, country: job.country, workplace_type: job.workplaceType,
        description: job.description, apply_url: job.applyUrl, published_at: job.publishedAt,
        source_updated_at: job.sourceUpdatedAt, last_seen_at: new Date().toISOString(),
        is_active: job.isActive, content_hash: job.contentHash,
      }));
      for (let offset = 0; offset < rows.length; offset += 100) {
        const batch = rows.slice(offset, offset + 100);
        const { error } = await supabase.from("jobs").upsert(batch, { onConflict: "source,source_board,external_id" });
        if (error) failed += batch.length;
        else upserted += batch.length;
      }
    } catch {
      databaseError = "Could not write to database. Check Supabase configuration and schema.";
      failed = fetched - upserted;
    }
  }

  const sourceFailures = results.filter((item) => item.error).length;
  const status = databaseError ? "failed" : sourceFailures === results.length ? "failed" : sourceFailures > 0 || failed > 0 ? "partial" : "success";
  const completedAt = new Date().toISOString();
  const summary = { runId, status, fetched, upserted, failed, results, startedAt, syncedAt: completedAt, ...(databaseError ? { error: databaseError } : {}) };
  if (runId && supabase) {
    try {
      await supabase.from("job_sync_runs").update({
        completed_at: completedAt, status, fetched_count: fetched, upserted_count: upserted,
        failed_count: failed, source_results: results, error_message: databaseError,
      }).eq("id", runId);
    } catch {
      // A history write failure should not conceal the ingestion result.
    }
  }
  if (databaseError) return NextResponse.json(summary, { status: 503 });
  if (fetched === 0 && sourceFailures > 0) return NextResponse.json(summary, { status: 502 });
  return NextResponse.json(summary);
}
