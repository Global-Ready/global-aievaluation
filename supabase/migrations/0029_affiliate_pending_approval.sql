-- The affiliate program is no longer self-serve: becomeAffiliate() now
-- inserts a request as 'pending' instead of activating instantly, and an
-- admin must approve it (flip to 'active') before the referral link/code
-- is treated as live. Rejecting a request sets it to 'disabled' — kept as
-- a record rather than deleted, consistent with the Affiliate Program
-- Terms' record-keeping requirement.

alter table public.affiliates
  drop constraint if exists affiliates_status_check;
alter table public.affiliates
  add constraint affiliates_status_check
  check (status in ('pending', 'active', 'disabled'));

alter table public.affiliates
  alter column status set default 'pending';
