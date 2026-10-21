-- Operational history for automated Greenhouse + Lever ingestion.
create table if not exists public.job_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  upserted_count integer not null default 0 check (upserted_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  source_results jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists job_sync_runs_started_at_idx on public.job_sync_runs (started_at desc);
alter table public.job_sync_runs enable row level security;
-- Only server-side service role accesses this operational table; no end-user policies.
