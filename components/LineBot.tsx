"use client"

import Image from "next/image"
import { useState } from "react"
import {
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  CloudRain,
  Copy,
  ExternalLink,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { Switch } from "./ui/switch"

const TEMPLATES = [
  {
    id: "morning",
    title: "สรุปงานเช้า",
    description: "แจ้งงานที่ต้องทำวันนี้ เวลา 06:30 น.",
    icon: BellRing,
    color: "#176B45",
    message: "สวัสดีตอนเช้าครับ 🌿\nวันนี้สวนมีงานที่ต้องดูแล 3 รายการ\n\n• ใส่ปุ๋ย แปลง A\n• ตรวจดอก แปลง B\n• เช็กน้ำในแปลง C",
  },
  {
    id: "weather",
    title: "เตือนฝนตก",
    description: "ส่งเมื่อมีโอกาสฝนมากกว่า 70%",
    icon: CloudRain,
    color: "#1987A8",
    message: "แจ้งเตือนสภาพอากาศ ☔\nวันนี้มีโอกาสฝนตก 80% ช่วงบ่าย\n\nแนะนำให้เลื่อนการพ่นสาร และตรวจทางระบายน้ำก่อนเที่ยงครับ",
  },
  {
    id: "harvest",
    title: "ติดตามผลผลิต",
    description: "สรุปจำนวนผลและระยะเก็บเกี่ยว",
    icon: Leaf,
    color: "#B7791F",
    message: "อัปเดตผลผลิตสวนทุเรียน 🌱\nแปลง A มีผลที่อยู่ในระยะใกล้เก็บเกี่ยว 24 ผล\n\nกดดูรายละเอียดในระบบได้เลยครับ",
  },
]

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://appfarm-main.vercel.app").replace(/\/$/, "")
const WEBHOOK_URL = `${SITE_URL}/api/line/webhook`

export default function LineBot() {
  const [isBotActive, setIsBotActive] = useState(true)
  const [sendNotifications, setSendNotifications] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState("morning")
  const [welcomeMessage, setWelcomeMessage] = useState(TEMPLATES[0].message)
  const [channelId, setChannelId] = useState("2008123456")
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeTemplate = TEMPLATES.find(template => template.id === selectedTemplate) ?? TEMPLATES[0]

  const chooseTemplate = (id: string) => {
    const template = TEMPLATES.find(item => item.id === id)
    if (!template) return
    setSelectedTemplate(id)
    setWelcomeMessage(template.message)
    setSaved(false)
  }

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const saveSettings = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-[1.4rem] bg-[#06271C] p-5 text-white shadow-[0_18px_45px_rgba(23,107,69,0.14)] sm:p-7 lg:p-8">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#06C755]/18 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-[#B6E36A]/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06C755] shadow-lg shadow-[#06C755]/20">
                <Image src="/line-channel-icon.png" alt="LINE" width={40} height={40} className="h-10 w-10 rounded-xl" priority />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A9DDB8]">Automation studio</p>
                <p className="mt-1 text-sm font-bold text-white/70">LINE Official Account</p>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl">ให้ LINE ช่วยดูแลสวนแทนคุณ</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">ส่งสรุปงาน สภาพอากาศ และการแจ้งเตือนสำคัญให้ทีมสวนตรงเวลา พร้อมจัดการข้อความจากที่เดียว</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-sm">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isBotActive ? "bg-[#06C755]/20 text-[#8DE7A8]" : "bg-white/10 text-white/50"}`}>
              {isBotActive ? <CheckCircle2 size={21} /> : <MessageCircle size={21} />}
            </span>
            <div>
              <p className="text-xs font-bold text-white/55">สถานะบอท</p>
              <p className="mt-0.5 text-sm font-black">{isBotActive ? "พร้อมทำงาน" : "ปิดการทำงาน"}</p>
            </div>
            <Switch checked={isBotActive} onCheckedChange={setIsBotActive} aria-label="เปิดหรือปิด LINE Bot" className="ml-2 data-[state=checked]:bg-[#06C755]" />
          </div>
        </div>
      </section>

      <section aria-label="ภาพรวม LINE Bot" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "ผู้ติดตามทั้งหมด", value: "128", note: "+12% เดือนนี้", icon: Users, color: "#176B45" },
          { label: "ข้อความสัปดาห์นี้", value: "342", note: "ตอบแล้ว 321 ข้อความ", icon: MessageCircle, color: "#1987A8" },
          { label: "อัตราการตอบกลับ", value: "94%", note: "ดีขึ้น 6% จากเดือนก่อน", icon: Zap, color: "#B7791F" },
          { label: "ระบบอัตโนมัติ", value: "06", note: "กำลังทำงาน 4 รายการ", icon: Sparkles, color: "#9856A5" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <article key={stat.label} className="orchard-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}14`, color: stat.color }}>
                  <Icon size={19} />
                </span>
                <span className="text-[10px] font-black text-[#176B45] dark:text-[#8FD19E]">LIVE</span>
              </div>
              <p className="mt-4 text-xs font-bold text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{stat.note}</p>
            </article>
          )
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
        <section className="orchard-card rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#176B45] dark:text-[#8FD19E]">Message preview</p>
              <h2 className="mt-2 text-xl font-black text-foreground">หน้าตาที่ลูกค้าจะเห็นใน LINE</h2>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-black text-foreground transition-colors hover:border-primary hover:text-primary">
              <ExternalLink size={14} /> เปิดตัวอย่าง
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[19rem] rounded-[2rem] border-[7px] border-[#173326] bg-[#F5F8F5] p-2 shadow-xl dark:border-[#06140C] dark:bg-[#EAF2EC]">
              <div className="overflow-hidden rounded-[1.4rem]">
                <div className="flex items-center gap-2 bg-[#06C755] px-4 py-3 text-white">
                  <Image src="/line-channel-icon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">สวนทุเรียนบ้านเรา</p>
                    <p className="text-[9px] font-bold text-white/75">Official Account</p>
                  </div>
                  <MoreHorizontal size={16} className="ml-auto" />
                </div>
                <div className="space-y-3 bg-[#E8F0E9] p-3">
                  <p className="text-center text-[9px] font-bold text-[#78907E]">วันนี้ 06:30</p>
                  <div className="flex items-end gap-2">
                    <Image src="/line-channel-icon.png" alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
                    <div className="max-w-[83%] rounded-2xl rounded-bl-sm bg-white px-3 py-2.5 text-[10px] font-semibold leading-5 text-[#254333] shadow-sm">
                      {welcomeMessage.split("\n").map((line, index) => <span key={`${line}-${index}`} className="block">{line || "\u00a0"}</span>)}
                    </div>
                  </div>
                  <div className="flex justify-end"><span className="rounded-2xl rounded-br-sm bg-[#C9F6D4] px-3 py-2 text-[10px] font-bold text-[#1A6A3C]">ดูงานวันนี้</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-[9px] font-bold text-[#527060]"><Check size={12} className="text-[#06C755]" /> ส่งโดยสวนทุเรียนบ้านเรา</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-foreground">ข้อความต้อนรับ</h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">แก้ไขข้อความแล้วดูตัวอย่างได้ทันที</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{welcomeMessage.length}/500</span>
              </div>
              <label htmlFor="line-welcome-message" className="sr-only">ข้อความต้อนรับ LINE</label>
              <textarea
                id="line-welcome-message"
                value={welcomeMessage}
                onChange={event => { setWelcomeMessage(event.target.value); setSaved(false) }}
                maxLength={500}
                rows={8}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button type="button" onClick={saveSettings} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#176B45] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#0F5938] dark:bg-[#72C08A] dark:text-[#0B1B12] dark:hover:bg-[#8BD39E]">
                {saved ? <Check size={17} /> : <Send size={16} />}
                {saved ? "บันทึกแล้ว" : "บันทึกข้อความ"}
              </button>
            </div>
          </div>
        </section>

        <section className="orchard-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#176B45] dark:text-[#8FD19E]">Channel setup</p>
              <h2 className="mt-2 text-xl font-black text-foreground">ตั้งค่าการเชื่อมต่อ</h2>
            </div>
            <Settings2 size={20} className="text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="line-channel-id" className="mb-2 block text-xs font-black text-foreground">Channel ID</label>
              <input id="line-channel-id" value={channelId} onChange={event => setChannelId(event.target.value)} inputMode="numeric" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </div>
            <div>
              <label htmlFor="line-channel-secret" className="mb-2 block text-xs font-black text-foreground">Channel Secret</label>
              <input id="line-channel-secret" value="••••••••••••••••" readOnly className="h-11 w-full rounded-xl border border-border bg-muted/50 px-3 text-sm font-bold tracking-[0.25em] text-muted-foreground outline-none" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="line-webhook" className="text-xs font-black text-foreground">Webhook URL</label><span className="rounded-full bg-[#E8F6EC] px-2 py-1 text-[10px] font-black text-[#176B45] dark:bg-[#1D3A29] dark:text-[#8FD19E]">HTTPS</span></div>
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                <input id="line-webhook" value={WEBHOOK_URL} readOnly className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-muted-foreground outline-none" />
                <button type="button" onClick={copyWebhook} aria-label="คัดลอก Webhook URL" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-primary/10 hover:text-primary">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#B9DCC8]/70 bg-[#F1F8F3] px-3.5 py-3 dark:border-[#31533D] dark:bg-[#14291E]">
              <div><p className="text-xs font-black text-foreground">ส่งแจ้งเตือนอัตโนมัติ</p><p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">งานวันนี้และสภาพอากาศ</p></div>
              <Switch checked={sendNotifications} onCheckedChange={setSendNotifications} aria-label="เปิดหรือปิดการแจ้งเตือนอัตโนมัติ" />
            </div>
            <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#06C755]/40 bg-[#06C755]/10 px-4 py-3 text-sm font-black text-[#168B45] transition-colors hover:bg-[#06C755]/20 dark:text-[#8DE7A8]"><Clipboard size={16} /> ทดสอบส่งข้อความ</button>
          </div>
        </section>
      </div>

      <section className="orchard-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#176B45] dark:text-[#8FD19E]">Quick templates</p><h2 className="mt-2 text-xl font-black text-foreground">เลือกชุดข้อความอัตโนมัติ</h2></div>
          <button type="button" className="inline-flex items-center gap-2 self-start text-xs font-black text-primary sm:self-auto"><Plus size={15} /> สร้างชุดข้อความใหม่</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {TEMPLATES.map(template => {
            const Icon = template.icon
            const isSelected = activeTemplate.id === template.id
            return (
              <button key={template.id} type="button" onClick={() => chooseTemplate(template.id)} aria-pressed={isSelected} className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-[#06C755] bg-[#F0FAF2] shadow-sm dark:bg-[#14291E]" : "border-border bg-background hover:border-primary/40"}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${template.color}14`, color: template.color }}><Icon size={19} /></span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-black text-foreground">{template.title}{isSelected && <CheckCircle2 size={15} className="text-[#06C755]" />}</span><span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">{template.description}</span></span>
                <ChevronRight size={16} className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#C8DCCF] bg-[#F2F8F3] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-[#31533D] dark:bg-[#14291E]">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2E7] text-[#176B45] dark:bg-[#1D3A29] dark:text-[#8FD19E]"><Play size={17} /></div><div><p className="text-sm font-black text-foreground">ขั้นตอนถัดไป</p><p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">นำ Webhook URL ไปวางใน LINE Developers เพื่อเปิดใช้งานการรับข้อความจริง</p></div></div>
        <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-black text-background transition-opacity hover:opacity-85">เปิด LINE Developers <ExternalLink size={14} /></a>
      </section>
    </div>
  )
}
