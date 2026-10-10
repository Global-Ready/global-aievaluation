-- Admin-authored blog, shown publicly (including to logged-out visitors on
-- the landing page). id doubles as the URL slug, same convention as
-- modules/lessons/jobs/testimonials (admin-typed text primary key).

create table public.blog_posts (
  id text primary key,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  category text,
  read_minutes integer,
  author_name text,
  author_role text,
  author_avatar_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts (is_published, published_at desc);

alter table public.blog_posts enable row level security;

create policy "blog_posts_select_published_public" on public.blog_posts
  for select using (is_published = true);
create policy "blog_posts_admin_all" on public.blog_posts
  for all using (is_admin()) with check (is_admin());

-- Cover images, uploaded by the admin form.
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

create policy "blog_media_public_read" on storage.objects
  for select using (bucket_id = 'blog-media');
create policy "blog_media_admin_insert" on storage.objects
  for insert with check (bucket_id = 'blog-media' and is_admin());
create policy "blog_media_admin_update" on storage.objects
  for update using (bucket_id = 'blog-media' and is_admin());
create policy "blog_media_admin_delete" on storage.objects
  for delete using (bucket_id = 'blog-media' and is_admin());
