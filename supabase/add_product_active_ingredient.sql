-- Run once in Supabase SQL Editor for an existing AppFarm database.
alter table public.products
  add column if not exists active_ingredient text;
