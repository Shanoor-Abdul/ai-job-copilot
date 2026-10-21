# Saudi Job Copilot

Personal job discovery and application-preparation MVP for Saudi Arabia, initially focused on Riyadh and frontend / React / Next.js roles.

## Included

- Premium responsive dashboard with real empty states (no invented live jobs)
- Supabase PostgreSQL schema with row-level security
- Email/password sign-in and registration using Supabase Auth
- Private PDF/DOCX resume upload, replacement, download via short-lived signed URL, and deletion
- Resume file-size and file-signature checks (5 MB maximum)
- Greenhouse and Lever public job-board connectors
- Secure server-only scheduled sync endpoint protected by `JOB_SYNC_SECRET`
- Job deduplication by source + external job ID
- Job search API and dashboard search/filtering
- Initial application tracker schema
- Job match scoring heuristic for frontend stack relevance and Saudi location
- Application workflow designed for human review before submission

## Not included yet

- No LinkedIn scraping or unauthorized browser automation
- No fabricated job listings
- No automatic application submission in this starter. A connector must be explicitly supported, reviewed, and approved before submission is enabled.
- No AI-generated resume tailoring until you configure an AI provider and add prompt/output validation.

## Setup

1. Install Node.js 20+ and a package manager.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql` once.
4. Run `supabase/migrations/20261021_private_resume_storage.sql` in the Supabase SQL Editor.
5. Copy `.env.example` to `.env.local` and fill in Supabase URL, anon key, service role key, and a strong sync secret.
6. In Supabase Authentication settings, configure the local site URL (usually `http://localhost:3000`) and production URL. If email confirmation is enabled, confirm the account before signing in.
7. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

8. Open `http://localhost:3000`. Select **Create account** in the career profile section, register, sign in, and upload your resume.

The public job dashboard can render without credentials, but account and database-backed features require valid Supabase settings. Do not commit `.env.local`.

## Configure job sources

Set `GREENHOUSE_BOARD_TOKENS` and/or `LEVER_SITE_NAMES` to identifiers for company boards that you are authorized to query. Separate identifiers with commas. Use official public job board endpoints; respect each source's terms and rate limits.

- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`
- Lever: `https://api.lever.co/v0/postings/{site}?mode=json`

A sync is triggered by:

```bash
curl -X POST http://localhost:3000/api/jobs/sync \
  -H "Authorization: Bearer YOUR_JOB_SYNC_SECRET"
```

For production, invoke this endpoint from a trusted scheduler (e.g. GitHub Actions cron or your hosting scheduler). Never expose the sync secret to browser code. Consider moving ingestion to a dedicated worker if source count or volume grows.

## API

- `GET /api/jobs?q=react&city=Riyadh&source=greenhouse`
- `POST /api/jobs/sync` with `Authorization: Bearer <JOB_SYNC_SECRET>`
- `GET /api/profile/resume` — authenticated resume metadata and a 60-second signed download URL
- `POST /api/profile/resume` — authenticated multipart upload using the `file` field
- `DELETE /api/profile/resume` — delete the authenticated user's saved resume

## Security notes

- The service role key is server-only and bypasses RLS. Do not prefix it with `NEXT_PUBLIC_`.
- Do not commit `.env.local`.
- Resume files are private. API routes validate the current user session and only operate on paths inside that user's storage folder.
- Before enabling any application automation, add an explicit per-application approval record, supported-platform policy checks, duplicate-submit protection, audit logs, and a final user confirmation for consequential actions.
- Confirm local labor eligibility and work authorization requirements yourself; the app must not infer eligibility from location alone.
