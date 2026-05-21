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

## 6. ตาราง database ที่ใช้อยู่จริง

Project ปัจจุบัน: `hpyoyjpqitpvgckxnlww`

ตารางใน `public`:

- `app_data` backup/fallback JSON ทั้งก้อน
- `profiles` ผู้ใช้ของระบบ local auth
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

1. ถ้า `NEXT_PUBLIC_APP_DATA_MODE=supabase` แอปจะโหลดข้อมูลจากตารางจริงก่อน
2. ถ้าตารางจริงยังไม่มีข้อมูล แอป fallback ไปอ่าน `app_data`
3. ทุกครั้งที่ข้อมูลเปลี่ยน แอปบันทึกทั้ง `app_data` และตารางจริง
4. บทความกับปุ๋ยยาใช้ `articles` / `products` เป็นตารางหลัก

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

สถานะปัจจุบัน: ใช้ policy แบบ prototype ให้ `anon` / `authenticated` อ่านเขียนได้ เพื่อให้เว็บที่ยังใช้ local auth sync ขึ้น Supabase ได้

ก่อน production จริงควรเปลี่ยนเป็น Supabase Auth หรือ server route แล้วค่อยล็อก policy ด้วย user/session จริง

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
