<!-- markdownlint-disable MD013 -->

# คู่มือขอ API สำหรับ Google Login และ LINE Login

ไฟล์นี้ใช้เป็น checklist สำหรับไปขอ `Client ID`, `Client Secret`, `Channel ID`, และ `Channel Secret` เพื่อเชื่อม login จริงกับแอปนี้

## สถานะปัจจุบันของโปรเจกต์

- Google Login เชื่อมผ่าน Supabase Auth แล้ว
- หน้า login ใช้ `components/AuthModal.tsx` เรียก `supabase.auth.signInWithOAuth()` สำหรับ Google และ LINE
- Frontend ใช้ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` เป็น public key หลัก และรองรับ `NEXT_PUBLIC_SUPABASE_ANON_KEY` เป็น legacy fallback
- Callback route ของแอปคือ:
  - Local: `http://localhost:3000/auth/callback`
  - Production: `https://YOUR_DOMAIN.com/auth/callback`
- Supabase OAuth callback ที่ต้องใส่ใน Google Cloud Console คือ:
  - `https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback`
- LINE Login เชื่อมผ่าน Supabase Auth แบบ Custom OAuth/OIDC provider แล้ว เพราะ Supabase ไม่มี LINE เป็น built-in provider

## สิ่งที่ต้องเตรียม

- ชื่อแอป: ใช้ชื่อเดียวกับเว็บ เช่น `สวนทุเรียน`
- โดเมนจริง เช่น `https://your-domain.com`
- อีเมลผู้ดูแลระบบ
- Privacy Policy URL
- Terms of Service URL
- โลโก้แอป ถ้ามี

## Google Login

ลิงก์หลัก:

- Google Cloud Console: <https://console.cloud.google.com/>
- OAuth setup docs: <https://support.google.com/googleapi/answer/6158849>
- OAuth consent screen docs: <https://developers.google.com/workspace/guides/configure-oauth-consent>

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

## ทดสอบบน localhost ได้ไหม

ได้ — LINE/Google บน `http://localhost:3000` ใช้ได้ปกติ

- **LINE Developers / Google Cloud** ใส่ callback ไปที่ Supabase เท่านั้น:
  - `https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback`
- **Supabase** > `Authentication` > `URL Configuration` ต้องมี:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`

localhost ไม่ต้องใส่ใน LINE/Google callback — Supabase เป็นตัวกลางรับ token แล้วส่งกลับมาที่แอป

## LINE Login — ตั้ง Custom Provider ใหม่ทั้งหมด

โปรเจกต์นี้ใช้ **Supabase Custom Provider** เท่านั้น (ไม่มี built-in `line`)  
โค้ดเรียก: `signInWithOAuth({ provider: "custom:line" })`  
ดังนั้นใน Supabase ต้องมี Custom provider ที่ **Provider ID = `line`**

ลิงก์:

- LINE Developers: <https://developers.line.biz/console/>
- Supabase Dashboard: <https://supabase.com/dashboard/project/hpyoyjpqitpvgckxnlww/auth/providers>
- ทำไมห้าม OIDC auto-discovery: <https://zenn.dev/sasatech/articles/02b8fb72b45cdd>

---

### ขั้นที่ 0 — ลบของเก่า (แนะนำ)

1. Supabase → `Authentication` → `Sign In / Providers` → **Custom Providers**
2. ลบ provider LINE / `custom:line` เก่าทั้งหมด (โดยเฉพาะแบบ **Auto-discovery OIDC**)
3. อย่าใช้ provider ชื่อ `line` แบบ built-in — โปรเจกต์นี้ไม่รองรับ จะ error `Provider line could not be found`

---

### ขั้นที่ 1 — LINE Developers

1. สร้างหรือเปิด channel ประเภท **LINE Login**
2. แท็บ **LINE Login** → เปิดใช้งาน
3. **Callback URL** (ใส่แค่อันนี้):

```text
https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback
```

4. เปิด permission: `openid`, `profile` (ยังไม่ต้อง `email` จนกว่า LINE จะอนุมัติ)
5. เก็บค่า:
   - **Channel ID** = ตัวเลข เช่น `2010016565` (ห้ามใช้ LIFF ID)
   - **Channel secret** = กด Issue / copy ใหม่

---

### ขั้นที่ 2 — Supabase URL Configuration

`Authentication` → `URL Configuration`

| ช่อง | ค่า (local) | ค่า (production) |
|------|-------------|------------------|
| Site URL | `http://localhost:3000` | `https://durianflow.vercel.app` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://durianflow.vercel.app/auth/callback` |

ใส่ **ทั้ง local และ production** ใน Redirect URLs พร้อมกันได้

---

### ขั้นที่ 3 — สร้าง Custom Provider ใหม่

`Authentication` → `Sign In / Providers` → **Add provider** / **New custom provider**

