-- A stable reference (lesson id, or "domain:level" for practice levels) to
-- look reviews up by, separate from context_label which is just display
-- text. Lets "reviews for this lesson" be an exact match instead of a
-- fragile title-string comparison.
alter table public.user_reviews
  add column context_ref text;

create index user_reviews_context_ref_idx on public.user_reviews (context_type, context_ref);
