-- Visitor's country (ISO 3166-1 alpha-2, e.g. "US"), captured from Vercel's
-- edge geo header on each visit while logged in (see app/page.tsx). Already
-- covered by the privacy policy's disclosed "Country or general location"
-- collection. Country-only — no region/city.
alter table public.profiles add column country text;
