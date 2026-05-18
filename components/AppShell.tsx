"use client"
import { useRef, useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import Dashboard from "./Dashboard"
import PlotManagement from "./PlotManagement"
import Operations from "./Operations"
import Finance from "./Finance"
import Articles from "./Articles"
import AdminPanel from "./AdminPanel"
import type { AppUser, Article, Product } from "@/lib/store"
import { TreePine, CalendarDays, Coins, BookOpen, Leaf, Settings as SettingsIcon, User, AlertTriangle, ShieldCheck, Lock, ArrowRight, Sparkles, CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, Mail } from "lucide-react"
import Settings from "./Settings"
import AuthModal from "./AuthModal"
import ProfileModal from "./ProfileModal"
import DurianIcon from "./DurianIcon"
import { Skeleton } from "./ui/skeleton"

type Tab = "dashboard" | "plots" | "operations" | "finance" | "articles" | "admin"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "หน้าหลัก", icon: DurianIcon },
  { id: "plots", label: "แปลง", icon: TreePine },
  { id: "operations", label: "งาน", icon: CalendarDays },
  { id: "finance", label: "การเงิน", icon: Coins },
  { id: "articles", label: "บทความ", icon: BookOpen },
]

const MOBILE_TABS = TABS.slice(0, 4) // Show only 4 tabs on mobile

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.4V3.4c-.7-.1-1.4-.2-2.1-.2-2.2 0-3.7 1.3-3.7 3.8v1.4H8.6V11H11v9.8h3.1V11h2.3l.4-2.6h-2.6Z" />
    </svg>
  )
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 3.4c-5 0-9 3.2-9 7.2 0 3.6 3.2 6.6 7.5 7.1.3.1.7.2.8.5.1.3.1.8 0 1.1l-.1.8c0 .2-.1.9.8.5.9-.4 4.7-2.8 6.5-4.8 1.2-1.3 1.7-2.6 1.7-4.1C21 6.6 17 3.4 12 3.4Zm-3.5 9.8H6.3V8.4h1.1v3.8h1.1v1Zm2 0H9.4V8.4h1.1v4.8Zm4.8 0h-1.1l-2-2.7v2.7h-1.1V8.4h1.1l2 2.7V8.4h1.1v4.8Zm3.3-3.8h-1.7v.8h1.5v1h-1.5v1h1.7v1h-2.8V8.4h2.8v1Z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16 3.2c.3 2 1.5 3.4 3.5 3.6v3c-1.2 0-2.4-.4-3.5-1.1v5.5c0 3-2 5.2-5 5.2-2.8 0-5-2.1-5-4.9s2.2-4.9 5-4.9c.3 0 .6 0 .9.1v3.1c-.3-.1-.6-.2-.9-.2-1.1 0-2 .8-2 1.9s.9 1.9 2 1.9 2-.8 2-2.2v-11h3Z" />
    </svg>
  )
}

