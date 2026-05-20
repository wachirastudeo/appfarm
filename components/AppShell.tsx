"use client"
import dynamic from "next/dynamic"
import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import type { AppUser, Article, Product } from "@/lib/store"
import { TreePine, CalendarDays, Coins, BookOpen, Leaf, Settings as SettingsIcon, User, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink, ChevronLeft, ChevronRight, Mail, ClipboardCheck, MapPinned, Sparkles, CloudRain, Droplets, Sprout, Sun, Wind } from "lucide-react"
import DurianIcon from "./DurianIcon"
import { Skeleton } from "./ui/skeleton"
import AnimatedBackground from "./AnimatedBackground"

const Dashboard = dynamic(() => import("./Dashboard"), { loading: () => <ContentSkeleton /> })
const PlotManagement = dynamic(() => import("./PlotManagement"), { loading: () => <ContentSkeleton /> })
const Operations = dynamic(() => import("./Operations"), { loading: () => <ContentSkeleton /> })
const Finance = dynamic(() => import("./Finance"), { loading: () => <ContentSkeleton /> })
const Articles = dynamic(() => import("./Articles"), { loading: () => <ContentSkeleton /> })
const AdminPanel = dynamic(() => import("./AdminPanel"), { loading: () => <ContentSkeleton /> })
const Settings = dynamic(() => import("./Settings"), { loading: () => null })
const AuthModal = dynamic(() => import("./AuthModal"), { loading: () => null })
const ProfileModal = dynamic(() => import("./ProfileModal"), { loading: () => null })

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

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-56 rounded-2xl bg-[#E7F3EC]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map(item => (
          <Skeleton key={item} className="h-24 rounded-xl bg-[#E7F3EC]" />
        ))}
      </div>
    </div>
  )
}

