# คู่มือตั้งค่า Supabase Free สำหรับเว็บจริง

ใช้ไฟล์นี้เป็น checklist ตอนสร้าง database จริงให้โปรเจกต์นี้

## 1. สมัครและสร้าง Project

ลิงก์:

- Supabase: https://supabase.com/
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

ขั้นตอน:

1. เข้า https://supabase.com/dashboard
2. Login ด้วย GitHub หรือ Email
3. กด `New project`
4. เลือก Organization
5. ตั้งชื่อ Project เช่น `durian-orchard`
6. ตั้ง Database Password แล้วเก็บไว้ให้ดี
7. เลือก Region ใกล้ผู้ใช้ เช่น `Southeast Asia`
8. กด Create project

## 2. ค่า API ที่ต้องเอามาใช้

ไปที่:

`Project Settings` > `API`

เก็บค่านี้:

- `Project URL`
- `anon public key`

ตัวอย่าง `.env.local`

```env
NEXT_PUBLIC_APP_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=replace-with-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

ห้ามใช้ `service_role key` ใน frontend เด็ดขาด

โหมดข้อมูล:

- ตอนทดลองในเครื่อง ใช้ `NEXT_PUBLIC_APP_DATA_MODE=local`
- ตอนต่อ Supabase/server จริง ใช้ `NEXT_PUBLIC_APP_DATA_MODE=supabase`
- เช็คสถานะได้ที่ `/api/system/health`
- ในหน้า Admin จะมีการ์ด `โหมดข้อมูล` บอกว่าใช้ local หรือ Supabase
- วิธีตั้งค่าเก็บรูปอยู่ใน `SUPABASE_STORAGE_TH.md`

## 3. ตั้งค่า Auth

ไปที่:

`Authentication` > `URL Configuration`

ตั้งค่า:

```text
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/**
https://YOUR_DOMAIN.com/**
```

ตอน deploy จริงให้เปลี่ยน `YOUR_DOMAIN.com` เป็นโดเมนจริง

## 4. เปิด Google Login

ไปที่:

`Authentication` > `Providers` > `Google`

เปิด Enable แล้วใส่:

- `Client ID`
- `Client Secret`

ค่า Google เอาจากคู่มือ:

`API_LOGIN_SETUP_TH.md`

Callback URL ที่ Supabase ให้มา ต้อง copy ไปใส่ใน Google Cloud Console ด้วย

## 5. เปิด LINE Login

Supabase ไม่มี LINE provider สำเร็จรูปแบบตรง ๆ ในบางโปรเจกต์

ทางเลือก:

1. ใช้ NextAuth จัดการ LINE แล้ว sync user เข้า Supabase
2. ใช้ Supabase Custom OAuth/OIDC ถ้า LINE config รองรับกับโปรเจกต์

แนะนำสำหรับโปรเจกต์นี้:

- ใช้ Supabase เป็น database
- ใช้ NextAuth สำหรับ Google + LINE login
- เก็บ user profile ลง Supabase table

ค่า LINE เอาจากคู่มือ:

`API_LOGIN_SETUP_TH.md`

## 6. ตาราง database ที่ควรมี

เริ่มจากตารางหลัก:

- `profiles`
- `plots`
- `trees`
- `activities`
- `tasks`
- `finance_records`
- `articles`
- `products`
- `site_settings`

## 7. SQL เริ่มต้น

ไปที่:

`SQL Editor` > `New query`

ตัวอย่างโครงสร้างเริ่มต้น:

```sql
create table profiles (
  id uuid primary key,
  email text,
  name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  area numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table trees (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  code text not null,
  variety text,
  age integer,
  health text,
  stage text,
  notes text,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plot_id uuid references plots(id) on delete set null,
  title text not null,
  date date not null,
  status text not null default 'pending',
  priority text not null default 'medium',
  created_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plot_id uuid references plots(id) on delete set null,
  tree_id uuid references trees(id) on delete set null,
  type text not null,
  description text not null,
  cost numeric default 0,
  date date not null,
  created_at timestamptz not null default now()
);

create table finance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plot_id uuid references plots(id) on delete set null,
  type text not null,
  category text not null,
  amount numeric not null,
  note text,
  date date not null,
  created_at timestamptz not null default now()
);
```

## 8. เปิด Row Level Security

สำคัญมาก ห้ามข้าม

```sql
alter table profiles enable row level security;
alter table plots enable row level security;
alter table trees enable row level security;
alter table tasks enable row level security;
alter table activities enable row level security;
alter table finance_records enable row level security;
```

ถ้าใช้ Supabase Auth ตรง ๆ ค่อยเพิ่ม policy ด้วย `auth.uid()`

ถ้าใช้ NextAuth ต้องออกแบบการเช็คสิทธิ์ผ่าน server route ก่อน

## 9. ติดตั้ง package

ใช้ npm ตามโปรเจกต์นี้:

```bash
npm install @supabase/supabase-js
```

## 10. ไฟล์ที่ต้องเพิ่มภายหลัง

แนะนำเพิ่ม:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `app/api/*` สำหรับเขียน/อ่านข้อมูลแบบปลอดภัย

อย่าเรียก database write สำคัญจาก frontend ตรง ๆ ถ้ายังไม่ได้ทำ RLS ให้ถูก

## 11. Verification

หลังตั้งค่าเสร็จต้องเช็ค:

1. `.env.local` มี `NEXT_PUBLIC_SUPABASE_URL`
2. `.env.local` มี `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Google login redirect กลับเว็บได้
4. LINE login redirect กลับเว็บได้
5. สร้าง plot แล้วข้อมูลเข้า Supabase
6. user คนหนึ่งมองไม่เห็นข้อมูลของอีก user

## 12. Backup

ก่อนแก้ database จริง:

```bash
git status
git diff
```

ใน Supabase:

- Export schema เก็บไว้
- อย่าแก้ production table โดยไม่จด SQL

## 13. Rollback

ถ้าตั้งค่าผิด:

1. ปิด provider login ที่มีปัญหา
2. กลับไปใช้ local login UI เดิมชั่วคราว
3. ลบ table/policy ที่ผิดจาก SQL Editor
4. คืน code จาก Git commit ล่าสุด

## สรุปที่แนะนำ

เริ่มฟรีด้วย:

- Supabase Free
- Next.js เดิม
- NextAuth สำหรับ Google + LINE
- Supabase Postgres เก็บข้อมูลจริง

พอเว็บมีคนใช้จริงค่อยอัปเป็น Supabase Pro
