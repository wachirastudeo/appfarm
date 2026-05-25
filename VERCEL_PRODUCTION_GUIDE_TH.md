<!-- markdownlint-disable MD013 -->

# คู่มือ Deploy Vercel สำหรับใช้งานจริง

> อัปเดตล่าสุด: 2026-05-26

ใช้ checklist นี้สำหรับนำแอปขึ้น Vercel และใช้ Supabase เป็นฐานข้อมูลจริง

## 1. แผนการขึ้น Production

1. เตรียม Supabase project สำหรับ production และตรวจว่า schema ตรงกับ `supabase/appfarm_database_schema.sql`
2. Import Git repository เข้า Vercel และกำหนด production branch ที่ใช้ปล่อยงานจริง โดยทั่วไปคือ `main`
3. ใส่ environment variables สำหรับ production ใน Vercel ก่อน deploy ใช้งานจริง
4. ตั้งค่าโดเมน production และ Supabase Auth redirect URLs
5. ตรวจ health route, Google login, การแยกข้อมูลตามเจ้าของ, metadata URLs และ layout บนมือถือ
6. เตรียม Vercel deployment ก่อนหน้าและแผน backup ของ Supabase ไว้สำหรับ rollback

## 2. ก่อน Deploy

รันจาก root ของ repo:

```bash
git status
npm run lint
npm run build
```

ก่อนแก้ Supabase production:

- จด SQL หรือ setting ที่แก้ทุกครั้ง
- ตรวจว่ามี database backup/export ล่าสุดแล้ว
- ห้ามใส่ Supabase `service_role` key ใน Vercel frontend env vars
- ใช้ `NEXT_PUBLIC_APP_DATA_MODE=local` สำหรับทดสอบแบบ local เท่านั้น
- ใช้ `NEXT_PUBLIC_APP_DATA_MODE=supabase` สำหรับ Vercel production

เอกสารที่เกี่ยวข้องใน repo:

- ตั้งค่า database: `SUPABASE_SETUP_TH.md`
- schema หลัก: `supabase/appfarm_database_schema.sql`
- ตั้งค่า storage: `SUPABASE_STORAGE_TH.md`
- ตั้งค่า login: `API_LOGIN_SETUP_TH.md`

## 3. สร้าง Project ใน Vercel

1. เข้า Vercel แล้ว import Git repository นี้เป็น Next.js project
2. ตั้ง project root เป็น root ของ repository
3. ใช้คำสั่ง default ของโปรเจกต์ เว้นแต่ dashboard ต้องการให้ใส่เอง:

```text
Build Command: npm run build
Install Command: npm install
```

1. ใช้ preview deployments สำหรับ branch หรือ pull request
2. ปล่อย production โดย merge หรือ push commit ที่อนุมัติแล้วเข้า Vercel production branch

## 4. Environment Variables

### ใส่ตรงไหน

ใน Vercel:

1. เปิด Vercel project
2. ไปที่ `Settings` > `Environment Variables`
3. เพิ่มค่าด้านล่างใน environment `Production`
4. ถ้า preview deployments ต้องต่อ Supabase ให้เพิ่มค่าแยกใน environment `Preview`
5. หลังแก้ env vars ให้ redeploy เพื่อให้ build ใหม่ได้รับค่า env

ค่าบนเครื่อง local อยู่ใน `.env.local` ส่วน placeholder กลางอยู่ใน `.env.example` ห้าม commit secret จริง

### ค่าที่ production ต้องใช้

| Variable | ค่า production | ใช้ทำอะไร |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_DATA_MODE` | `supabase` | เปิดการบันทึกข้อมูลผ่าน Supabase แทน local browser-only data |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase `Project URL` | เชื่อม browser และ server auth client ไปยัง Supabase project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | public frontend key ที่แนะนำให้ใช้ |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR_DOMAIN` | ใช้สร้าง canonical, sitemap, robots และ metadata URLs |

ค่าที่แนะนำเมื่อเกี่ยวข้อง:

| Variable | ค่า production | หมายเหตุ |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `app-images` | โค้ดมี default เป็น `app-images` ใส่ให้ชัดเจนถ้า production ใช้ bucket นี้ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | legacy anon key | ใช้เฉพาะกรณี Supabase project ยังไม่มี publishable key |

ค่าเหล่านี้ยังไม่ต้องใส่ใน Vercel สำหรับ flow ปัจจุบัน เว้นแต่มีการแก้โค้ดให้ใช้งานภายหลัง:

