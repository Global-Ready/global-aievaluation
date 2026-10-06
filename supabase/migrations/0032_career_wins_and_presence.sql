-- Students self-report interviews/projects they secured from their dashboard.
create table public.career_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('interview', 'project')),
  company text,
  note text,
  created_at timestamptz not null default now()
);

create index career_wins_created_at_idx on public.career_wins (created_at desc);

alter table public.career_wins enable row level security;

create policy "career_wins_insert_own" on public.career_wins
  for insert with check (user_id = auth.uid());
create policy "career_wins_select_own_or_admin" on public.career_wins
  for select using (user_id = auth.uid() or is_admin());

-- One row per browser session, refreshed by a heartbeat. "Live viewers" is
-- the count of rows seen in the last few minutes. Written by the server only.
create table public.active_sessions (
  session_id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  device text,
  last_seen timestamptz not null default now()
);

create index active_sessions_last_seen_idx on public.active_sessions (last_seen desc);

alter table public.active_sessions enable row level security;

create policy "active_sessions_admin_select" on public.active_sessions
  for select using (is_admin());
