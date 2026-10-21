# Supabase setup

1. Open the Supabase SQL Editor for your project.
2. If you have not already done so, run `supabase/schema.sql` once.
3. Run `supabase/migrations/20261021_private_resume_storage.sql` to create the private `resumes` bucket and user-scoped Storage policies.
4. Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
5. In Supabase Authentication settings, configure the site URL for your local development URL and production URL. If email confirmation is enabled, users must confirm their email before signing in.

The resume API requires a valid Supabase session. Files are limited to PDF/DOCX and 5 MB, are stored under a folder matching the authenticated user ID, and are served through short-lived signed URLs. Never expose the service-role key in browser code.