function AppFooter() {
  return (
    <footer className="mt-8 border-t border-[#B9DCC8]/40 bg-[#F4F9F6]/80 px-4 py-6 text-center backdrop-blur-sm sm:py-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Credits */}
        <div className="text-center md:text-left">
          <p className="text-xs font-black text-[#146B3E] tracking-tight">
            Wachira Studio • ระบบจัดการสวนทุเรียนอัจฉริยะ
          </p>
        </div>

        {/* Right Side: Contact */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:wachirastudeo@gmail.com"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#146B3E] shadow-sm ring-1 ring-[#B9DCC8]/60 transition-all hover:bg-[#E7F3EC] hover:ring-[#146B3E]/30 active:scale-95"
          >
            <Mail size={14} className="text-[#146B3E]" />
            <span>wachirastudeo@gmail.com</span>
          </a>
        </div>
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
  const featuredArticles = publishedArticles.slice(0, 9)
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
    <div className="space-y-8 pb-12">
      <section className="guest-hero relative isolate overflow-hidden bg-[#0B2417] px-4 py-8 sm:px-6 lg:px-8">
        <div className="guest-hero-glow pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1F6B42]/35 blur-3xl" />
        <div className="guest-hero-glow pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-[#0F5A34]/40 blur-3xl" />
        <div className="guest-hero-card relative mx-auto grid min-h-[calc(100svh-9rem)] w-full max-w-[92rem] overflow-hidden rounded-[2rem] bg-white dark:bg-[#14291E] shadow-[0_28px_70px_rgba(20,107,62,0.12)] dark:shadow-[0_28px_70px_rgba(0,0,0,0.5)] border border-[#C9DACD]/30 dark:border-[#31533D]/40 ring-1 ring-white/10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="guest-hero-copy relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
            <div className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#146B3E] dark:text-[#72C08A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F3EC] dark:bg-[#1D3A29]">
                <Leaf size={19} />
              </span>
              {siteName}
            </div>
            <p className="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em] text-[#527060] dark:text-[#B8D1C0]">
              <span className="h-px w-10 bg-[#A8C9B2] dark:bg-[#31533D]" />
              {tagline}
            </p>
            <h1 className="max-w-[12ch] text-[clamp(2.6rem,4.8vw,5.2rem)] font-black leading-[1.03] text-[#146B3E] dark:text-[#72C08A] lg:max-w-none lg:whitespace-nowrap lg:text-[clamp(2.5rem,3.25vw,3.7rem)]">
              จัดการสวนทุเรียน ง่ายขึ้น
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-[#527060] dark:text-[#B8D1C0] sm:text-lg">
              วางแผนงาน บันทึกแปลง และดูภาพรวมสวนในที่เดียว
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onLogin}
                className="guest-hero-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146B3E] to-[#1D8A4E] dark:from-[#72C08A] dark:to-[#8ae4a3] px-6 py-3 text-base font-black text-white dark:text-[#0B1B12] shadow-xl shadow-[#146B3E]/20 dark:shadow-[#72C08A]/10 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Sparkles size={18} className="text-[#F4D35E] dark:text-[#146B3E]" />
                เริ่มใช้งาน
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onReadArticles()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#C9DACD] dark:border-[#31533D] bg-white dark:bg-[#1D3A29] px-6 py-3 text-base font-black text-[#143422] dark:text-[#B8D1C0] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#146B3E] dark:hover:border-[#72C08A] hover:text-[#146B3E] dark:hover:text-[#72C08A]"
              >
                <BookOpen size={18} />
                อ่านบทความ
              </button>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F2F8F4] dark:bg-[#1D3A29]/50 p-4 text-[#146B3E] dark:text-[#72C08A] border border-[#E7F3EC]/50 dark:border-[#31533D]/20 transition-all hover:scale-[1.02] duration-300">
                <ClipboardCheck size={24} />
                <p className="mt-2 text-base font-black">งานประจำวัน</p>
                <p className="text-xs font-bold text-muted-foreground dark:text-[#B8D1C0]/60 mt-0.5">บันทึก แจ้งเตือน งานดูแล</p>
              </div>
              <div className="rounded-2xl bg-[#F2F8F4] dark:bg-[#1D3A29]/50 p-4 text-[#146B3E] dark:text-[#72C08A] border border-[#E7F3EC]/50 dark:border-[#31533D]/20 transition-all hover:scale-[1.02] duration-300">
                <MapPinned size={24} />
                <p className="mt-2 text-base font-black">ข้อมูลแปลง</p>
                <p className="text-xs font-bold text-muted-foreground dark:text-[#B8D1C0]/60 mt-0.5">แผนที่ ตำแหน่ง สุขภาพต้น</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden bg-[#D8EFC4] dark:bg-[#102619] lg:min-h-full">
            <img
              src="/images/durian-banner.avif"
              alt="สวนทุเรียน"
              className="guest-hero-image absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.85),rgba(255,255,255,0.1)_32%,rgba(9,44,25,0.14)),linear-gradient(0deg,rgba(20,107,62,0.22),transparent_55%)] dark:bg-[linear-gradient(90deg,rgba(20,41,30,0.9),rgba(20,41,30,0.15)_32%,rgba(9,44,25,0.25)),linear-gradient(0deg,rgba(20,107,62,0.32),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0">
              <span className="guest-hero-orbit guest-hero-orbit-tree left-[8%] top-[12%]">
                <TreePine size={58} strokeWidth={2.3} />
              </span>
              <span className="guest-hero-orbit guest-hero-orbit-rain right-[8%] top-[25%]">
                <CloudRain size={54} strokeWidth={2.3} />
              </span>
              <span className="guest-hero-orbit guest-hero-orbit-wind left-[14%] top-[47%]">
                <Wind size={56} strokeWidth={2.3} />
              </span>
              <span className="guest-hero-orbit guest-hero-orbit-sun right-[8%] bottom-[25%]">
                <Sun size={56} strokeWidth={2.3} />
              </span>
              <span className="guest-hero-orbit guest-hero-orbit-water left-[8%] bottom-[12%]">
                <Droplets size={52} strokeWidth={2.3} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl rounded-[2rem] bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-[0_12px_40px_rgba(20,107,62,0.04)] border border-border/80 dark:border-border/30">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">บทความแนะนำ</h2>
            <p className="text-sm font-bold text-muted-foreground">เริ่มจากความรู้เรื่องน้ำ โรค ปุ๋ย ดอก และตลาดทุเรียน</p>
          </div>
          <button onClick={() => onReadArticles()} className="inline-flex items-center gap-2 text-sm font-black text-primary hover:text-primary/80 transition-colors">
            ดูบทความทั้งหมด <ArrowRight size={16} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {featuredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => onReadArticles(article.id)}
              className="group shrink-0 w-[240px] sm:w-auto overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30"
            >
              <div className="h-36 overflow-hidden relative">
                <img src={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
              </div>
              <div className="p-4">
                <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{article.category}</span>
                <h3 className="mt-3 line-clamp-2 text-base font-black leading-snug text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeProducts.length > 0 && (
        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md py-6 shadow-[0_12px_40px_rgba(20,107,62,0.04)] dark:border-border/30">
          <div className="mb-4 flex items-center justify-between gap-3 px-5 sm:px-6">
            <div>
              <h2 className="text-2xl font-black text-foreground">ปุ๋ยและยาแนะนำ</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={onOpenProducts} className="hidden rounded-2xl border border-border bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:inline-flex">
                ดูทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("left")}
                aria-label="เลื่อนปุ๋ยและยาซ้าย"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-card text-primary transition-all hover:border-primary/30 hover:bg-muted active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("right")}
                aria-label="เลื่อนปุ๋ยและยาขวา"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/95 hover:scale-105 active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
          <div className="product-carousel-mask">
            <div
              id="home-product-carousel"
              className="product-carousel-track flex w-full cursor-grab select-none gap-4 overflow-x-auto px-5 active:cursor-grabbing sm:px-6 scrollbar-hide"
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
                  className="group w-[190px] shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 sm:w-[220px]"
                >
                  <div className="h-24 overflow-hidden sm:h-28 relative">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{product.category}</span>
                    <h3 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-3.5 py-2 text-xs font-extrabold text-primary-foreground shadow-sm group-hover:shadow-md transition-all duration-300">
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
  const todayTaskCount = useMemo(() => store.data.tasks.filter(task => {
    if (task.status !== "pending") return false
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.getFullYear() === today.getFullYear()
      && taskDate.getMonth() === today.getMonth()
      && taskDate.getDate() === today.getDate()
  }).length, [store.data.tasks])

  const readFarmLocation = useCallback(() => {
    try {
      const saved = localStorage.getItem("farm_location")
      if (saved) {
        setFarmLocation(JSON.parse(saved))
        return
      }
    } catch {
      setFarmLocation(null)
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
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
  }, [])

  const handleCloseSettings = () => {
    readFarmLocation() // re-read location when settings closes
    setShowSettings(false)
  }

  useEffect(() => {
    setIsMounted(true)
    readFarmLocation()
    const onLocationChange = () => readFarmLocation()
    window.addEventListener("farm_location_changed", onLocationChange)
    return () => window.removeEventListener("farm_location_changed", onLocationChange)
  }, [readFarmLocation])

  // Sync URL search parameters to local state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab && ["dashboard", "plots", "operations", "finance", "articles", "admin"].includes(tab)) {
        setActiveTab(tab as Tab)
      }
      const view = params.get("view")
      if (view && ["articles", "products"].includes(view)) {
        setArticleView(view as "articles" | "products")
      }
      const articleId = params.get("articleId")
      if (articleId) {
        setSelectedArticleId(articleId)
      }
    }
  }, [])

  // Sync local state back to URL search parameters
  useEffect(() => {
    if (!isMounted) return
    const url = new URL(window.location.href)
    if (activeTab === "dashboard") {
      url.searchParams.delete("tab")
    } else {
      url.searchParams.set("tab", activeTab)
    }
    
    if (activeTab === "articles") {
      url.searchParams.set("view", articleView)
      if (selectedArticleId) {
        url.searchParams.set("articleId", selectedArticleId)
      } else {
        url.searchParams.delete("articleId")
      }
    } else {
      url.searchParams.delete("view")
      url.searchParams.delete("articleId")
    }
    
    window.history.replaceState({}, "", url.toString())
  }, [activeTab, articleView, selectedArticleId, isMounted])

  useEffect(() => {
    const savedUserId = localStorage.getItem("durian_current_user")
    if (savedUserId) {
      const savedUser = store.data.users.find(u => u.id === savedUserId && u.status === "active")
      if (savedUser) setUser(savedUser)
    }
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

  const visibleTabs = useMemo(() => user?.role === "admin"
    ? [...TABS, { id: "admin" as const, label: "Admin", icon: ShieldCheck }]
    : user
      ? TABS
      : TABS.filter(tab => tab.id === "dashboard" || tab.id === "articles"), [user])

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
        return <Articles articles={store.data.articles} products={store.data.products} initialArticleId={selectedArticleId} initialView={articleView} onViewChange={setArticleView} onArticleSelect={setSelectedArticleId} />
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
  const totalTrees = store.data.plots.reduce((s, p) => s + p.trees.length, 0)

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 border-b border-[#DDEBE1]/50 bg-white/82 px-4 py-3 shadow-[0_8px_30px_rgba(20,107,62,0.06)] backdrop-blur-xl dark:border-[#31533D]/45 dark:bg-[#0F1F17]/82">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex min-w-0 items-center gap-2.5 text-left active:scale-95"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F3EC] text-[#146B3E] ring-1 ring-[#CFE3D5] dark:bg-[#1D3A29] dark:text-[#72C08A] dark:ring-[#31533D]">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="h-7 w-7 rounded-xl object-cover" />
                ) : (
                  <Leaf size={22} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black leading-none text-[#146B3E] dark:text-[#72C08A] sm:text-xl">{siteName}</span>
                <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-widest text-[#527060] dark:text-[#B8D1C0] sm:text-xs">{tagline}</span>
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => openArticles()}
                className="hidden rounded-2xl px-4 py-2 text-sm font-black text-[#146B3E] transition-colors hover:bg-[#E7F3EC] sm:inline-flex dark:text-[#72C08A] dark:hover:bg-white/10"
              >
                บทความ
              </button>
              <button
                onClick={openProducts}
                className="hidden rounded-2xl px-4 py-2 text-sm font-black text-[#146B3E] transition-colors hover:bg-[#E7F3EC] md:inline-flex dark:text-[#72C08A] dark:hover:bg-white/10"
              >
                สินค้าแนะนำ
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#146B3E] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,107,62,0.18)] transition-all hover:bg-[#0F5A34] active:scale-[0.98]"
              >
                เข้าสู่ระบบ
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {activeTab === "articles" ? (
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-8 md:py-6">
              <Articles articles={store.data.articles} products={store.data.products} initialArticleId={selectedArticleId} initialView={articleView} onViewChange={setArticleView} onArticleSelect={setSelectedArticleId} />
            </div>
          ) : (
            <GuestHome
              articles={store.data.articles}
              products={store.data.products}
              siteName={siteName}
              tagline={tagline}
              onLogin={() => setShowAuth(true)}
              onReadArticles={openArticles}
              onOpenProducts={openProducts}
            />
          )}
          <AppFooter />
        </main>

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
          authenticateUser={store.authenticateUser}
          addUser={store.addUser}
          resetPassword={store.resetPassword}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-transparent flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      {/* Top Header Bar */}
      <header className="relative z-20 bg-white/75 dark:bg-[#0F1F17]/75 backdrop-blur-md px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex items-center justify-between gap-2 shrink-0 border-b border-[#DDEBE1]/40 dark:border-[#31533D]/45 shadow-[0_8px_30px_rgba(20,107,62,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity active:scale-95"
        >
          <div className="shrink-0 p-2 sm:p-2.5 bg-[#E7F3EC] dark:bg-[#1D3A29] rounded-xl shadow-sm ring-1 ring-[#CFE3D5] dark:ring-[#31533D] animate-float-sway">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg object-cover" />
            ) : (
              <Leaf size={22} className="text-[#146B3E] dark:text-[#72C08A]" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <h1 className="truncate font-black text-[#146B3E] dark:text-[#72C08A] text-base sm:text-xl tracking-tight leading-none">{siteName}</h1>
            <p className="truncate text-[#527060] dark:text-[#B8D1C0] text-[10px] sm:text-sm font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5">{tagline}</p>
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
                <span className="text-[#146B3E] font-bold text-sm leading-none">{totalTrees}</span>
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
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-56 bg-white/40 dark:bg-black/15 backdrop-blur-md border-r border-[#DDEBE1]/40 dark:border-[#31533D]/25 py-4 px-3 gap-1.5 shrink-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.1),10px_0_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <p className="relative px-2 pt-2 text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">เมนูหลัก</p>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative group flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-black transition-all text-left ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(20,107,62,0.12)] dark:shadow-[0_12px_24px_rgba(114,192,138,0.18)]"
                  : "text-foreground/80 dark:text-foreground/70 hover:bg-black/5 dark:hover:bg-white/8 hover:text-primary dark:hover:text-white"
                  }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${activeTab === tab.id ? "bg-primary-foreground/15 text-primary-foreground" : "bg-black/5 dark:bg-white/10 text-foreground/80 dark:text-foreground/70 group-hover:bg-primary/10 dark:group-hover:bg-white/15"}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span className="flex-1">{tab.label}</span>
                {activeTab === tab.id && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </button>
            )
          })}
        </nav>

        {/* Main Content — full width, no extra card */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-transparent">
          <div 
            key={activeTab}
            className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 animate-fade-in-up"
          >
            {renderContent()}
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Clean pill style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0F1F17]/85 backdrop-blur-xl px-2 py-2 flex items-center gap-1 w-full overflow-x-auto border-t border-[#DDEBE1]/40 dark:border-[#31533D]/30 safe-area-bottom scrollbar-hide shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[4.25rem] flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 dark:text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
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
        resetPassword={store.resetPassword}
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