function AppFooter() {
  const socialLinks = [
    { label: "Facebook", icon: FacebookIcon },
    { label: "LINE", icon: LineIcon },
    { label: "TikTok", icon: TikTokIcon },
  ]

  return (
    <footer className="mt-4 flex min-h-14 items-center justify-center border-t border-border/80 bg-background/95 px-2 py-2 text-center">
      <div className="flex min-w-0 items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground sm:gap-2 sm:text-sm">
        <span className="min-w-0 truncate">เครดิตผู้จัดทำ Wachira Studio</span>
        <a
          href="mailto:wachirastudeo@gmail.com"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-[#E7F3EC] sm:gap-1.5 sm:px-2.5 sm:py-1.5"
        >
          <Mail size={14} />
          <span className="hidden min-[420px]:inline">wachirastudeo@gmail.com</span>
        </a>
        {socialLinks.map(({ label, icon: Icon }) => (
          <span
            key={label}
            title={label}
            aria-label={label}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#146B3E] text-white shadow-sm ring-1 ring-[#146B3E]/10 sm:h-8 sm:w-8"
          >
            <Icon className="h-4 w-4" />
          </span>
        ))}
      </div>
    </footer>
  )
}

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative z-20 bg-white px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex items-center justify-between gap-2 shrink-0 border-b border-[#DDEBE1]">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl bg-[#E7F3EC]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-[#E7F3EC]" />
            <Skeleton className="h-3 w-20 bg-[#E7F3EC]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-xl bg-[#E7F3EC]" />
          <Skeleton className="h-9 w-9 rounded-xl bg-[#E7F3EC]" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-2 bg-[#146B3E] p-3">
          <Skeleton className="mb-2 h-4 w-24 bg-white/20" />
          {[1, 2, 3, 4, 5].map(item => (
            <Skeleton key={item} className="h-14 rounded-xl bg-white/18" />
          ))}
        </aside>
        <main className="flex-1 overflow-hidden p-3 sm:p-4 md:p-8">
          <Skeleton className="h-72 rounded-2xl bg-[#E7F3EC]" />
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(item => (
              <Skeleton key={item} className="h-24 rounded-xl bg-[#E7F3EC]" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

function GuestHome({
  articles,
  products,
  siteName,
  tagline,
  onLogin,
  onReadArticles,
  onOpenProducts,
}: {
  articles: Article[]
  products: Product[]
  siteName: string
  tagline: string
  onLogin: () => void
  onReadArticles: (articleId?: string) => void
  onOpenProducts: () => void
}) {
  const publishedArticles = articles.filter(article => article.status === "published")
  const featuredArticles = publishedArticles.slice(0, 6)
  const activeProducts = products.filter(product => product.status === "active")
  const carouselProducts = activeProducts.length > 0 ? [...activeProducts, ...activeProducts] : []
  const productDrag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const productTrack = () => document.getElementById("home-product-carousel")

  const normalizeProductScroll = (track: HTMLElement) => {
    const half = track.scrollWidth / 2
    if (half <= 0) return
    if (track.scrollLeft >= half) track.scrollLeft -= half
    if (track.scrollLeft <= 0) track.scrollLeft += half
  }

  const scrollProducts = (direction: "left" | "right") => {
    const track = productTrack()
    if (!track) return
    normalizeProductScroll(track)
    track.scrollBy({ left: direction === "right" ? 300 : -300, behavior: "smooth" })
  }

  const startProductDrag = (clientX: number) => {
    const track = productTrack()
    if (!track) return
    productDrag.current = { active: true, startX: clientX, scrollLeft: track.scrollLeft }
  }

  const moveProductDrag = (clientX: number) => {
    if (!productDrag.current.active) return
    const track = productTrack()
    if (!track) return
    track.scrollLeft = productDrag.current.scrollLeft - (clientX - productDrag.current.startX)
    normalizeProductScroll(track)
  }

  const stopProductDrag = () => {
    productDrag.current.active = false
  }

  useEffect(() => {
    if (activeProducts.length <= 1) return
    const interval = window.setInterval(() => {
      const track = productTrack()
      if (!track) return
      normalizeProductScroll(track)
      track.scrollBy({ left: 300, behavior: "smooth" })
    }, 3600)
    return () => window.clearInterval(interval)
  }, [activeProducts.length])

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-2xl bg-[#163424] shadow-[0_24px_60px_rgba(15,59,37,0.22)] ring-1 ring-white/70">
        <img
          src="/images/durian-banner.avif"
          alt="สวนทุเรียน"
          className="absolute inset-0 h-full w-full object-cover opacity-95 saturate-125 contrast-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,43,26,0.82),rgba(17,64,37,0.48)_46%,rgba(17,64,37,0.12)_78%,rgba(20,52,34,0.06)),linear-gradient(0deg,rgba(0,0,0,0.42),rgba(0,0,0,0.08)_52%,rgba(255,255,255,0.08))]" />
        <div className="relative grid min-h-[520px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:px-9 lg:py-9">
          <div className="flex max-w-2xl flex-col justify-end">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/86 px-3 py-1.5 text-sm font-black text-[#146B3E] shadow-sm ring-1 ring-white/70 backdrop-blur-md">
              <Sparkles size={16} />
              {tagline}
            </div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              {siteName} สำหรับจัดการสวนทุเรียนและอ่านความรู้ก่อนเริ่มใช้งาน
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/78">
              อ่านบทความได้ทันที ส่วนเมนูจัดการแปลง งาน การเงิน และหลังบ้าน ต้องสมัครหรือเข้าสู่ระบบก่อนเพื่อเก็บข้อมูลสวนของคุณ
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-black text-[#146B3E] shadow-lg shadow-black/10 transition-transform hover:bg-[#E7F3EC] active:scale-[0.98]"
              >
                สมัคร / เข้าสู่ระบบ
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onReadArticles()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/14 px-5 py-3 text-base font-black text-white ring-1 ring-white/22 transition-colors hover:bg-white/22"
              >
                อ่านบทความฟรี
                <BookOpen size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 self-end">
            <div className="rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-white/70 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F3EC] text-[#146B3E]">
                  <Lock size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[#143422]">ต้อง login ก่อนใช้งานระบบสวน</h2>
                  <p className="text-sm font-semibold text-[#527060]">ข้อมูลส่วนตัวและข้อมูลสวนจะแสดงหลังเข้าสู่ระบบ</p>
                </div>
              </div>
              <div className="grid gap-2">
                {["จัดการแปลงและต้นทุเรียน", "วางแผนงานและบันทึกกิจกรรม", "ดูรายรับรายจ่ายและหลังบ้าน"].map(item => (
                  <div key={item} className="flex items-center gap-2 rounded-xl bg-[#F2F8F4] px-3 py-2 text-sm font-bold text-[#143422]">
                    <CheckCircle2 size={16} className="text-[#146B3E]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeProducts.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card py-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 px-3 sm:px-4">
            <div>
              <h2 className="text-xl font-black text-foreground">ปุ๋ยและยาแนะนำ</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={onOpenProducts} className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:inline-flex">
                ดูทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("left")}
                aria-label="เลื่อนปุ๋ยและยาซ้าย"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("right")}
                aria-label="เลื่อนปุ๋ยและยาขวา"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="product-carousel-mask">
            <div
              id="home-product-carousel"
              className="product-carousel-track flex w-full cursor-grab select-none gap-3 overflow-x-auto px-3 active:cursor-grabbing sm:px-4 scrollbar-hide"
              onMouseDown={event => startProductDrag(event.clientX)}
              onMouseMove={event => moveProductDrag(event.clientX)}
              onMouseUp={stopProductDrag}
              onMouseLeave={stopProductDrag}
              onTouchStart={event => startProductDrag(event.touches[0]?.clientX ?? 0)}
              onTouchMove={event => moveProductDrag(event.touches[0]?.clientX ?? 0)}
              onTouchEnd={stopProductDrag}
              onScroll={event => normalizeProductScroll(event.currentTarget)}
            >
              {carouselProducts.map((product, index) => (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  onClick={onOpenProducts}
                  className="group w-[190px] shrink-0 overflow-hidden rounded-xl border border-border bg-white text-left shadow-sm transition-transform hover:-translate-y-0.5 sm:w-[220px]"
                >
                  <div className="h-24 overflow-hidden sm:h-28">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-black text-primary">{product.category}</span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-foreground">{product.name}</h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-black text-primary-foreground">
                      ดูสินค้า
                      <ExternalLink size={12} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-border sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">บทความแนะนำ อ่านได้ฟรี</h2>
            <p className="text-sm font-bold text-muted-foreground">เริ่มจากความรู้เรื่องน้ำ โรค ปุ๋ย ดอก และตลาดทุเรียน</p>
          </div>
          <button onClick={() => onReadArticles()} className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline">
            ดูบทความทั้งหมด <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => onReadArticles(article.id)}
              className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="h-36 overflow-hidden">
                <img src={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3">
                <span className="text-xs font-black text-primary">{article.category}</span>
                <h3 className="mt-1 line-clamp-2 text-base font-black leading-snug text-foreground">{article.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isMounted, setIsMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [articleView, setArticleView] = useState<"articles" | "products">("articles")
  const [user, setUser] = useState<AppUser | null>(null)
  const [farmLocation, setFarmLocation] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const store = useAppData()
  const todayTaskCount = store.data.tasks.filter(task => {
    if (task.status !== "pending") return false
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.getFullYear() === today.getFullYear()
      && taskDate.getMonth() === today.getMonth()
      && taskDate.getDate() === today.getDate()
  }).length

  const readFarmLocation = () => {
    const saved = localStorage.getItem("farm_location")
    if (saved) {
      setFarmLocation(JSON.parse(saved))
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      // No saved location → silently try browser geolocation as fallback
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFarmLocation({
            lat: parseFloat(pos.coords.latitude.toFixed(4)),
            lon: parseFloat(pos.coords.longitude.toFixed(4)),
            label: "ตำแหน่งปัจจุบัน",
          })
        },
        () => {
          // Permission denied or unavailable — use null, Dashboard will use default
          setFarmLocation(null)
        },
        { enableHighAccuracy: false, timeout: 8000 }
      )
    }
  }

  const handleCloseSettings = () => {
    readFarmLocation() // re-read location when settings closes
    setShowSettings(false)
  }

  useEffect(() => {
    setIsMounted(true)
    readFarmLocation()
    const savedUserId = localStorage.getItem("durian_current_user")
    if (savedUserId) {
      const savedUser = store.data.users.find(u => u.id === savedUserId && u.status === "active")
      if (savedUser) setUser(savedUser)
    }

    const onLocationChange = () => readFarmLocation()
    window.addEventListener("farm_location_changed", onLocationChange)
    return () => window.removeEventListener("farm_location_changed", onLocationChange)
  }, [store.data.users])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
  }, [])

  const handleLoginSuccess = (nextUser: AppUser) => {
    setUser(nextUser)
    localStorage.setItem("durian_current_user", nextUser.id)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("durian_current_user")
    setUser(null)
    if (!["dashboard", "articles"].includes(activeTab)) setActiveTab("dashboard")
  }

  const handleUpdateProfile = (changes: Partial<Pick<AppUser, "name" | "avatar">>) => {
    if (!user) return
    const nextUser = { ...user, ...changes }
    setUser(nextUser)
    store.updateUser(user.id, changes)
  }

  const openProfileFarmData = () => {
    setShowProfile(false)
    setActiveTab("plots")
  }

  const openProfileNotifications = () => {
    setShowProfile(false)
    setShowSettings(true)
  }

  const openArticles = (articleId?: string) => {
    setArticleView("articles")
    setSelectedArticleId(articleId ?? null)
    setActiveTab("articles")
  }

  const openProducts = () => {
    setSelectedArticleId(null)
    setArticleView("products")
    setActiveTab("articles")
  }

  const visibleTabs = user?.role === "admin"
    ? [...TABS, { id: "admin" as const, label: "Admin", icon: ShieldCheck }]
    : user
      ? TABS
      : TABS.filter(tab => tab.id === "dashboard" || tab.id === "articles")

  if (!isMounted) {
    return <AppShellSkeleton />
  }

  const renderContent = () => {
    if (!user && activeTab === "dashboard") {
      return (
        <GuestHome
          articles={store.data.articles}
          products={store.data.products}
          siteName={siteName}
          tagline={tagline}
          onLogin={() => setShowAuth(true)}
          onReadArticles={openArticles}
          onOpenProducts={openProducts}
        />
      )
    }

    if (!user && activeTab !== "articles") {
      return (
        <GuestHome
          articles={store.data.articles}
          products={store.data.products}
          siteName={siteName}
          tagline={tagline}
          onLogin={() => setShowAuth(true)}
          onReadArticles={openArticles}
          onOpenProducts={openProducts}
        />
      )
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenArticle={openArticles} onOpenSettings={() => setShowSettings(true)} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} userName={user?.name} />
      case "plots":
        return (
          <PlotManagement
            data={store.data}
            addPlot={store.addPlot}
            updatePlot={store.updatePlot}
            deletePlot={store.deletePlot}
            addTree={store.addTree}
            updateTree={store.updateTree}
            deleteTree={store.deleteTree}
            bulkUpdateTrees={store.bulkUpdateTrees}
            addActivity={store.addActivity}
            addBatch={store.addBatch}
            addBatchStage={store.addBatchStage}
            updateBatch={store.updateBatch}
            deleteBatch={store.deleteBatch}
          />
        )
      case "operations":
        return <Operations
          data={store.data}
          addTask={store.addTask} updateTask={store.updateTask} deleteTask={store.deleteTask}
          addActivity={store.addActivity} deleteActivity={store.deleteActivity} updateActivity={store.updateActivity}
        />
      case "finance":
        return <Finance data={store.data} addFinance={store.addFinance} deleteFinance={store.deleteFinance} />
      case "articles":
        return <Articles articles={store.data.articles} products={store.data.products} initialArticleId={selectedArticleId} initialView={articleView} />
      case "admin":
        if (user?.role !== "admin") return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenArticle={openArticles} onOpenSettings={() => setShowSettings(true)} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} userName={user?.name} />
        return (
          <AdminPanel
            users={store.data.users}
            articles={store.data.articles}
            products={store.data.products}
            siteSettings={store.data.siteSettings}
            currentUser={user}
            addUser={store.addUser}
            updateUser={store.updateUser}
            deleteUser={store.deleteUser}
            addArticle={store.addArticle}
            updateArticle={store.updateArticle}
            deleteArticle={store.deleteArticle}
            addProduct={store.addProduct}
            updateProduct={store.updateProduct}
            deleteProduct={store.deleteProduct}
            updateSiteSettings={store.updateSiteSettings}
          />
        )
    }
  }

  const siteName = store.data.siteSettings.siteName || "สวนทุเรียน"
  const tagline = store.data.siteSettings.tagline || "Smart Orchard"
  const logoUrl = store.data.siteSettings.logoUrl

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <header className="relative z-20 bg-white px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex items-center justify-between gap-2 shrink-0 border-b border-[#DDEBE1] shadow-[0_10px_28px_rgba(20,107,62,0.10)] overflow-hidden">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity active:scale-95"
        >
          <div className="shrink-0 p-2 sm:p-2.5 bg-[#E7F3EC] rounded-xl shadow-sm ring-1 ring-[#CFE3D5]">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg object-cover" />
            ) : (
              <Leaf size={22} className="text-[#146B3E]" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <h1 className="truncate font-black text-[#146B3E] text-base sm:text-xl tracking-tight leading-none">{siteName}</h1>
            <p className="truncate text-[#527060] text-[10px] sm:text-sm font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5">{tagline}</p>
          </div>
        </button>
        <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
          {user && (
            <>
              <button
                onClick={() => setActiveTab("operations")}
                className="relative flex items-center gap-1.5 rounded-xl bg-[#E7F3EC] px-2 sm:px-3 py-2 text-[#146B3E] ring-1 ring-[#CFE3D5] transition-colors hover:bg-[#D9EEE1]"
                title={todayTaskCount > 0 ? `วันนี้มีงาน ${todayTaskCount} งาน` : "วันนี้ไม่มีงาน"}
              >
                <AlertTriangle size={14} />
                <span className="font-bold text-sm leading-none">{todayTaskCount}</span>
                <span className="hidden sm:inline text-xs font-medium text-[#527060]">งานวันนี้</span>
                {todayTaskCount > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />}
              </button>
              <div className="hidden min-[390px]:flex items-center gap-1.5 bg-[#E7F3EC] rounded-xl px-3 py-2 ring-1 ring-[#CFE3D5]">
                <DurianIcon className="h-4 w-4 text-[#146B3E]" />
                <span className="text-[#146B3E] font-bold text-sm leading-none">{store.data.plots.reduce((s, p) => s + p.trees.length, 0)}</span>
                <span className="text-[#527060] text-xs font-medium">ต้น</span>
              </div>
            </>
          )}
          {/* Profile / Login button */}
          <button
            onClick={() => user ? setShowProfile(true) : setShowAuth(true)}
            aria-label={user ? "เปิดโปรไฟล์" : "เข้าสู่ระบบ"}
            className="p-2 bg-[#146B3E] hover:bg-[#0F5A34] rounded-xl transition-colors shadow-sm ring-1 ring-[#146B3E]/10"
          >
            {user ? (
              user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                : <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{user.name[0]}</span>
                </div>
            ) : (
              <User size={20} className="text-white" />
            )}
          </button>
          {user && (
            <button
              onClick={() => setShowSettings(true)}
              aria-label="ตั้งค่า"
              className="p-2.5 bg-[#146B3E] hover:bg-[#0F5A34] rounded-xl transition-colors shadow-sm ring-1 ring-[#146B3E]/10"
            >
              <SettingsIcon size={20} className="text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-56 bg-[#146B3E] border-r border-white/20 py-4 px-3 gap-1.5 shrink-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.16),14px_0_36px_rgba(47,170,98,0.18)] relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.28),transparent_14rem),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(22,138,75,0.16)_48%,rgba(22,138,75,0.24))]" />
          <p className="relative px-2 pt-2 text-xs font-black text-white/72 uppercase tracking-wider mb-1">เมนูหลัก</p>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative group flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-black transition-all text-left ${activeTab === tab.id
                  ? "bg-white text-[#146B3E] shadow-[0_16px_30px_rgba(20,52,34,0.18)]"
                  : "text-white/92 hover:bg-white/18 hover:text-white"
                  }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${activeTab === tab.id ? "bg-[#E7F3EC] text-[#146B3E]" : "bg-white/18 text-white group-hover:bg-white/26"}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span className="flex-1">{tab.label}</span>
                {activeTab === tab.id && <span className="h-2 w-2 rounded-full bg-[#146B3E]" />}
              </button>
            )
          })}
        </nav>

        {/* Main Content — full width, no extra card */}
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-0 bg-transparent">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6">
            {renderContent()}
            <AppFooter />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Clean pill style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#146B3E]/96 backdrop-blur-xl px-2 py-2 flex items-center gap-1 w-full overflow-x-auto border-t border-white/10 safe-area-bottom scrollbar-hide">
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[4.25rem] flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${isActive ? "bg-white text-[#146B3E] shadow-sm" : "text-white/72 hover:bg-white/16 hover:text-white"
                }`}
            >
              <Icon size={20} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        siteSettings={store.data.siteSettings}
        updateSiteSettings={store.updateSiteSettings}
        installPrompt={installPrompt}
        onInstallPromptUsed={() => setInstallPrompt(null)}
      />

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={handleLoginSuccess}
        authenticateUser={store.authenticateUser}
        addUser={store.addUser}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onLogout={handleLogout}
        onLogin={() => { setShowProfile(false); setShowAuth(true) }}
        onUpdateUser={handleUpdateProfile}
        onOpenFarmData={openProfileFarmData}
        onOpenNotifications={openProfileNotifications}
      />
    </div>
  )
}
