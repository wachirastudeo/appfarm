# เตรียมเว็บสำหรับ Cloudflare Workers และ D1

นำขึ้นจริงแล้ววันที่ 1 พฤศจิกายน 2026: https://appfarm.wachira-appfarm.workers.dev ใช้ Worker และ D1 ชื่อ `appfarm` ตรวจสมัครบัญชี session บันทึก/โหลดข้อมูล การแยกข้อมูลผู้ใช้ และออกจากระบบบน production ผ่านแล้ว บัญชีทดสอบของรอบ deploy ถูกล้างออกหลังตรวจเสร็จ เจ้าของเว็บสมัครบัญชีจริงใหม่ได้ตามปกติ

โหมด Cloudflare ใช้ Workers สำหรับเว็บและ API, D1 สำหรับบัญชี session โปรไฟล์ และข้อมูลสวน โดยไม่เชื่อมต่อ Supabase ไม่ต้องเปิด R2 หรือบริการเสียเงินเพื่อเริ่มต้น รูปบทความยังอยู่ใน `public/` และรูปโปรไฟล์/ปกขนาดเล็กเก็บใน D1

## ทดลองในเครื่อง

ต้องใช้ Node.js 22.18 ขึ้นไป

```powershell
npm ci
Copy-Item .dev.vars.example .dev.vars
```

แก้ `BETTER_AUTH_SECRET` ใน `.dev.vars` ให้เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร สร้างได้ด้วยคำสั่งนี้ แล้วนำผลลัพธ์ไปใส่ในไฟล์:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

เก็บ `BETTER_AUTH_URL=http://localhost:3001` สำหรับเครื่องนี้ แล้วรัน:

```powershell
npm run cf:db:local
npm run dev:cloudflare
```

เปิด http://localhost:3001 แล้วสมัครบัญชีอีเมลใหม่ รหัสผ่านอย่างน้อย 8 ตัวอักษร ฐานข้อมูลจำลองอยู่ใน `.wrangler/` ไม่ใช้ฐานข้อมูลจริง ไม่ส่งอีเมลตอนสมัคร และไม่ต้องล็อกอิน Cloudflare เพื่อทดสอบ

`npm run dev` ยังเปิด demo แบบเดิมที่ localhost:3000 ข้อมูลในเบราว์เซอร์แยกจาก Cloudflare และบัญชีทดลองเดิมไม่ใช่บัญชี D1

## ตรวจสอบ

เปิด `npm run dev:cloudflare` ค้างไว้สำหรับ integration test:

```powershell
npm run test:modes
npm run test:cloudflare
npm run lint
npx tsc --noEmit
npm run build
```

Integration test สร้างบัญชีและข้อมูลทดลองเฉพาะ localhost เพื่อตรวจ session การแยกข้อมูล สิทธิ์ผู้ใช้ validation และการออกจากระบบ

## เมื่อพร้อมนำขึ้นจริง

ขั้นตอนตั้งค่าเริ่มต้นด้านล่างดำเนินการแล้ว และบันทึก `account_id` / `database_id` จริงใน `wrangler.jsonc` ไม่ต้องสร้างซ้ำ เมื่อต้องการอัปเดตเว็บใช้ `npm run deploy:cloudflare` อย่าลบ Supabase หรือเว็บเดิมจนกว่าตรวจข้อมูลหลังย้ายครบ

1. รัน `npm run cf:login` และเชื่อมบัญชี Cloudflare
2. รัน `npx wrangler d1 create appfarm` แล้วนำ `database_id` ที่ได้มาแทนค่า `00000000-0000-0000-0000-000000000000` ใน `wrangler.jsonc` ถ้ามีหลายบัญชี ให้เพิ่ม `account_id` ของบัญชีที่ต้องการด้วย
3. รัน `npm run cf:db:remote` เพื่อสร้างตารางและบทความ/สินค้าเริ่มต้น โดยไม่ลบข้อมูลเดิม
4. ตั้ง secret ของ production:

   ```powershell
   npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put BETTER_AUTH_URL
   ```

   ใช้ secret ใหม่สำหรับ production และตั้ง URL เป็น `https://appfarm.<subdomain-ของบัญชี>.workers.dev` หรือโดเมนจริง ห้ามใช้ localhost

5. ตั้ง `NEXT_PUBLIC_SITE_URL` เป็น URL เดียวกันใน environment ที่ใช้ build เพื่อให้ canonical, sitemap และลิงก์แชร์ถูกต้อง ค่านี้เป็น public และต้อง build ใหม่เมื่อเปลี่ยน
6. รัน `npm run deploy:cloudflare` แล้วตรวจ `/api/system/health`, สมัครบัญชี และทดสอบบันทึก/โหลดข้อมูลใหม่

