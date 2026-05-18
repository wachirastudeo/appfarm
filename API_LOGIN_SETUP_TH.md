# คู่มือขอ API สำหรับ Google Login และ LINE Login

ไฟล์นี้ใช้เป็น checklist สำหรับไปขอ `Client ID`, `Client Secret`, `Channel ID`, และ `Channel Secret` เพื่อเชื่อม login จริงกับแอปนี้

## สถานะปัจจุบันของโปรเจกต์

- แอปมี `next-auth` ใน `package.json` แล้ว
- หน้า login ตอนนี้ยังเป็น UI/local state ยังไม่ได้เชื่อม OAuth จริง
- ถ้าใช้ NextAuth callback URL โดยทั่วไปจะเป็น:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - LINE: `http://localhost:3000/api/auth/callback/line`
  - Production: `https://YOUR_DOMAIN.com/api/auth/callback/google`
  - Production: `https://YOUR_DOMAIN.com/api/auth/callback/line`

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
    - `http://localhost:3000/api/auth/callback/google`
    - `https://YOUR_DOMAIN.com/api/auth/callback/google`
11. เก็บค่า:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`

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
   - `http://localhost:3000/api/auth/callback/line`
   - `https://YOUR_DOMAIN.com/api/auth/callback/line`
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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-random-secret

GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret

LINE_CLIENT_ID=replace-with-line-channel-id
LINE_CLIENT_SECRET=replace-with-line-channel-secret
```

สร้าง `NEXTAUTH_SECRET` ได้ด้วย:

```bash
openssl rand -base64 32
```

## จุดที่ต้องแก้ในโค้ดภายหลัง

โดยทั่วไปต้องเพิ่มไฟล์:

- `app/api/auth/[...nextauth]/route.ts`

และต้องปรับ:

- `components/AuthModal.tsx`
- `components/AppShell.tsx`
- ระบบเก็บ user/session ให้ใช้ session จริงแทน localStorage เฉพาะหน้า

## Verification

หลังใส่ค่า API แล้วให้ตรวจ:

1. Login Google ได้
2. Login LINE ได้
3. Logout แล้ว session หายจริง
4. Refresh หน้าแล้วยังจำ user ได้
5. Production callback URL ตรงกับที่ตั้งไว้ใน Google/LINE

## Backup

ก่อนแก้ระบบ auth จริง:

```bash
git status
git diff
```

ถ้ามีงานค้าง ให้ commit หรือ stash ก่อน

## Rollback

ถ้า auth ใหม่มีปัญหา:

1. ลบ/ปิด route NextAuth ที่เพิ่มใหม่
2. กลับไปใช้ login UI เดิม
3. คืนค่าไฟล์ที่แก้จาก Git commit ล่าสุด

ห้ามเปิดเผย `Client Secret`, `Channel Secret`, หรือ `NEXTAUTH_SECRET` ในแชท, GitHub, screenshot, หรือเอกสารสาธารณะ
