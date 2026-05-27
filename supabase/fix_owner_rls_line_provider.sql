-- Fix owner-scoped RLS policies for email-less OAuth providers such as LINE.
-- Run in Supabase SQL Editor for project hpyoyjpqitpvgckxnlww.

create or replace function public.current_profile_email_matches(profile_email text)
returns boolean
language sql
stable
as $$
  select
    lower(profile_email) = lower(auth.jwt() ->> 'email')
    or lower(profile_email) = 'line-' || auth.uid()::text || '@oauth.local'
    or lower(profile_email) = replace(lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', 'oauth')), 'custom:', '') || '-' || auth.uid()::text || '@oauth.local';
$$;

drop policy if exists profiles_owner on public.profiles;
drop policy if exists plots_owner on public.plots;
drop policy if exists trees_owner on public.trees;
drop policy if exists batches_owner on public.batches;
drop policy if exists batch_stages_owner on public.batch_stages;
drop policy if exists tasks_owner on public.tasks;
drop policy if exists activities_owner on public.activities;
drop policy if exists finance_records_owner on public.finance_records;

create policy profiles_owner on public.profiles for all to authenticated
  using (public.current_profile_email_matches(email))
  with check (public.current_profile_email_matches(email));

create policy plots_owner on public.plots for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = plots.user_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = plots.user_id and public.current_profile_email_matches(p.email)
  ));

create policy trees_owner on public.trees for all to authenticated
  using (exists (
    select 1 from public.plots pl
    join public.profiles p on p.id = pl.user_id
    where pl.id = trees.plot_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.plots pl
    join public.profiles p on p.id = pl.user_id
    where pl.id = trees.plot_id and public.current_profile_email_matches(p.email)
  ));

create policy batches_owner on public.batches for all to authenticated
  using (exists (
    select 1 from public.trees tr
    join public.plots pl on pl.id = tr.plot_id
    join public.profiles p on p.id = pl.user_id
    where tr.id = batches.tree_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.trees tr
    join public.plots pl on pl.id = tr.plot_id
    join public.profiles p on p.id = pl.user_id
    where tr.id = batches.tree_id and public.current_profile_email_matches(p.email)
  ));

create policy batch_stages_owner on public.batch_stages for all to authenticated
  using (exists (
    select 1 from public.batches b
    join public.trees tr on tr.id = b.tree_id
    join public.plots pl on pl.id = tr.plot_id
    join public.profiles p on p.id = pl.user_id
    where b.id = batch_stages.batch_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.batches b
    join public.trees tr on tr.id = b.tree_id
    join public.plots pl on pl.id = tr.plot_id
    join public.profiles p on p.id = pl.user_id
    where b.id = batch_stages.batch_id and public.current_profile_email_matches(p.email)
  ));

create policy tasks_owner on public.tasks for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = tasks.user_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = tasks.user_id and public.current_profile_email_matches(p.email)
  ));

create policy activities_owner on public.activities for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = activities.user_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = activities.user_id and public.current_profile_email_matches(p.email)
  ));

create policy finance_records_owner on public.finance_records for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = finance_records.user_id and public.current_profile_email_matches(p.email)
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = finance_records.user_id and public.current_profile_email_matches(p.email)
  ));