`.dev.vars` ใช้เฉพาะในเครื่อง ไม่ถูกอัปโหลดเป็น secrets ของ production และห้าม commit

## บัญชีผู้ดูแล

บัญชีใหม่มีสิทธิ์ `user` เสมอ ส่ง `role=admin` จากเว็บแล้วไม่ได้สิทธิ์เพิ่ม หลังเจ้าของเว็บสมัครบัญชี D1 ของตัวเอง ให้ใช้ D1 Console ใน Cloudflare รัน SQL นี้ โดยแทนอีเมลด้วยบัญชีของเจ้าของจริง:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM "user" WHERE email = 'owner@example.com');
```

ออกจากระบบแล้วเข้าใหม่เพื่อโหลดสิทธิ์ ผู้ดูแลแก้บทความ สินค้า และข้อมูลเว็บไซต์ได้ ข้อมูลสวนยังแยกตาม session เจ้าของ ผู้ดูแลไม่ได้สิทธิ์อ่านข้อมูลสวนของทุกคนโดยอัตโนมัติ

## Google และ LINE

ตั้ง `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` และ `LINE_CLIENT_ID` / `LINE_CLIENT_SECRET` เป็น Worker secrets เมื่อมีข้อมูลจริง ปุ่มจึงจะเปิดใช้งาน Callback ใหม่คือ:

- Google: `https://โดเมนเว็บ/api/auth/callback/google`
- LINE: `https://โดเมนเว็บ/api/auth/oauth2/callback/line`

เพิ่ม callback ใน console ของผู้ให้บริการด้วย สำหรับ LINE ต้องเปิดสิทธิ์เข้าถึงอีเมลและ scope `openid profile email` การตั้งค่า OAuth เดิมที่ชี้ Supabase ใช้แทน callback ใหม่นี้ไม่ได้

การส่งอีเมลยืนยัน/รีเซ็ตรหัสผ่านยังไม่ได้เปิดบริการ จึงแสดงข้อความให้ติดต่อผู้ดูแลแทนการแจ้งว่าส่งอีเมลสำเร็จ Google/LINE ต้องทดสอบจริงหลังใส่ credentials และ callback ของโดเมนใหม่

## ย้ายข้อมูลเก่า

ยังไม่ได้คัดลอกบัญชีและข้อมูลส่วนตัวจาก Supabase อัตโนมัติ บัญชี D1 ต้องสมัครใหม่หรือใช้ OAuth ที่ตั้งค่าแล้ว ไม่มีการนำ password hash เก่ามาใช้เป็นรหัสผ่านจริง

ส่งออกข้อมูลสวนของเจ้าของแต่ละบัญชีเป็น JSON ที่มี `plots`, `activities`, `tasks`, `finance` แล้วสร้างไฟล์ SQL สำหรับบัญชี D1 ที่สมัครไว้แล้ว:

```powershell
node scripts/import-cloudflare-data.mjs backup.json owner@example.com output/orchard-import.sql
npx wrangler d1 execute DB --local --file output/orchard-import.sql
```

ตรวจในเครื่องก่อน จึงใช้ `--remote` เมื่อพร้อม ไฟล์ import เป็นข้อมูลส่วนตัวและควรเก็บใน `output/` ที่ gitignore แล้ว สคริปต์ไม่เขียนทับข้อมูลสวนที่มีอยู่ ไม่ย้ายรหัสผ่าน session หรือสิทธิ์ผู้ดูแล และจะไม่เพิ่มข้อมูลหากยังไม่มีบัญชีอีเมลปลายทาง ต้องตรวจชื่อเจ้าของและจำนวนข้อมูลหลังนำเข้า

บทความ/สินค้าใน migration เป็นชุดเริ่มต้นจาก repository ถ้ามีการแก้เนื้อหาใน Supabase ต้องส่งออกและย้ายฉบับล่าสุดแยกก่อนเลิกใช้ระบบเดิม

## ขอบเขตแพ็กเกจฟรี

ใช้ Workers Free และ D1 Free โดยไม่เปิด paid plan อัตโนมัติ แต่ไม่รับประกันการใช้งานได้ไม่จำกัด ต้องทดสอบ CPU ของหน้าเว็บและการล็อกอินหลัง deploy รวมถึงติดตามโควตา request, database reads/writes และพื้นที่เก็บข้อมูล รูปปกหรือข้อมูลสวนที่มีขนาดใหญ่เกินขีดจำกัด API จะถูกปฏิเสธและแสดงข้อผิดพลาดแทนการบันทึกเงียบ ๆ
