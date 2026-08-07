"use client"

import Image from "next/image"
import { ArrowRight, BookOpen, CalendarDays, CloudSun, Coins, Download, MapPinned, Sprout } from "lucide-react"
import type { Article, Product } from "@/lib/store"

interface Props {
  articles: Article[]
  products: Product[]
  onLogin: () => void
  onReadArticles: (articleId?: string) => void
  onOpenProducts: () => void
  onOpenSandbox: (tab: "tasks" | "plots" | "activities" | "finance") => void
  onInstall: () => Promise<void>
  isInstalled: boolean
}

const FEATURES = [
  { title: "วางแผนงานสวน", description: "จัดการงานประจำวันและติดตามสถานะได้ในที่เดียว", icon: CalendarDays, tab: "tasks" as const, accent: "#8fca3f" },
  { title: "ดูแลแปลงและต้น", description: "เก็บข้อมูลแปลง สุขภาพต้น และระยะการเติบโต", icon: MapPinned, tab: "plots" as const, accent: "#269d70" },
  { title: "บันทึกกิจกรรม", description: "บันทึกงานและค่าใช้จ่ายหน้างานได้อย่างรวดเร็ว", icon: Sprout, tab: "activities" as const, accent: "#e1ad3e" },
  { title: "ติดตามการเงิน", description: "ดูรายรับ รายจ่าย ต้นทุน และภาพรวมกำไรของสวน", icon: Coins, tab: "finance" as const, accent: "#c56f4d" },
  { title: "เช็กสภาพอากาศ", description: "ดูพยากรณ์เพื่อวางแผนงานและดูแลสวนได้เหมาะกับวัน", icon: CloudSun, tab: "tasks" as const, accent: "#1597e5" },
  { title: "คลังความรู้", description: "อ่านบทความเรื่องโรค ปุ๋ย ดอก ผล และการดูแลทุเรียน", icon: BookOpen, tab: null, accent: "#4a8965" },
]

