-- ============================================================
-- AppFarm - Supabase Setup SQL
-- รันไฟล์นี้ใน: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- สร้าง table เก็บ app data แบบ JSON ทั้งก้อน
create table if not exists app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- เปิด Row Level Security
alter table app_data enable row level security;

-- Policy: อนุญาตให้ anon อ่าน/เขียนได้
-- (เพราะ app ยังใช้ local auth ไม่ใช่ Supabase Auth)
create policy "allow_all" on app_data
  for all
  using (true)
  with check (true);
