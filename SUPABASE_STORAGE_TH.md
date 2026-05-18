# คู่มือตั้งค่า Supabase Storage Free สำหรับรูปภาพ

ใช้เก็บรูป:

- โลโก้เว็บ
- รูปบทความ
- รูปสินค้า/ปุ๋ย/ยา
- รูปโปรไฟล์

## 1. สร้าง Bucket

ไปที่:

`Supabase Dashboard` > `Storage` > `New bucket`

ตั้งค่า:

```text
Bucket name: app-images
Public bucket: เปิดได้ ถ้าเป็นรูปบทความ/สินค้า/โลโก้
File size limit: 5MB หรือ 10MB
Allowed MIME types: image/png, image/jpeg, image/webp, image/avif
```

## 2. ตั้งค่า env

ใน `.env.local`

```env
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

บน server จริงให้ใส่ค่าเดียวกันใน Environment Variables

## 3. โครง path ที่แนะนำ

```text
logos/site-logo.avif
articles/article-id/image.avif
products/product-id/image.avif
avatars/user-id/avatar.avif
```

## 4. Public หรือ Private

แนะนำ:

- `Public`: logo, article images, product images
- `Private`: avatar หรือรูปที่ user อัปเองและไม่อยากให้เปิดสาธารณะ

เริ่มแรกใช้ `Public` ง่ายสุดสำหรับเว็บนี้

## 5. Policy สำหรับ Public bucket

ถ้า bucket เป็น public:

- อ่านรูปได้จาก public URL
- การ upload/delete ควรทำผ่าน server route เท่านั้น
- ห้ามปล่อยให้ frontend ใช้ `service_role key`

## 6. Verification

เช็ค:

1. เข้า `/api/system/health`
2. ต้องเห็น `supabaseStorageBucket: "app-images"`
3. อัปโหลดรูปผ่านระบบหลังบ้าน
4. เปิด URL รูปได้
5. Deploy แล้วรูปยังแสดง

## 7. Backup

ก่อนย้ายรูปจริง:

- เก็บรูปเดิมใน `public/images/` ไว้ก่อน
- อย่าลบ local images จนกว่า production แสดงรูปจาก Supabase ได้ครบ

## 8. Rollback

ถ้า Storage มีปัญหา:

1. กลับไปใช้รูปจาก `public/images/`
2. ตั้ง image URL ในหลังบ้านเป็น path เดิม เช่น `/images/articles/...avif`
3. ปิด upload Supabase ชั่วคราว

## สรุป

ใช้:

```env
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

และเก็บรูปฟรีใน Supabase Storage ก่อน พอเว็บโตค่อยพิจารณา Cloudinary หรือ paid storage