export default function MinimalGuestHome({ articles, products, onLogin, onReadArticles, onOpenProducts, onOpenSandbox, onInstall, isInstalled }: Props) {
  const featuredArticles = articles.filter(article => article.status === "published").slice(0, 3)
  const activeProducts = products.filter(product => product.status === "active").slice(0, 4)

  return (
    <div data-page="home-minimal" className="home-minimal mx-auto w-full max-w-7xl space-y-12 px-3 pb-12 pt-2 sm:space-y-20 sm:px-5 sm:pb-16 sm:pt-3 lg:px-0">
      <section className="home-minimal-hero relative overflow-hidden rounded-[1.25rem] bg-[#123c2b] text-white">
        <Image src="/images/durian-hero-new.png" alt="สวนทุเรียนสีเขียว" fill priority sizes="(min-width: 1024px) 1200px, 100vw" className="object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,29,0.94),rgba(10,43,29,0.62)_52%,rgba(10,43,29,0.12))]" />
        <div className="relative grid min-h-[29rem] items-end gap-8 p-5 sm:min-h-[32rem] sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-14">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#b9d9bf]">Smart orchard management</p>
            <h1 className="max-w-xl text-3xl font-black leading-[1.08] tracking-tight sm:text-6xl">จัดการสวนทุเรียนให้เป็นเรื่องง่าย</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/78 sm:mt-6 sm:text-lg sm:leading-7">วางแผนงาน ดูแลแปลง บันทึกกิจกรรม และติดตามการเงินของสวนในระบบเดียว</p>
            <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
              <button onClick={onLogin} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#a7d85b] px-5 py-3 text-sm font-black text-[#173326] transition-colors hover:bg-white sm:w-auto">เริ่มใช้งาน <ArrowRight size={17} /></button>
              <button onClick={() => onOpenSandbox("plots")} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-white/20 sm:w-auto">ทดลองดูระบบ</button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative w-full max-w-xs space-y-3">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10rem] font-black leading-none tracking-[-0.08em] text-white/[0.08]">DF</div>
              <div className="relative flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a7d85b] text-[#173326]"><CalendarDays size={19} /></span>
                วางแผนงานสวนได้ในที่เดียว
              </div>
              <div className="relative ml-8 flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#82d7b0] text-[#123c2b]"><MapPinned size={19} /></span>
                เห็นภาพรวมทุกแปลง
              </div>
              <div className="relative flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8bc8f1] text-[#123c2b]"><CloudSun size={19} /></span>
                วางแผนตามสภาพอากาศ
              </div>
            </div>
            <div className="hidden w-full max-w-xs rounded-xl border border-white/20 bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">ภาพรวมสวน</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/10 p-3"><p className="text-2xl font-black">24</p><p className="mt-1 text-xs text-white/65">งานที่ต้องทำ</p></div>
                <div className="rounded-lg bg-white/10 p-3"><p className="text-2xl font-black">98%</p><p className="mt-1 text-xs text-white/65">สุขภาพต้น</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#c9ec8d]"><span className="h-2 w-2 rounded-full bg-[#a7d85b]" /> พร้อมเริ่มจัดการสวน</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#f1f5f2] p-4 sm:p-8 lg:p-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What you can do</p>
          <h2 className="mt-3 max-w-md text-2xl font-black leading-tight text-foreground sm:text-4xl">เว็บไซต์นี้ช่วยอะไรคุณได้บ้าง</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">รวมเครื่องมือสำคัญของคนทำสวนไว้ในที่เดียว ตั้งแต่งานประจำวันจนถึงข้อมูลสำหรับตัดสินใจ</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-primary">
            <span className="rounded-full bg-white/80 px-3 py-1.5">วางแผน</span>
            <span className="rounded-full bg-white/80 px-3 py-1.5">ติดตาม</span>
            <span className="rounded-full bg-white/80 px-3 py-1.5">เรียนรู้</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 xl:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.title}
                onClick={() => feature.tab ? onOpenSandbox(feature.tab) : onReadArticles()}
                className="apple-feature-card group relative flex min-h-48 flex-col items-center px-2.5 py-5 text-center transition-all sm:min-h-56 sm:px-5 sm:py-7"
                style={{ backgroundColor: feature.accent + "0d", borderColor: feature.accent + "2e", borderBottomColor: feature.accent, borderBottomWidth: "3px" }}
              >
                <span className="absolute -right-3 top-1/2 z-0 -translate-y-1/2 opacity-[0.12] transition-transform duration-500 group-hover:scale-110" style={{ color: feature.accent }}>
                  <Icon size={128} strokeWidth={1.1} />
                </span>
                <span className="apple-feature-icon relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/65 shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20" style={{ backgroundColor: feature.accent, color: "#ffffff" }}>
                  <Icon size={32} strokeWidth={2.1} />
                </span>
                <div className="relative z-10 mt-5 flex items-center justify-center gap-2">
                  <h3 className="text-sm font-black text-foreground sm:text-base">{feature.title}</h3>
                  {index === 0 && <span className="rounded-full bg-white/75 px-2 py-1 text-[10px] font-black text-primary">เริ่มต้นที่นี่</span>}
                </div>
                <p className="relative z-10 mt-2 max-w-[18rem] text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{feature.description}</p>
                <span className="relative z-10 mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition-transform group-hover:translate-x-1 sm:mt-auto sm:h-8 sm:w-8"><ArrowRight size={14} /></span>
              </button>
            )
          })}
        </div>
      </section>

      {featuredArticles.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Knowledge base</p><h2 className="mt-2 text-xl font-black text-foreground sm:text-3xl">บทความน่ารู้สำหรับชาวสวน</h2></div>
            <button onClick={() => onReadArticles()} className="hidden items-center gap-2 text-sm font-black text-primary sm:inline-flex">ดูทั้งหมด <ArrowRight size={16} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {featuredArticles.map(article => (
              <button key={article.id} onClick={() => onReadArticles(article.id)} className="group overflow-hidden border border-border bg-card text-left transition-colors hover:border-primary">
                <div className="relative aspect-[1.5/1] overflow-hidden"><Image src={article.image} alt={article.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="p-4"><p className="text-xs font-bold text-primary">{article.category}</p><h3 className="mt-2 line-clamp-2 text-base font-black leading-snug text-foreground">{article.title}</h3><p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">อ่านต่อ <ArrowRight size={13} /></p></div>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeProducts.length > 0 && (
        <section className="border-t border-border pt-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Recommended products</p><h2 className="mt-2 text-xl font-black text-foreground sm:text-3xl">สินค้าแนะนำสำหรับสวน</h2></div>
            <button onClick={onOpenProducts} className="hidden items-center gap-2 text-sm font-black text-primary sm:inline-flex">ดูทั้งหมด <ArrowRight size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeProducts.map(product => (
              <button key={product.id} onClick={onOpenProducts} className="group text-left">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted"><Image src={product.image} alt={product.name} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-3 text-sm font-black text-foreground">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col items-start justify-between gap-5 rounded-xl bg-[#e8f0ea] p-5 sm:flex-row sm:items-center sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Start today</p><h2 className="mt-2 text-xl font-black text-foreground sm:text-2xl">พร้อมจัดการสวนให้เป็นระบบแล้วหรือยัง?</h2></div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <button onClick={onLogin} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:bg-[#0f5938] sm:w-auto">เข้าสู่ระบบ <ArrowRight size={16} /></button>
          {!isInstalled && <button onClick={onInstall} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary/25 bg-card px-5 py-3 text-sm font-black text-primary sm:w-auto"><Download size={16} /> ติดตั้งแอป</button>}
        </div>
      </section>
    </div>
  )
}
