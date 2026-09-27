-- A single admin-editable banner shown at the top of the public landing
-- page and the logged-in dashboard — e.g. "Next cohort starts Oct 1".
-- Deliberately a singleton (one fixed row, only ever updated) rather than
-- a list table like testimonials/jobs: there's only ever one current
-- banner, and the admin just edits its text and flips it on/off.

create table public.site_announcement (
  id boolean primary key default true check (id),
  message text not null default '',
  link_url text,
  link_label text,
  is_active boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_announcement (id) values (true);

alter table public.site_announcement enable row level security;

create policy "site_announcement_select_all" on public.site_announcement
  for select using (true);
create policy "site_announcement_admin_update" on public.site_announcement
  for update using (is_admin()) with check (is_admin());
