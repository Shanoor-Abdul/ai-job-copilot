# Automated job collection

This pipeline collects published jobs from the official public Greenhouse Job Board API and Lever Postings API using the board/site identifiers configured on the app host. It does not access LinkedIn or scrape logged-in sites.

## 1. Apply the sync history migration

Run `supabase/migrations/20261022_job_sync_runs.sql` in Supabase SQL Editor. This adds operational history for each automated run. The sync endpoint remains operational if the migration has not been applied, but run history will not be stored.

## 2. Configure source identifiers on the app host

Set server-only environment variables:
- `GREENHOUSE_BOARD_TOKENS`: comma-separated Greenhouse board URL tokens.
- `LEVER_SITE_NAMES`: comma-separated Lever site names.
- `ASHBY_JOB_BOARD_NAMES`: comma-separated Ashby public job-board names (the slug from the employer Ashby-hosted job board URL).
- `JOB_SYNC_SECRET`: a long random secret used by the trusted scheduler.

Use actual public board/site identifiers. Never expose these secrets with a `NEXT_PUBLIC_` prefix.

## 3. Enable the GitHub Actions schedule

The workflow `.github/workflows/job-sync.yml` runs every six hours and supports manual dispatch.

In GitHub repository **Settings → Secrets and variables → Actions → New repository secret**, add:
- `JOB_COPILOT_APP_URL`: deployed app base URL, e.g. `https://your-domain.example`.
- `JOB_SYNC_SECRET`: exactly the same secret configured on the app host.

Then open **Actions → Automated job collection → Run workflow** to test it. GitHub Actions must be enabled. Scheduled runs use UTC and can be delayed during high load.

## 4. Verify a run

The workflow prints JSON with `status`, `fetched`, `upserted`, `failed`, per-board results, and timestamps. The unique key `source, source_board, external_id` makes repeated imports idempotent. Database writes are batched in groups of 100. A failed source is reported independently so another working source can still provide jobs.

## Run locally

```powershell
$headers = @{ Authorization = "Bearer $env:JOB_SYNC_SECRET" }
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/jobs/sync" -Headers $headers
```

Set `JOB_SYNC_SECRET` in your local environment before running. Never commit `.env.local`.

## Regional coverage and licensed data providers

Ashby is an additional public employer-by-employer feed. It does not enumerate all employers, so add only real board names for employers with relevant Saudi Arabia or UAE vacancies. Greenhouse, Lever, and Ashby public APIs return postings for configured employers; they are not global job-search indexes.

A licensed aggregator is not wired in yet because the vendor and credentials have not been selected. Before implementing one, choose a provider whose contract explicitly permits displaying and redistributing job listings to users in Saudi Arabia and the UAE, then implement its documented API. Keep API keys server-side. Do not scrape restricted portals or redistribute data outside the provider license.

## Current scope

- Published Greenhouse and Lever listings only.
- Scheduled ingestion every six hours plus manual trigger.
- Idempotent batched upserts and optional per-run operational history.
- No LinkedIn scraping or automatic applications.
- This version does not automatically deactivate jobs missing from a response; freshness-based expiry should be implemented separately with explicit safeguards against transient source failures.
