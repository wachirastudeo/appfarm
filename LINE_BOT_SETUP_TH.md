<!-- markdownlint-disable MD013 -->

# คู่มือเชื่อม LINE Bot กับเว็บไซต์สวนทุเรียน

> อัปเดตล่าสุด: 2026-08-08

คู่มือนี้ใช้สำหรับ **LINE Messaging API / LINE Official Account** ซึ่งเป็นคนละส่วนกับ LINE Login ที่มีอยู่แล้วใน [API_LOGIN_SETUP_TH.md](./API_LOGIN_SETUP_TH.md)

## สิ่งที่ทำไว้ในโค้ดแล้ว

- Webhook endpoint: `app/api/line/webhook/route.ts`
- URL สำหรับเชื่อม LINE: `https://YOUR_DOMAIN/api/line/webhook`
- ตรวจสอบ `x-line-signature` ด้วย HMAC-SHA256 ก่อนประมวลผลทุก event ที่มีข้อความ
- ตอบกลับคำสั่งภาษาไทยพื้นฐาน:
  - `ช่วยเหลือ` หรือ `เมนู`
  - `งานวันนี้`
  - `แปลง`
  - `บทความ`
  - `การเงิน`
- เมื่อผู้ใช้กดเพิ่มเพื่อน บอทส่งข้อความต้อนรับพร้อมลิงก์กลับเข้าเว็บไซต์
- คำตอบจะพาผู้ใช้ไปยังหน้าในเว็บ เช่น `/?tab=operations` หรือ `/?tab=plots`
- หน้า `LINE Bot` ในระบบแสดง Webhook URL จาก `NEXT_PUBLIC_SITE_URL` และมีปุ่ม copy

## ภาพรวมการทำงาน

```text
ผู้ใช้ส่งข้อความใน LINE
        ↓
LINE Platform ส่ง POST มาที่ /api/line/webhook
        ↓
เว็บไซต์ตรวจ x-line-signature ด้วย Channel Secret
        ↓
เว็บไซต์เรียก LINE Reply API ด้วย Channel Access Token
        ↓
ผู้ใช้ได้รับข้อความและลิงก์กลับเข้าเว็บ
```

## 1. เตรียม LINE Official Account

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่ หรือเลือก Provider ของเว็บไซต์
3. สร้าง Channel ประเภท **Messaging API**
4. ตั้งชื่อ Channel ให้สื่อถึงสวน เช่น `สวนทุเรียนบ้านเรา`
5. เปิดแท็บ **Basic settings** แล้วคัดลอก **Channel secret**
6. เปิดแท็บ **Messaging API** แล้วออก **Channel access token**
7. เก็บสองค่านี้ไว้ใน password manager หรือ Vercel Environment Variables

ห้ามนำ Channel Secret หรือ Channel Access Token ไปใส่ในไฟล์ frontend, `NEXT_PUBLIC_*`, Git, หรือหน้าเว็บ

## 2. ตั้งค่า Environment Variables

### ใช้บนเครื่อง

สร้างหรือแก้ไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
LINE_CHANNEL_SECRET=วาง-Channel-Secret-ตรงนี้
LINE_CHANNEL_ACCESS_TOKEN=วาง-Channel-Access-Token-ตรงนี้
```

จากนั้น restart dev server:

```bash
npm run dev
```

### ใช้บน Vercel

ไปที่ Vercel Project → **Settings** → **Environment Variables** แล้วเพิ่ม:

| Name | ค่า | เปิดเผยต่อ browser หรือไม่ |
|------|-----|----------------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://โดเมนจริงของเว็บ` | ได้ |
| `LINE_CHANNEL_SECRET` | Channel secret จาก LINE | ห้ามเปิดเผย |
| `LINE_CHANNEL_ACCESS_TOKEN` | Channel access token จาก LINE | ห้ามเปิดเผย |

เลือก Environment ให้ตรงกับที่ deploy เช่น `Production` แล้วกด **Redeploy** หลังเพิ่มหรือแก้ค่า

## 3. ตั้ง Webhook ใน LINE Developers

ใน Channel เดิม ไปที่แท็บ **Messaging API**:

1. เปิด **Use webhook** เป็น `Enabled`
2. ใส่ Webhook URL:

```text
https://YOUR_DOMAIN/api/line/webhook
```

3. กด **Update**
4. กด **Verify**
5. ถ้าขึ้นว่าเชื่อมต่อสำเร็จ แปลว่า LINE เรียก route ของเว็บไซต์ได้แล้ว

