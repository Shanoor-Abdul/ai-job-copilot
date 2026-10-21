alter table public.profiles
  add column if not exists tech_stack text[] not null default '{}'::text[];

comment on column public.profiles.tech_stack is
  'User-selected technologies used to personalize job discovery and matching.';
