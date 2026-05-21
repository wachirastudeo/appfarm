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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

แนะนำใช้ `publishable key` สำหรับ frontend ตาม Supabase รุ่นใหม่ ถ้าโปรเจกต์ยังใช้ key แบบเดิมให้ใช้ `anon public key` ได้ ห้ามใช้ `service_role key` ใน frontend เด็ดขาด

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
http://localhost:3000/auth/callback
https://YOUR_DOMAIN.com/auth/callback
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

LINE Login ยังไม่ได้เชื่อมในโค้ดปัจจุบัน Supabase ไม่มี LINE provider สำเร็จรูปแบบตรง ๆ ในบางโปรเจกต์

ทางเลือก:

1. เพิ่ม route server แยกสำหรับ LINE แล้ว sync user เข้า Supabase
2. ใช้ Supabase Custom OAuth/OIDC ถ้า LINE config รองรับกับโปรเจกต์

แนวทางถ้าจะทำต่อ:

- ใช้ Supabase Auth Google ต่อไปตามเดิม
- เพิ่ม LINE ผ่าน Supabase Custom OAuth/OIDC หรือ route server แยก
- sync user profile ลง `profiles`

ค่า LINE เอาจากคู่มือ:

`API_LOGIN_SETUP_TH.md`

## 6. ตาราง database ที่ใช้อยู่จริง

Project ปัจจุบัน: `hpyoyjpqitpvgckxnlww`

ตารางใน `public`:

- `app_data` backup/fallback JSON ทั้งก้อน
- `profiles` ผู้ใช้จาก email/local เดิมและ Supabase Google Auth
- `plots` แปลงสวน
- `trees` ต้นทุเรียนในแต่ละแปลง
- `batches` รุ่นดอก/ผลของต้น
- `batch_stages` ประวัติ stage ของรุ่นดอก/ผล
- `activities` บันทึกสวน/กิจกรรม
- `tasks` งานที่ต้องทำ
- `finance_records` รายรับรายจ่าย
- `articles` บทความ
- `products` ปุ๋ยยา/สินค้าแนะนำ
- `site_settings` ตั้งค่าชื่อสวน/เว็บ

ข้อมูลที่ backfill ขึ้นแล้ว:

- `profiles`: 3
- `plots`: 3
- `trees`: 10
- `batches`: 0
- `batch_stages`: 0
- `activities`: 3
- `tasks`: 3
- `finance_records`: 5
- `articles`: 7
- `products`: 3
- `site_settings`: 1
- `app_data`: 1

Flow ปัจจุบัน:

1. ถ้า `NEXT_PUBLIC_APP_DATA_MODE=supabase` แอปจะตรวจ Supabase Auth session ก่อน
2. เมื่อ login แล้ว แอปโหลด `plots`, `trees`, `tasks`, `activities`, `finance_records` ตาม `user_id` ของผู้ใช้คนนั้น
3. ข้อมูลที่ผู้ใช้เพิ่มใหม่จะบันทึกพร้อม `user_id`
4. `app_data` ยังเป็น backup/fallback JSON สำหรับข้อมูลรวมเดิม แต่ข้อมูลสวนหลักหลัง login ใช้ตารางจริงตามเจ้าของ
5. บทความกับปุ๋ยยาใช้ `articles` / `products` เป็นตารางหลักและยังอ่านได้รวม

## 7. SQL เริ่มต้น

ไปที่:

`SQL Editor` > `New query`

ใช้ไฟล์ SQL ใน repo แทนการ copy ตัวอย่างเอง:

- `supabase/appfarm_database_schema.sql` ไฟล์ schema หลักสำหรับสร้างทุก table ของแอป
- `supabase/setup.sql` สร้าง `app_data`
- `supabase/articles_products.sql` สร้าง `articles` และ `products`
- `supabase/schema.sql` สร้างตารางหลักทั้งหมด

หมายเหตุ: schema จริงใช้ `id text` เพื่อให้เข้ากับ id เดิมในแอป เช่น `p1`, `t1`, `tk1` ไม่ใช่ `uuid`

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

สถานะปัจจุบัน:

- `plots`, `trees`, `batches`, `batch_stages`, `tasks`, `activities`, `finance_records` ใช้ owner-only policy สำหรับ `authenticated`
- owner เชื่อมผ่าน `profiles.email = auth.jwt()->>'email'` เพื่อรองรับ id เดิมของแอปที่เป็น text เช่น `u-google-*`
- `articles`, `products`, `site_settings` ยังเป็นข้อมูลรวมของเว็บ
- ต้อง apply SQL จาก `supabase/appfarm_database_schema.sql` ไปที่ Supabase จริงหลังแก้ schema

## 9. ติดตั้ง package

ใช้ npm ตามโปรเจกต์นี้:

```bash
npm install @supabase/supabase-js @supabase/ssr
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
4. Refresh แล้วไม่กระพริบกลับไปหน้า login
5. สร้าง plot แล้วข้อมูลเข้า Supabase พร้อม `user_id`
6. user คนหนึ่งมองไม่เห็น `plots`, `tasks`, `activities` ของอีก user

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
- Supabase Auth สำหรับ Google Login
- LINE Login ค่อยเพิ่มผ่าน Custom OAuth/OIDC หรือ route server แยก
- Supabase Postgres เก็บข้อมูลจริง

พอเว็บมีคนใช้จริงค่อยอัปเป็น Supabase Pro
