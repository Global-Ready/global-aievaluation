-- Proof screenshots for reported wins. Private bucket: students write only
-- into their own folder, and only admins (or the owner) can read.

insert into storage.buckets (id, name, public)
values ('career-win-proofs', 'career-win-proofs', false)
on conflict (id) do nothing;

create policy "career_win_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'career-win-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "career_win_proofs_owner_or_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'career-win-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

alter table public.career_wins
  add column screenshot_path text;
