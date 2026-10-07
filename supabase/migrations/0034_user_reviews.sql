-- Student-submitted reviews, prompted after finishing a lesson's case
-- studies, an AI interview, or a Real World Practice level. Shown publicly
-- (merged into the landing page testimonials) only once an admin approves.

create table public.user_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  context_type text not null check (context_type in ('case_study', 'interview', 'practice_level')),
  context_label text,
  rating integer not null check (rating between 1 and 5),
  quote text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index user_reviews_status_created_at_idx on public.user_reviews (status, created_at desc);

alter table public.user_reviews enable row level security;

create policy "user_reviews_insert_own" on public.user_reviews
  for insert with check (user_id = auth.uid());
create policy "user_reviews_select_own_or_admin" on public.user_reviews
  for select using (user_id = auth.uid() or is_admin());
-- Approved reviews are public testimonial content — readable by anyone,
-- including logged-out visitors on the landing page.
create policy "user_reviews_select_approved_public" on public.user_reviews
  for select using (status = 'approved');
create policy "user_reviews_admin_update" on public.user_reviews
  for update using (is_admin()) with check (is_admin());