| Variable | สถานะปัจจุบัน |
| --- | --- |
| `NEXTAUTH_URL` | flow ปัจจุบันใช้ Supabase Auth routes ไม่ใช่ NextAuth routes |
| `NEXTAUTH_SECRET` | โค้ดปัจจุบันไม่ได้อ่านค่านี้ |
| `GOOGLE_CLIENT_ID` | flow ปัจจุบันตั้งค่า Google provider ใน Supabase Auth |
| `GOOGLE_CLIENT_SECRET` | flow ปัจจุบันตั้งค่า Google provider ใน Supabase Auth |
| `LINE_CLIENT_ID` | LINE login ยังไม่ได้เชื่อมใน flow ปัจจุบัน |
| `LINE_CLIENT_SECRET` | LINE login ยังไม่ได้เชื่อมใน flow ปัจจุบัน |

ตัวอย่างค่า production:

```env
NEXT_PUBLIC_APP_DATA_MODE=supabase
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

## 5. ตั้งค่า Supabase สำหรับ Production

### Database

1. ใช้ `supabase/appfarm_database_schema.sql` เป็น schema สำหรับ production
2. ตรวจว่า Row Level Security และ owner policies ยังเปิดอยู่สำหรับตารางข้อมูลสวน
3. ตรวจ shared tables และ storage setup ให้ตรงกับคู่มือ Supabase เดิมก่อนให้ผู้ใช้จริงเขียนข้อมูล

### Auth URL Configuration

ใน Supabase:

1. ไปที่ `Authentication` > `URL Configuration`
2. ตั้ง `Site URL` เป็น production origin จริง:

```text
https://YOUR_DOMAIN
```

1. เพิ่ม redirect URLs แบบ exact:

```text
https://YOUR_DOMAIN/auth/callback
http://localhost:3000/auth/callback
```

1. เพิ่ม preview redirect URLs เฉพาะกรณี preview deployments ต้องใช้ Google login
2. สำหรับ production ให้ใช้ redirect URL แบบ exact

login component ปัจจุบันส่ง Google OAuth กลับมาที่:

```text
${window.location.origin}/auth/callback
```

### Google Login

1. ใน Supabase ไปที่ `Authentication` > `Providers` > `Google`
2. เปิด Google provider และใส่ Google OAuth client values ที่นั่น
3. copy Supabase Google callback URL ที่ Supabase แสดง ไปใส่ใน Google Cloud OAuth client ให้ตรงกัน
4. หลัง deploy ให้ทดสอบ login จาก production domain จริง ไม่ใช่ทดสอบเฉพาะ preview URL

## 6. Deploy Production ครั้งแรก

1. ใส่ Vercel production env vars ให้ครบ
2. Deploy production branch ที่อนุมัติแล้ว
3. ผูกโดเมนจริงใน Vercel
4. ตรวจว่า `NEXT_PUBLIC_SITE_URL` เป็นโดเมนสุดท้ายที่ใช้งานจริง
5. ถ้าเปลี่ยน `NEXT_PUBLIC_SITE_URL` หลัง deploy ครั้งแรก ให้ redeploy

## 7. Checklist ตรวจหลัง Deploy

ตรวจบน production deployment:

1. เปิด `/api/system/health`
2. ตรวจว่า JSON คืนค่า `ok: true`
3. ตรวจว่า `supabaseConfigured` เป็น `true`
4. เปิด `/robots.txt` และ `/sitemap.xml` แล้วตรวจว่าใช้ production domain จริง
5. login ด้วย Google และตรวจว่า browser กลับมาที่ `/auth/callback` แล้วเข้าแอปได้
6. สร้าง test plot/task/activity ที่ความเสี่ยงต่ำด้วย test user แล้ว refresh เพื่อตรวจว่าข้อมูลยังอยู่
7. ตรวจว่า user อีกคนอ่านข้อมูลสวนของเจ้าของคนนั้นไม่ได้
8. ตรวจ dashboard บนมือถือและ desktop โดยดู auth modal, navigation และข้อความทับกัน

## 8. Rollback

ถ้า production verification ไม่ผ่าน:

1. rollback หรือ promote deployment ก่อนหน้าที่ใช้งานได้ใน Vercel
2. คืนค่า Vercel production env เดิม ถ้าปัญหาเกิดจาก env change
3. คืนค่า Supabase Auth URL/provider เดิม ถ้าปัญหาเกิดจาก login
4. restore database เฉพาะกรณี database change ทำให้ข้อมูลเสีย โดยใช้ backup/export plan ที่เตรียมไว้ก่อน deploy
5. หลัง rollback ให้ตรวจ `/api/system/health`, Google login และ owner-data isolation อีกครั้ง

## 9. เอกสารอ้างอิง

- Vercel Git deployments: <https://vercel.com/docs/deployments/git>
- Vercel environment variables: <https://vercel.com/docs/environment-variables>
- Supabase redirect URLs: <https://supabase.com/docs/guides/auth/redirect-urls>
- Supabase Google login: <https://supabase.com/docs/guides/auth/social-login/auth-google>
- Supabase backups: <https://supabase.com/docs/guides/platform/backups>
