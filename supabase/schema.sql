create extension if not exists pgcrypto;

create type public.job_source as enum ('greenhouse', 'lever', 'company_career', 'other');
create type public.application_status as enum ('saved', 'ready_for_review', 'approved', 'submitted', 'interview', 'rejected', 'withdrawn', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  home_city text not null default 'Riyadh',
  preferred_cities text[] not null default array['Riyadh','Jeddah','Dammam'],
  preferred_titles text[] not null default array['Frontend Developer','Senior Frontend Developer','React Developer','Next.js Developer','UI Engineer'],
  skills text[] not null default array['React','TypeScript','JavaScript','Next.js','Tailwind CSS','HTML','CSS'],
  years_experience numeric(4,1),
  work_mode text[] not null default array['hybrid','onsite','remote'],
  resume_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  source public.job_source not null,
  source_board text,
  external_id text not null,
  company_name text not null,
  title text not null,
  location_text text,
  city text,
  country text,
  workplace_type text,
  description text,
  apply_url text not null,
  published_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source, source_board, external_id)
);

create index jobs_active_published_idx on public.jobs (is_active, published_at desc nulls last);
create index jobs_city_idx on public.jobs (city);
create index jobs_source_idx on public.jobs (source);

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  reasons text[] not null default '{}',
  missing_skills text[] not null default '{}',
  calculated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status public.application_status not null default 'saved',
  tailored_resume_path text,
  cover_letter text,
  screening_answers jsonb not null default '{}',
  user_approved_at timestamptz,
  submitted_at timestamptz,
  external_application_id text,
  notes text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

create table public.application_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;
alter table public.applications enable row level security;
alter table public.application_audit_log enable row level security;

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Jobs are globally readable to authenticated users; only server-side service role writes ingestion rows.
create policy "authenticated users read jobs" on public.jobs for select to authenticated using (true);

create policy "users read own matches" on public.job_matches for select using (auth.uid() = user_id);
create policy "users manage own matches" on public.job_matches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own audit log" on public.application_audit_log for select using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications
for each row execute function public.set_updated_at();
