-- ============================================================
-- AppFarm Database Schema
-- File type: .sql
-- Use in: Supabase Dashboard > SQL Editor > New query
-- ============================================================
--
-- This file creates all tables used by the app.
-- Current IDs are text because the app already uses IDs like p1, t1, tk1.
--
-- Safety:
-- - This script uses create table if not exists, so it will not drop existing data.
-- - RLS is enabled.
-- - Policies below are prototype policies for the current local-auth app.
-- - Before production, replace these allow-all policies with Supabase Auth or server-side writes.

-- ---- Backup / fallback JSON data ----
create table if not exists public.app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---- Users ----
create table if not exists public.profiles (
  id text primary key,
  email text unique,
  name text,
  avatar_url text,
  role text not null default 'user',
  status text not null default 'active',
  provider text not null default 'email',
  password_hash text,
  created_at timestamptz not null default now()
);

-- ---- Orchard plots ----
create table if not exists public.plots (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  name text not null,
  area numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- ---- Trees ----
create table if not exists public.trees (
  id text primary key,
  plot_id text not null references public.plots(id) on delete cascade,
  tree_number text not null,
  variety text,
  age integer,
  stage text,
  health text,
  notes text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---- Flower / fruit batches ----
create table if not exists public.batches (
  id text primary key,
  tree_id text not null references public.trees(id) on delete cascade,
  name text not null,
  fruit_count integer not null default 0,
  bloom_date date,
  created_at timestamptz not null default now()
);

-- ---- Batch stage history ----
create table if not exists public.batch_stages (
  id text primary key,
  batch_id text not null references public.batches(id) on delete cascade,
  stage text not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---- Tasks ----
create table if not exists public.tasks (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  plot_id text references public.plots(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  date date not null,
  created_at timestamptz not null default now()
);

-- ---- Activity logs ----
create table if not exists public.activities (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  plot_id text references public.plots(id) on delete set null,
  tree_id text references public.trees(id) on delete set null,
  activity_type text not null,
  description text not null,
  cost numeric default 0,
  date date not null,
  created_at timestamptz not null default now()
);

-- ---- Finance records ----
create table if not exists public.finance_records (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  plot_id text references public.plots(id) on delete set null,
  type text not null,
  category text not null,
  amount numeric not null,
  description text,
  date date not null,
  created_at timestamptz not null default now()
);

-- ---- Articles ----
create table if not exists public.articles (
  id text primary key,
  title text not null,
  category text not null default '',
  image text not null default '',
  image_alt text,
  content text not null default '',
  slug text,
  meta_title text,
  meta_description text,
  keywords text,
  geo_summary text,
  author_name text,
  affiliate_title text,
  affiliate_url text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- Products / fertilizer / chemicals ----
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default '',
  image text not null default '',
  image_alt text,
  price_label text not null default '',
  description text not null default '',
  affiliate_url text not null default '',
  slug text,
  meta_title text,
  meta_description text,
  keywords text,
  geo_summary text,
  brand_name text,
  sku text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- Site settings ----
create table if not exists public.site_settings (
  id text primary key default 'default',
  site_name text not null default 'สวนทุเรียน',
  tagline text not null default 'Smart Orchard',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- Enable RLS ----
alter table public.app_data enable row level security;
alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.trees enable row level security;
alter table public.batches enable row level security;
alter table public.batch_stages enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.finance_records enable row level security;
alter table public.articles enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

-- ---- Prototype policies ----
-- These are for the current app while it still uses local auth.
-- Replace before production.
drop policy if exists app_data_allow_all on public.app_data;
drop policy if exists profiles_all on public.profiles;
drop policy if exists plots_all on public.plots;
drop policy if exists trees_all on public.trees;
drop policy if exists batches_all on public.batches;
drop policy if exists batch_stages_all on public.batch_stages;
drop policy if exists tasks_all on public.tasks;
drop policy if exists activities_all on public.activities;
drop policy if exists finance_records_all on public.finance_records;
drop policy if exists articles_all on public.articles;
drop policy if exists products_all on public.products;
drop policy if exists site_settings_all on public.site_settings;

create policy app_data_allow_all on public.app_data for all to anon, authenticated using (true) with check (true);
create policy profiles_all on public.profiles for all to anon, authenticated using (true) with check (true);
create policy plots_all on public.plots for all to anon, authenticated using (true) with check (true);
create policy trees_all on public.trees for all to anon, authenticated using (true) with check (true);
create policy batches_all on public.batches for all to anon, authenticated using (true) with check (true);
create policy batch_stages_all on public.batch_stages for all to anon, authenticated using (true) with check (true);
create policy tasks_all on public.tasks for all to anon, authenticated using (true) with check (true);
create policy activities_all on public.activities for all to anon, authenticated using (true) with check (true);
create policy finance_records_all on public.finance_records for all to anon, authenticated using (true) with check (true);
create policy articles_all on public.articles for all to anon, authenticated using (true) with check (true);
create policy products_all on public.products for all to anon, authenticated using (true) with check (true);
create policy site_settings_all on public.site_settings for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
