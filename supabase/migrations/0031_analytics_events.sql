-- Lightweight event log for the admin weekly-metrics dashboard. Written
-- only by the server (service role, which bypasses RLS) — no client
-- inserts. Admins can read it.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null,
  user_id uuid references public.profiles(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_event_created_at_idx
  on public.analytics_events (event, created_at desc);

alter table public.analytics_events enable row level security;

create policy "analytics_events_admin_select" on public.analytics_events
  for select using (is_admin());
