# คู่มือขอ API สำหรับ Google Login และ LINE Login

ไฟล์นี้ใช้เป็น checklist สำหรับไปขอ `Client ID`, `Client Secret`, `Channel ID`, และ `Channel Secret` เพื่อเชื่อม login จริงกับแอปนี้

## สถานะปัจจุบันของโปรเจกต์

- Google Login เชื่อมผ่าน Supabase Auth แล้ว
- หน้า login ใช้ `components/AuthModal.tsx` เรียก `supabase.auth.signInWithOAuth({ provider: "google" })`
- Frontend ใช้ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` เป็น public key หลัก และรองรับ `NEXT_PUBLIC_SUPABASE_ANON_KEY` เป็น legacy fallback
- Callback route ของแอปคือ:
  - Local: `http://localhost:3000/auth/callback`
  - Production: `https://YOUR_DOMAIN.com/auth/callback`
- Supabase OAuth callback ที่ต้องใส่ใน Google Cloud Console คือ:
  - `https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback`
- LINE Login ยังไม่ได้เชื่อมในโค้ด production flow

## สิ่งที่ต้องเตรียม

- ชื่อแอป: ใช้ชื่อเดียวกับเว็บ เช่น `สวนทุเรียน`
- โดเมนจริง เช่น `https://your-domain.com`
- อีเมลผู้ดูแลระบบ
- Privacy Policy URL
- Terms of Service URL
- โลโก้แอป ถ้ามี

## Google Login

ลิงก์หลัก:

- Google Cloud Console: https://console.cloud.google.com/
- OAuth setup docs: https://support.google.com/googleapi/answer/6158849
- OAuth consent screen docs: https://developers.google.com/workspace/guides/configure-oauth-consent

ขั้นตอน:

1. เข้า Google Cloud Console
2. สร้าง Project ใหม่ หรือเลือก Project เดิม
3. ไปที่ `APIs & Services` > `OAuth consent screen`
4. ตั้งค่า app name, support email, developer contact email
5. เลือก user type:
   - `External` ถ้าให้คนทั่วไป login
   - `Internal` ถ้าใช้ในองค์กร Google Workspace เท่านั้น
6. เพิ่ม scopes พื้นฐาน:
   - `openid`
   - `email`
   - `profile`
7. ไปที่ `APIs & Services` > `Credentials`
8. กด `Create Credentials` > `OAuth client ID`
9. เลือก Application type เป็น `Web application`
10. ใส่ Authorized redirect URIs:
    - `https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback`
11. เก็บค่า:
    - `Client ID`
    - `Client Secret`
12. เอา `Client ID` และ `Client Secret` ไปใส่ที่ Supabase Dashboard > `Authentication` > `Sign In / Providers` > `Google`

## LINE Login

ลิงก์หลัก:

- LINE Developers Console: https://developers.line.biz/console/
- LINE Login docs: https://developers.line.biz/en/docs/line-login/
- Create channel docs: https://developers.line.biz/en/docs/liff/getting-started/

ขั้นตอน:

1. เข้า LINE Developers Console
2. สร้าง Provider ใหม่ หรือเลือก Provider เดิม
3. กด `Create a new channel`
4. เลือก channel type เป็น `LINE Login`
5. ใส่ชื่อแอป, อีเมล, รายละเอียดบริการ, รูปภาพ และข้อมูลที่ LINE ขอ
6. ไปที่แท็บ `LINE Login`
7. เปิดใช้งาน LINE Login channel
8. ใส่ Callback URL:
   - ยังไม่ได้กำหนดในโค้ดปัจจุบัน
9. ขอ permission ที่ต้องใช้:
   - `profile`
   - `openid`
   - `email` ถ้าต้องการอีเมล ต้องขออนุมัติจาก LINE เพิ่ม
10. เก็บค่า:
    - `LINE_CLIENT_ID` หรือ `LINE_CHANNEL_ID`
    - `LINE_CLIENT_SECRET` หรือ `LINE_CHANNEL_SECRET`

## ตัวอย่าง `.env.local`

ห้าม commit ไฟล์ `.env.local` ขึ้น Git

```env
NEXT_PUBLIC_APP_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://hpyoyjpqitpvgckxnlww.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-publishable-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

ห้ามใส่ Google `Client Secret` ใน `.env.local` ฝั่ง frontend ให้เก็บไว้ใน Supabase Dashboard เท่านั้น

## จุดที่เชื่อมแล้วในโค้ด

- `components/AuthModal.tsx`
- `components/AppShell.tsx`
- `app/auth/callback/route.ts`
- `lib/store.ts`
- `lib/supabase/app-data.ts`

## Verification

หลังใส่ค่า API แล้วให้ตรวจ:

1. Login Google ได้
2. Logout แล้ว session หายจริง
3. Refresh หน้าแล้วยังจำ user ได้
4. รูป Google profile แสดงได้จาก `avatar_url` หรือ `picture`
5. ข้อมูล `plots`, `tasks`, `activities` แยกตาม user ที่ login
6. Production callback URL ตรงกับที่ตั้งไว้ใน Google/Supabase

## Backup

ก่อนแก้ระบบ auth จริง:

```bash
git status
git diff
```

ถ้ามีงานค้าง ให้ commit หรือ stash ก่อน

## Rollback

ถ้า auth ใหม่มีปัญหา:

1. ปิด Google provider ใน Supabase ชั่วคราว
2. กลับไปใช้ login UI เดิม
3. คืนค่าไฟล์ที่แก้จาก Git commit ล่าสุด

ห้ามเปิดเผย `Client Secret` หรือ `Channel Secret` ในแชท, GitHub, screenshot, หรือเอกสารสาธารณะ
