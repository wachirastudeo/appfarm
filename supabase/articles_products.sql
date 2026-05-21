-- ============================================================
-- AppFarm - Articles & Products Tables
-- รันไฟล์นี้ใน: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---- Articles ----
create table if not exists articles (
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

alter table articles enable row level security;

create policy "articles_allow_all" on articles
  for all using (true) with check (true);

-- ---- Products ----
create table if not exists products (
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

alter table products enable row level security;

create policy "products_allow_all" on products
  for all using (true) with check (true);