Webhook ต้องเป็น HTTPS และใช้ใบรับรอง SSL ที่ browser ทั่วไปเชื่อถือได้ ดังนั้น `http://localhost:3000` ใช้รับ event จาก LINE โดยตรงไม่ได้ ควรทดสอบผ่านโดเมนที่ deploy แล้ว

## 4. ทดสอบบอท

1. เปิด LINE Official Account Manager แล้วนำ QR Code ไปเพิ่มเพื่อน
2. ส่งข้อความเหล่านี้ทีละคำสั่ง:

```text
ช่วยเหลือ
งานวันนี้
แปลง
บทความ
การเงิน
```

3. บอทควรตอบกลับพร้อมลิงก์ไปยังหน้าเว็บที่เกี่ยวข้อง
4. เปิด `https://YOUR_DOMAIN/?tab=linebot` ในฐานะ admin เพื่อตรวจหน้าออกแบบและคัดลอก Webhook URL

## 5. ตรวจสอบเมื่อมีปัญหา

### กด Verify แล้วไม่ผ่าน

- ตรวจว่า URL เป็น `https://YOUR_DOMAIN/api/line/webhook` และไม่มี slash เกินท้าย URL
- ตรวจว่า deploy ล่าสุดมี route `app/api/line/webhook/route.ts`
- ตรวจว่า `NEXT_PUBLIC_SITE_URL` เป็นโดเมนจริง ไม่ใช่ `localhost`
- เปิด Vercel Logs แล้วดู request ที่เข้ามา

### ได้ `LINE bot is not configured`

- ตรวจชื่อ env ให้ตรงตัวอักษร:
  - `LINE_CHANNEL_SECRET`
  - `LINE_CHANNEL_ACCESS_TOKEN`
- ตรวจว่า env ถูกเพิ่มใน Environment ที่กำลัง deploy
- Redeploy หลังแก้ env ทุกครั้ง

### ได้ `Invalid signature`

- Channel Secret ไม่ตรงกับ Messaging API Channel
- ห้ามแปลงหรือแก้ request body ก่อนตรวจ signature
- ตรวจว่า request วิ่งเข้าระบบเดียวกับ Channel ที่ออก secret

### รับ webhook ได้ แต่บอทไม่ตอบ

- ตรวจ Channel access token ว่ายังใช้ได้
- ตรวจ Vercel Logs หา `LINE webhook reply error`
- ตรวจว่า event มี `replyToken` และเป็นข้อความแบบ text
- หากผู้ใช้ส่งข้อความซ้ำหลังเวลานาน ให้ส่งข้อความใหม่ เพราะ reply token มีอายุจำกัด

## 6. Security checklist

- ใช้ `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` เฉพาะฝั่ง server
- ห้ามใช้ชื่อ `NEXT_PUBLIC_LINE_CHANNEL_SECRET` หรือ `NEXT_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN`
- ห้าม commit `.env.local`
- ตรวจ signature ก่อนทำงานกับ event ทุกครั้ง
- อย่า log Channel Secret, Access Token, signature หรือข้อมูลส่วนตัวของผู้ใช้
- ใช้ HTTPS production เท่านั้น
- ไม่ต้อง allowlist IP ของ LINE Platform ให้พึ่ง signature validation แทน

## 7. ขอบเขตของเวอร์ชันนี้

เวอร์ชันนี้เชื่อม LINE กับเว็บไซต์และมีคำสั่งนำทางพื้นฐานแล้ว แต่ยังไม่ได้ผูกบัญชี LINE เข้ากับบัญชีผู้ใช้ในเว็บ จึงยังไม่ส่งข้อมูลสวนเฉพาะบุคคล เช่น งานของเจ้าของสวนแต่ละราย

หากต้องการข้อมูลเฉพาะบุคคลในขั้นถัดไป ควรทำ **บัญชีเชื่อมกัน** โดยให้ผู้ใช้ login ในเว็บก่อน แล้วออก one-time linking code สำหรับนำไปกดยืนยันใน LINE ก่อนอ่านข้อมูลจาก Supabase

## แหล่งอ้างอิงทางการ

- [Build a bot](https://developers.line.biz/en/docs/messaging-api/building-bot/)
- [Sending messages](https://developers.line.biz/en/docs/messaging-api/sending-messages/)
- [Verify webhook URL](https://developers.line.biz/en/docs/messaging-api/verify-webhook-url/)
- [Verify webhook signature](https://developers.line.biz/en/tips/2026/06/18/verify-webhook-signature/)
