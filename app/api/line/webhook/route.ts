import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply"

type LineEvent = {
  type?: string
  replyToken?: string
  message?: {
    type?: string
    text?: string
  }
}

type LineWebhookPayload = {
  events?: LineEvent[]
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://appfarm-main.vercel.app").replace(/\/$/, "")
}

function verifySignature(body: string, signature: string, channelSecret: string) {
  const expected = createHmac("sha256", channelSecret).update(body).digest("base64")
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}

function websiteLink(path = "") {
  return `${getSiteUrl()}${path}`
}

function buildReply(event: LineEvent) {
  if (event.type === "follow") {
    return `ยินดีต้อนรับสู่สวนทุเรียนบ้านเราครับ 🌿\n\nผมช่วยพาไปดูงานในสวน แปลง และบทความความรู้ได้\n\nพิมพ์ “ช่วยเหลือ” เพื่อดูเมนู หรือเปิดเว็บได้ที่\n${websiteLink()}`
  }

  const text = event.message?.type === "text" ? event.message.text?.trim().toLowerCase() : ""

  if (!text || text === "ช่วยเหลือ" || text === "เมนู" || text === "menu" || text === "help") {
    return `เมนูสวนทุเรียน 🌱\n\nพิมพ์คำสั่ง:\n• งานวันนี้ - ดูงานที่ต้องทำ\n• แปลง - ดูข้อมูลแปลงและต้น\n• บทความ - เปิดคลังความรู้\n• การเงิน - ดูภาพรวมรายรับรายจ่าย\n\nเปิดเว็บ: ${websiteLink()}`
  }

  if (text.includes("งาน") || text.includes("วันนี้") || text.includes("task")) {
    return `งานสวนวันนี้อยู่ที่นี่ครับ 📋\n${websiteLink("/?tab=operations")}`
  }

  if (text.includes("แปลง") || text.includes("ต้น") || text.includes("plot")) {
    return `ดูข้อมูลแปลงและต้นทุเรียนได้ที่นี่ครับ 🌳\n${websiteLink("/?tab=plots")}`
  }

  if (text.includes("บทความ") || text.includes("ความรู้") || text.includes("article")) {
    return `คลังความรู้สำหรับคนทำสวนอยู่ที่นี่ครับ 📚\n${websiteLink("/?tab=articles")}`
  }

  if (text.includes("เงิน") || text.includes("รายรับ") || text.includes("รายจ่าย") || text.includes("finance")) {
    return `ภาพรวมการเงินของสวนอยู่ที่นี่ครับ 💰\n${websiteLink("/?tab=finance")}`
  }

  return `รับข้อความแล้วครับ 🌿\nลองพิมพ์ “ช่วยเหลือ” เพื่อดูเมนู หรือเปิดเว็บได้ที่\n${websiteLink()}`
}

async function replyToLine(replyToken: string, text: string, accessToken: string) {
  const response = await fetch(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`LINE reply failed (${response.status}): ${details.slice(0, 300)}`)
  }
}

export function GET() {
  return NextResponse.json({ ok: true, service: "line-webhook" })
}

export async function POST(request: Request) {
  const body = await request.text()
  let payload: LineWebhookPayload

  try {
    payload = JSON.parse(body) as LineWebhookPayload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const events = Array.isArray(payload.events) ? payload.events : []
  if (events.length === 0) {
    return NextResponse.json({ ok: true, received: 0 })
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const signature = request.headers.get("x-line-signature")

  if (!channelSecret || !accessToken) {
    return NextResponse.json({ ok: false, error: "LINE bot is not configured" }, { status: 503 })
  }

  if (!signature || !verifySignature(body, signature, channelSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 })
  }

  const replyableEvents = events.filter(event => event.replyToken && (event.type === "follow" || event.message?.type === "text"))

  try {
    await Promise.all(replyableEvents.map(event => replyToLine(event.replyToken as string, buildReply(event), accessToken)))
  } catch (error) {
    console.error("LINE webhook reply error", error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: "Unable to reply to LINE" }, { status: 502 })
  }

  return NextResponse.json({ ok: true, received: events.length, replied: replyableEvents.length })
}
