-- Drop old single-row table if not needed
-- drop table if exists public.app_data;

-- 1. Profiles Table
create table if not exists public.profiles (
  id text primary key,
  email text unique,
  name text,
  avatar_url text,
  cover_image text,
  cover_position_x numeric,
  cover_position_y numeric,
  farm_name text,
  farm_location jsonb,
  saved_article_ids text[],
  role text not null default 'user',
  status text not null default 'active',
  provider text not null default 'email',
  password_hash text,
  created_at timestamptz not null default now()
);

-- Keep existing profile tables able to persist orchard map selections.
alter table public.profiles
  add column if not exists farm_location jsonb;

-- 2. Plots Table
create table if not exists public.plots (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  name text not null,
  area numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- 3. Trees Table
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

-- 4. Batches Table
create table if not exists public.batches (
  id text primary key,
  tree_id text not null references public.trees(id) on delete cascade,
  name text not null,
  fruit_count integer not null default 0,
  bloom_date date,
  created_at timestamptz not null default now()
);

-- 5. Batch Stages Table
create table if not exists public.batch_stages (
  id text primary key,
  batch_id text not null references public.batches(id) on delete cascade,
  stage text not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- 6. Tasks Table
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

-- 7. Activities Table
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

-- 8. Finance Records Table
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

-- 9. Articles Table
create table if not exists public.articles (
  id text primary key,
  title text not null,
  category text,
  image text,
  image_alt text,
  content text,
  slug text,
  meta_title text,
  meta_description text,
  keywords text,
  geo_summary text,
  author_name text,
  affiliate_title text,
  affiliate_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Products Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text,
  image text,
  image_alt text,
  price_label text,
  description text,
  affiliate_url text,
  slug text,
  meta_title text,
  meta_description text,
  keywords text,
  geo_summary text,
  brand_name text,
  sku text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Site Settings Table
create table if not exists public.site_settings (
  id text primary key default 'default',
  site_name text not null default 'DurianFlow',
  tagline text not null default 'Smart Orchard',
  logo_url text,
  google_verification text,
  google_analytics text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure existing table site_settings has SEO columns
alter table public.site_settings
  add column if not exists google_verification text,
  add column if not exists google_analytics text;

-- Enable Row Level Security (RLS) on all tables
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

-- Owner-scoped orchard and profile policies
create policy profiles_owner on public.profiles for all to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));
create policy plots_owner on public.plots for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = plots.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.profiles p where p.id = plots.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy trees_owner on public.trees for all to authenticated
  using (exists (select 1 from public.plots pl join public.profiles p on p.id = pl.user_id where pl.id = trees.plot_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.plots pl join public.profiles p on p.id = pl.user_id where pl.id = trees.plot_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy batches_owner on public.batches for all to authenticated
  using (exists (select 1 from public.trees tr join public.plots pl on pl.id = tr.plot_id join public.profiles p on p.id = pl.user_id where tr.id = batches.tree_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.trees tr join public.plots pl on pl.id = tr.plot_id join public.profiles p on p.id = pl.user_id where tr.id = batches.tree_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy batch_stages_owner on public.batch_stages for all to authenticated
  using (exists (select 1 from public.batches b join public.trees tr on tr.id = b.tree_id join public.plots pl on pl.id = tr.plot_id join public.profiles p on p.id = pl.user_id where b.id = batch_stages.batch_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.batches b join public.trees tr on tr.id = b.tree_id join public.plots pl on pl.id = tr.plot_id join public.profiles p on p.id = pl.user_id where b.id = batch_stages.batch_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy tasks_owner on public.tasks for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = tasks.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.profiles p where p.id = tasks.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy activities_owner on public.activities for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = activities.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.profiles p where p.id = activities.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
create policy finance_records_owner on public.finance_records for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = finance_records.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.profiles p where p.id = finance_records.user_id and lower(p.email) = lower(auth.jwt() ->> 'email')));
-- Shared content
create policy articles_all on public.articles for all to anon, authenticated using (true) with check (true);
create policy products_all on public.products for all to anon, authenticated using (true) with check (true);
create policy site_settings_all on public.site_settings for all to anon, authenticated using (true) with check (true);