| ช่องใน Dashboard | ค่าที่ใส่ |
|------------------|-----------|
| Configuration method | **Manual configuration** (OAuth2) — **ห้าม** Auto-discovery (OIDC) |
| Provider name / Display name | `LINE` (ชื่อโชว์ ใส่อะไรก็ได้) |
| Provider ID / Identifier | `line` → โค้ดจะเรียก `custom:line` |
| Client ID | Channel ID จาก LINE (ตัวเลข) |
| Client Secret | Channel secret จาก LINE |
| Authorization URL | `https://access.line.me/oauth2/v2.1/authorize` |
| Token URL | `https://api.line.me/oauth2/v2.1/token` |
| UserInfo URL | `https://api.line.me/oauth2/v2.1/userinfo` |
| Issuer URL | `https://access.line.me` (ถ้ามีช่อง — ใส่ได้) |
| Scopes | `profile` เท่านั้น (**ห้าม** `openid, openid profile`) |
| Allow users without email | **เปิด (ON)** |
| Enabled | **เปิด (ON)** |

**Callback URL** ที่ Supabase แสดง (copy ไปใส่ใน LINE ขั้นที่ 1):

```text
https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback
```

กด **Save** / **Update provider**

---

### ขั้นที่ 4 — ทดสอบ

```bash
npm run dev
```

1. เปิด `http://localhost:3000`
2. กด **เข้าสู่ระบบด้วย LINE**
3. อนุมัติใน LINE → กลับมาที่ `/auth/callback` → เข้าแอปได้
4. ดูรูปโปรไฟล์มุมขวาบน (LINE CDN ใช้ `referrerPolicy` ในแอปแล้ว)

ถ้า fail → `Logs` → `Auth` ใน Supabase แล้วดูบรรทัด error จริง

---

### Error ที่พบบ่อย

| Error | แก้ |
|-------|-----|
| `Provider line could not be found` | ใช้ Custom provider ID `line` + โค้ด `custom:line` — อย่าใช้ built-in `line` |
| `Error getting user profile from external provider` | เปลี่ยนเป็น **Manual OAuth2** ไม่ใช่ OIDC; Scopes = `profile` |
| กลับมาหน้าแรกพร้อม `auth_error` | ดู Auth logs; ตรวจ Client Secret / Callback URL ใน LINE |

## ตัวอย่าง `.env.local`

ห้าม commit ไฟล์ `.env.local` ขึ้น Git

```env
NEXT_PUBLIC_APP_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://hpyoyjpqitpvgckxnlww.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-publishable-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=app-images
```

ห้ามใส่ Google `Client Secret` หรือ LINE `Channel Secret` ใน `.env.local` ฝั่ง frontend ให้เก็บไว้ใน Supabase Dashboard เท่านั้น

## จุดที่เชื่อมแล้วในโค้ด

- `components/AuthModal.tsx`
- `components/AppShell.tsx`
- `app/auth/callback/route.ts`
- `lib/store.ts`
- `lib/supabase/app-data.ts`

## แก้ error `Error getting user profile from external provider`

error นี้เกิดที่ Supabase Auth ก่อนถึง `/auth/callback` แปลว่า provider ส่ง token กลับมาแล้ว แต่ Supabase ดึง profile ไม่สำเร็จ

### Google

1. ตรวจ `Client ID` / `Client Secret` ใน Supabase > `Authentication` > `Providers` > `Google`
2. ใน Google Cloud Console ใส่ redirect URI เป็น Supabase callback เท่านั้น:
   - `https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback`
3. ถ้า OAuth consent screen อยู่โหมด Testing ต้องเพิ่มอีเมลผู้ทดสอบใน Test users
4. เปิด scopes `openid`, `email`, `profile` ใน consent screen

### LINE

ดูขั้นตอนเต็มในหัวข้อ **LINE Login — ตั้ง Custom Provider ใหม่ทั้งหมด** ด้านบน

## Verification

หลังใส่ค่า API แล้วให้ตรวจ:

1. Login Google ได้
2. Login LINE ได้ และ LINE ส่ง email กลับมาได้
3. Logout แล้ว session หายจริง
4. Refresh หน้าแล้วยังจำ user ได้
5. รูป profile แสดงได้จาก `avatar_url` หรือ `picture`
6. ข้อมูล `plots`, `tasks`, `activities` แยกตาม user ที่ login
7. Production callback URL ตรงกับที่ตั้งไว้ใน Google/LINE/Supabase

## Backup

ก่อนแก้ระบบ auth จริง:

```bash
git status
git diff
```

ถ้ามีงานค้าง ให้ commit หรือ stash ก่อน

## Rollback

ถ้า auth ใหม่มีปัญหา:

1. ปิด Google หรือ LINE provider ใน Supabase ชั่วคราว
2. กลับไปใช้ login UI เดิม
3. คืนค่าไฟล์ที่แก้จาก Git commit ล่าสุด

ห้ามเปิดเผย `Client Secret` หรือ `Channel Secret` ในแชท, GitHub, screenshot, หรือเอกสารสาธารณะ
