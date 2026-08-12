"use client"

import { useEffect, useRef } from "react"
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

const GUEST_RECOMMENDED_PRODUCTS: Product[] = [
  {
    id: "guest-product-moisture",
    name: "เครื่องวัดความชื้นดิน",
    category: "อุปกรณ์สวน",
    image: "/images/articles/article_watering_1778037948644.avif",
    priceLabel: "ดูรายละเอียด",
    description: "เช็กความชื้นก่อนวางแผนให้น้ำในแต่ละแปลง",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-bag",
    name: "ถุงห่อผลทุเรียน",
    category: "อุปกรณ์สวน",
    image: "/images/articles/article_flowering_1778039300000_1778039688657.avif",
    priceLabel: "ดูรายละเอียด",
    description: "ช่วยดูแลผลผลิตและลดความเสี่ยงจากแมลงในสวน",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-pruner",
    name: "กรรไกรตัดแต่งกิ่ง",
    category: "เครื่องมือ",
    image: "/images/articles/article_pruning_1778039300000_1778039722927.avif",
    priceLabel: "ดูรายละเอียด",
    description: "อุปกรณ์สำหรับจัดทรงพุ่มและดูแลกิ่งในสวน",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-sprayer",
    name: "ชุดหัวพ่นละอองละเอียด",
    category: "อุปกรณ์สวน",
    image: "/images/articles/article_disease_1778037967060.avif",
    priceLabel: "ดูรายละเอียด",
    description: "ช่วยกระจายน้ำและสารดูแลสวนได้สม่ำเสมอ",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-fertilizer",
    name: "ปุ๋ยบำรุงผลสูตรเข้มข้น",
    category: "ปุ๋ยและธาตุอาหาร",
    image: "/images/articles/article_fertilizer_1778039300000_1778039705364.avif",
    priceLabel: "ดูรายละเอียด",
    description: "ตัวช่วยเสริมการเติบโตในช่วงขยายผล",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-trap",
    name: "กับดักแมลงในสวน",
    category: "ดูแลโรคและแมลง",
    image: "/images/articles/article_disease_1778037967060.avif",
    priceLabel: "ดูรายละเอียด",
    description: "ลดแมลงรบกวนโดยไม่ต้องพ่นสารบ่อยเกินไป",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "guest-product-gloves",
    name: "ถุงมือทำสวนกันหนาม",
    category: "อุปกรณ์ป้องกัน",
    image: "/images/articles/article_pruning_1778039300000_1778039722927.avif",
    priceLabel: "ดูรายละเอียด",
    description: "ปกป้องมือระหว่างตัดแต่งกิ่งและดูแลต้น",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function GuestHomeSkeleton() {
  return (
    <div className="guest-loading-skeleton mx-auto w-full max-w-7xl space-y-5 px-3 pb-12 pt-2 sm:space-y-8 sm:px-5 sm:pb-16 sm:pt-3 lg:px-0" aria-hidden="true">
      <div className="min-h-[19rem] animate-pulse rounded-[1.25rem] bg-[#dfe9e2] p-5 sm:min-h-[27rem] sm:p-10">
        <div className="flex h-full max-w-xl flex-col justify-end gap-4">
          <div className="h-3 w-40 rounded-full bg-[#c5d6c9]" />
          <div className="h-10 w-4/5 rounded-xl bg-[#c5d6c9] sm:h-16" />
          <div className="h-4 w-full max-w-md rounded-full bg-[#c5d6c9]" />
          <div className="mt-2 h-10 w-28 rounded-lg bg-[#b4d56a]" />
        </div>
      </div>
      <div className="rounded-[1.25rem] bg-[#f1f5f2] p-4 sm:p-8">
        <div className="h-5 w-48 animate-pulse rounded-full bg-[#d7e4da]" />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-white/75 sm:h-52" />)}
        </div>
      </div>
    </div>
  )
}

export default function MinimalGuestHome({ articles, products, onLogin, onReadArticles, onOpenProducts, onOpenSandbox, onInstall, isInstalled }: Props) {
  const featuredArticles = articles.filter(article => article.status === "published").slice(0, 6)
  const activeProducts = [...products.filter(product => product.status === "active"), ...GUEST_RECOMMENDED_PRODUCTS].slice(0, 10)
  const productRailRef = useRef<HTMLDivElement>(null)
  const isDraggingProducts = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScroll = useRef(0)

  const scrollProducts = (direction: 1 | -1) => {
    productRailRef.current?.scrollBy({ left: direction * 240, behavior: "smooth" })
  }

  const handleProductPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !productRailRef.current) return
    isDraggingProducts.current = true
    dragStartX.current = event.clientX
    dragStartScroll.current = productRailRef.current.scrollLeft
    productRailRef.current.setPointerCapture(event.pointerId)
  }

  const handleProductPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingProducts.current || !productRailRef.current) return
    productRailRef.current.scrollLeft = dragStartScroll.current - (event.clientX - dragStartX.current)
  }

  const handleProductPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingProducts.current || !productRailRef.current) return
    isDraggingProducts.current = false
    productRailRef.current.releasePointerCapture(event.pointerId)
  }

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".home-minimal > section"))
    if (!sections.length) return

    sections[0].classList.add("guest-reveal-visible")
    if (!("IntersectionObserver" in window)) {
      sections.forEach(section => section.classList.add("guest-reveal-visible"))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("guest-reveal-visible")
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" })

    sections.slice(1).forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div data-page="home-minimal" className="home-minimal mx-auto w-full max-w-7xl space-y-5 px-3 pb-12 pt-2 sm:space-y-8 sm:px-5 sm:pb-16 sm:pt-3 lg:px-0">
      <section className="home-minimal-hero relative overflow-hidden rounded-[1.25rem] bg-[#123c2b] text-white">
        <Image src="/images/durian-hero-new.png" alt="สวนทุเรียนสีเขียว" fill priority sizes="(min-width: 1024px) 1200px, 100vw" className="object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,29,0.94),rgba(10,43,29,0.62)_52%,rgba(10,43,29,0.12))]" />
        <div className="guest-hero-mobile-spark absolute right-4 top-16 z-[1] flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-[#a7d85b]/85 text-[#173326] shadow-lg lg:hidden">
          <Sprout size={22} strokeWidth={2.4} />
        </div>
        <div className="relative grid min-h-[24rem] items-start gap-8 p-5 pt-10 sm:min-h-[32rem] sm:items-end sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-14">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#b9d9bf]">Smart orchard management</p>
            <h1 className="max-w-xl text-3xl font-black leading-[1.08] tracking-tight sm:text-6xl">จัดการสวนทุเรียนให้เป็นเรื่องง่าย</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/78 sm:mt-6 sm:text-lg sm:leading-7">วางแผนงาน ดูแลแปลง บันทึกกิจกรรม และติดตามการเงินของสวนในระบบเดียว</p>
            <div className="mt-6 flex w-full flex-row justify-center gap-2 sm:mt-8 sm:w-auto sm:flex-wrap sm:gap-3">
              <button onClick={onLogin} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#a7d85b] px-5 py-3 text-sm font-black text-[#173326] transition-colors hover:bg-white sm:w-auto">เริ่มใช้งาน <ArrowRight size={17} /></button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative w-full max-w-xs space-y-3">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10rem] font-black leading-none tracking-[-0.08em] text-white/[0.08]">DF</div>
              <div className="guest-hero-pill relative flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a7d85b] text-[#173326]"><CalendarDays size={19} /></span>
                วางแผนงานสวนได้ในที่เดียว
              </div>
              <div className="guest-hero-pill relative ml-8 flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#82d7b0] text-[#123c2b]"><MapPinned size={19} /></span>
                เห็นภาพรวมทุกแปลง
              </div>
              <div className="guest-hero-pill relative flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
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
          {FEATURES.map(feature => {
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
          <div className="mb-3 flex justify-end gap-2">
            <button onClick={() => scrollProducts(-1)} aria-label="เลื่อนสินค้าก่อนหน้า" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform hover:-translate-x-0.5 active:scale-95">
              <ArrowRight size={15} className="rotate-180" />
            </button>
            <button onClick={() => scrollProducts(1)} aria-label="เลื่อนสินค้าถัดไป" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform hover:translate-x-0.5 active:scale-95">
              <ArrowRight size={15} />
            </button>
          </div>
          <div
            ref={productRailRef}
            onPointerDown={handleProductPointerDown}
            onPointerMove={handleProductPointerMove}
            onPointerUp={handleProductPointerUp}
            onPointerCancel={handleProductPointerUp}
            className="product-rail flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto pb-2 active:cursor-grabbing"
          >
            {activeProducts.map(product => (
              <button key={product.id} onClick={onOpenProducts} className="group min-w-[10.5rem] snap-start text-left sm:min-w-[13rem]">
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
