# แผนผัง Database Supabase

ไฟล์นี้ไว้ดูว่าใน Supabase ข้อมูลแต่ละส่วนของแอปอยู่ table ไหน

Project: `hpyoyjpqitpvgckxnlww`

## สรุปเร็ว

| ในแอป | Table ใน Supabase | จำนวนตอน backfill |
| --- | --- | ---: |
| Backup ข้อมูลทั้งก้อน | `app_data` | 1 |
| ผู้ใช้ | `profiles` | 3 |
| แปลงสวน | `plots` | 3 |
| ต้นทุเรียน | `trees` | 10 |
| รุ่นดอก/ผล | `batches` | 0 |
| ประวัติระยะดอก/ผล | `batch_stages` | 0 |
| บันทึกสวน/กิจกรรม | `activities` | 3 |
| งานที่ต้องทำ | `tasks` | 3 |
| รายรับรายจ่าย | `finance_records` | 5 |
| บทความ | `articles` | 7 |
| ปุ๋ยยา/สินค้าแนะนำ | `products` | 3 |
| ตั้งค่าเว็บ/ชื่อสวน | `site_settings` | 1 |

## Table แต่ละตัวเก็บอะไร

### `app_data`

เก็บข้อมูลทั้งแอปเป็น JSON ก้อนเดียว ใช้เป็น backup และ fallback

แอปยังบันทึก table นี้ไว้ เพื่อกันข้อมูลหายระหว่างย้ายจาก `localStorage` ไป table จริง

### `profiles`

เก็บข้อมูลผู้ใช้

ข้อมูลหลัก:

- `id`
- `name`
- `email`
- `role`
- `status`
- `provider`
- `password_hash`
- `avatar_url`

หมายเหตุ: Google Login ใช้ Supabase Auth แล้ว และ sync profile กลับมาที่ table นี้ โดย `id` ยังเป็น text ของแอป เช่น `u-google-*`

### `plots`

เก็บข้อมูลแปลงสวน

ข้อมูลหลัก:

- `id`
- `user_id`
- `name`
- `area`
- `notes`

ตัวอย่างในแอป: แปลง A, แปลง B, แปลง C

### `trees`

เก็บข้อมูลต้นทุเรียนในแต่ละแปลง

ข้อมูลหลัก:

- `id`
- `plot_id`
- `tree_number`
- `variety`
- `age`
- `stage`
- `health`
- `notes`
- `last_updated`

ความสัมพันธ์:

- `trees.plot_id` ชี้ไปที่ `plots.id`

### `batches`

เก็บรุ่นดอก/รุ่นผลของต้นทุเรียน

ข้อมูลหลัก:

- `id`
- `tree_id`
- `name`
- `fruit_count`
- `bloom_date`

ความสัมพันธ์:

- `batches.tree_id` ชี้ไปที่ `trees.id`

### `batch_stages`

เก็บประวัติระยะของแต่ละรุ่นดอก/ผล

ข้อมูลหลัก:

- `id`
- `batch_id`
- `stage`
- `date`
- `note`

ความสัมพันธ์:

- `batch_stages.batch_id` ชี้ไปที่ `batches.id`

### `activities`

เก็บบันทึกสวน/กิจกรรมที่ทำจริง

ข้อมูลหลัก:

- `id`
- `user_id`
- `plot_id`
- `tree_id`
- `activity_type`
- `description`
- `cost`
- `date`
- `created_at`

ตัวอย่างในแอป: ใส่ปุ๋ย, พ่นยา, รดน้ำ, ตัดแต่ง, เก็บเกี่ยว

### `tasks`

เก็บงานที่ต้องทำ

ข้อมูลหลัก:

- `id`
- `user_id`
- `plot_id`
- `title`
- `description`
- `status`
- `priority`
- `date`

ตัวอย่าง status:

- `pending`
- `done`
- `cancelled`

### `finance_records`

เก็บรายรับรายจ่าย

ข้อมูลหลัก:

- `id`
- `user_id`
- `plot_id`
- `type`
- `category`
- `amount`
- `description`
- `date`

ตัวอย่าง type:

- `income`
- `expense`

ตัวอย่าง category:

- `ขายผล`
- `ปุ๋ย`
- `ยา`
- `แรงงาน`
- `น้ำ/ไฟ`
- `อุปกรณ์`
- `ขนส่ง`
- `อื่นๆ`

### `articles`

เก็บบทความในหน้าองค์ความรู้

ข้อมูลหลัก:

- `id`
- `title`
- `category`
- `image`
- `content`
- `slug`
- `meta_title`
- `meta_description`
- `keywords`
- `status`
- `affiliate_title`
- `affiliate_url`

### `products`

เก็บปุ๋ยยา/สินค้าแนะนำ

ข้อมูลหลัก:

- `id`
- `name`
- `category`
- `image`
- `price_label`
- `description`
- `affiliate_url`
- `slug`
- `status`
- `brand_name`
- `sku`

### `site_settings`

เก็บการตั้งค่าเว็บ/ชื่อสวน

ข้อมูลหลัก:

- `id`
- `site_name`
- `tagline`
- `logo_url`

## Flow การทำงานของแอป

ถ้า `.env.local` ตั้งค่า:

```env
NEXT_PUBLIC_APP_DATA_MODE=supabase
```

แอปจะทำงานแบบนี้:

1. ก่อน login แอปยังใช้ guest view และข้อมูลสาธารณะ เช่น `articles`, `products`
2. หลัง login แอปโหลด `plots`, `trees`, `tasks`, `activities`, `finance_records` ตาม `user_id` ของผู้ใช้คนนั้น
3. เมื่อผู้ใช้เพิ่ม/แก้/ลบข้อมูลสวน แอปบันทึกกลับ table จริงพร้อม owner `user_id`
4. `app_data` ยังเป็น backup/fallback JSON สำหรับข้อมูลรวมเดิม แต่ flow หลัง login ใช้ structured tables ตามเจ้าของเป็นหลัก
5. `articles` และ `products` ใช้ table ของตัวเองเป็นข้อมูลรวมของเว็บ

## ความสัมพันธ์หลัก

```text
profiles
  └─ plots
      └─ trees
          └─ batches
              └─ batch_stages

profiles
  ├─ tasks
  ├─ activities
  └─ finance_records

articles
products
site_settings
app_data
```

## ไฟล์โค้ดที่เกี่ยวข้อง

- `supabase/appfarm_database_schema.sql` ไฟล์ schema หลักสำหรับสร้าง database/table ใน Supabase
- `lib/store.ts` hook หลักของข้อมูลทั้งแอป
- `lib/supabase/app-data.ts` โหลด/บันทึกข้อมูลหลักกับ Supabase
- `lib/supabase/articles.ts` โหลด/บันทึกบทความและสินค้า
- `lib/supabase/client.ts` สร้าง Supabase browser client
- `lib/runtime-config.ts` อ่านค่า env และ data mode
- `supabase/schema.sql` schema ตารางหลัก
- `supabase/setup.sql` schema `app_data`
- `supabase/articles_products.sql` schema `articles` และ `products`

## RLS และข้อมูลแยกตามผู้ใช้

ข้อมูลส่วนตัวของสวนถูกล็อกตามเจ้าของ:

- `plots`
- `trees`
- `batches`
- `batch_stages`
- `tasks`
- `activities`
- `finance_records`

policy ใน `supabase/appfarm_database_schema.sql` ใช้ `authenticated` และตรวจ owner ผ่าน `profiles.email = auth.jwt()->>'email'` เพื่อรองรับ id เดิมของแอปที่เป็น text

ข้อมูลรวมของเว็บยังเปิดรวม:

- `articles`
- `products`
- `site_settings`
- `app_data`

ข้อควรระวัง:

- ต้อง apply SQL policy ไป Supabase จริง ไม่ใช่แก้ไฟล์ใน repo อย่างเดียว
- อย่าใส่ `service_role key` ใน `NEXT_PUBLIC_` env หรือ frontend เด็ดขาด
- ถ้าเปลี่ยน `profiles.id` ไปใช้ `auth.uid()` ในอนาคต ต้อง migrate owner id ของตารางลูกให้ครบ
