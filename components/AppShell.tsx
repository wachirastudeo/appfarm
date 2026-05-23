"use client"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import type { AppUser, Article, Product } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { TreePine, CalendarDays, Coins, BookOpen, Leaf, User, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink, ChevronLeft, ChevronRight, Mail, Phone, ClipboardCheck, MapPinned, Sparkles, CloudRain, Droplets, Sprout, Sun, Wind, MessageSquare, HeartHandshake } from "lucide-react"
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
const FeedbackModal = dynamic(() => import("./FeedbackModal"), { loading: () => null })
const SupportModal = dynamic(() => import("./SupportModal"), { loading: () => null })

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

const GUEST_FEATURES: { title: string; description: string; icon: React.ElementType; tone: string }[] = [
  {
    title: "วางแผนงานสวน",
    description: "สร้างงานประจำวัน จัดลำดับ และตามงานที่ต้องทำ",
    icon: ClipboardCheck,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  },
  {
    title: "จัดการแปลงและต้น",
    description: "เก็บข้อมูลแปลง ตำแหน่ง สุขภาพ และระยะการเติบโต",
    icon: MapPinned,
    tone: "bg-lime-50 text-lime-700 ring-lime-100 dark:bg-lime-400/10 dark:text-lime-200 dark:ring-lime-400/20",
  },
  {
    title: "บันทึกกิจกรรม",
    description: "จดงานรดน้ำ ใส่ปุ๋ย พ่นยา และค่าใช้จ่ายย้อนหลัง",
    icon: CalendarDays,
    tone: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
  },
  {
    title: "ดูภาพรวมการเงิน",
    description: "แยกรายรับรายจ่าย เห็นต้นทุนและผลตอบแทนชัดขึ้น",
    icon: Coins,
    tone: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  },
  {
    title: "เช็กสภาพอากาศ",
    description: "ใช้พยากรณ์ช่วยตัดสินใจงานน้ำและงานดูแลสวน",
    icon: CloudRain,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20",
  },
  {
    title: "คลังความรู้ทุเรียน",
    description: "อ่านบทความเรื่องโรค น้ำ ปุ๋ย ดอก และตลาดก่อนลงมือ",
    icon: BookOpen,
    tone: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
  },
]

const GUEST_HERO_IMAGES = [
  { src: "/images/durian-hero-new.png", alt: "สวนทุเรียนบนเนินเขา" },
  { src: "/images/durian-banner.avif", alt: "สวนทุเรียนเขียวชอุ่ม" },
  { src: "/images/durian-banner.jpg", alt: "ผลทุเรียนในสวน" },
]

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

function AppFooter({ onContactClick }: { onContactClick: () => void }) {
  return (
    <footer className="mt-8 border-t border-[#B9DCC8]/40 bg-[#F4F9F6]/80 px-4 py-6 text-center backdrop-blur-sm sm:py-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Credits */}
        <div className="text-center md:text-left">
          <p className="text-xs font-black text-[#146B3E] tracking-tight">
            Created by Wachira Studio • ระบบจัดการสวนทุเรียน
          </p>
        </div>

        {/* Right Side: Contact */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Social Icons */}
          <div className="flex items-center gap-2 mr-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm ring-1 ring-black/5 hover:bg-[#1877F2] hover:text-white transition-all active:scale-90"
              title="Facebook"
            >
              <svg viewBox="0 0 320 512" className="h-4 w-4 fill-current">
                <path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z" />
              </svg>
            </a>
            <a
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#06C755] shadow-sm ring-1 ring-black/5 hover:bg-[#06C755] hover:text-white transition-all active:scale-90"
              title="LINE"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm ring-1 ring-black/5 hover:bg-black hover:text-white transition-all active:scale-90"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>

          <a
            href="mailto:wachirastudeo@gmail.com"
            className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#146B3E] shadow-sm ring-1 ring-[#B9DCC8]/60 transition-all hover:bg-[#E7F3EC] hover:ring-[#146B3E]/30 active:scale-95"
          >
            <Mail size={14} className="text-[#146B3E]" />
            <span className="truncate">wachirastudeo@gmail.com</span>
          </a>
          <a
            href="tel:0924151449"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#146B3E] shadow-sm ring-1 ring-[#B9DCC8]/60 transition-all hover:bg-[#E7F3EC] hover:ring-[#146B3E]/30 active:scale-95"
          >
            <Phone size={14} className="text-[#146B3E]" />
            <span>092-4151449</span>
          </a>

          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 rounded-xl bg-[#146B3E] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm ring-1 ring-[#146B3E]/10 transition-all hover:bg-[#0F5A34] active:scale-95"
          >
            <MessageSquare size={14} className="text-white" />
            <span>ติดต่อเพิ่มเติม</span>
          </button>
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

interface LeafParticle {
  id: number
  right: string
  top: string
  size: number
  delay: string
  duration: string
  driftX: string
  driftY: string
  rotation: string
  opacity: number
}

function GuestHome({
  articles,
  products,
  onLogin,
  onReadArticles,
  onOpenProducts,
}: {
  articles: Article[]
  products: Product[]
  onLogin: () => void
  onReadArticles: (articleId?: string) => void
  onOpenProducts: () => void
}) {
  const publishedArticles = useMemo(() => articles.filter(article => article.status === "published"), [articles])
  const featuredArticles = useMemo(() => publishedArticles.slice(0, 9), [publishedArticles])
  const activeProducts = useMemo(() => products.filter(product => product.status === "active"), [products])
  const carouselProducts = useMemo(() => activeProducts.length > 0 ? [...activeProducts, ...activeProducts] : [], [activeProducts])
  const productDrag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const leafParticles = useMemo<LeafParticle[]>(() => {
    const arr: LeafParticle[] = []
    for (let i = 0; i < 6; i++) {
      const sizeVal = Math.round(Math.random() * 6 + 10) // 10px to 16px
      const durationVal = Math.round(Math.random() * 6 + 7) // 7s to 13s
      const delayVal = Math.round(Math.random() * -10) // negative delay
      const driftXVal = Math.round(Math.random() * -120 - 150) // -150px to -270px
      const driftYVal = Math.round(Math.random() * 60 + 30) // 30px to 90px
      const rotationVal = Math.round(Math.random() * 180 + 120) // 120deg to 300deg
      const opacityVal = Math.random() * 0.2 + 0.12 // 0.12 to 0.32 opacity

      arr.push({
        id: i,
        right: `${Math.random() * 50 - 5}%`,
        top: `${Math.random() * 60}%`,
        size: sizeVal,
        delay: `${delayVal}s`,
        duration: `${durationVal}s`,
        driftX: `${driftXVal}px`,
        driftY: `${driftYVal}px`,
        rotation: `${rotationVal}deg`,
        opacity: opacityVal,
      })
    }
    return arr
  }, [])

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
      if (document.hidden) return
      const track = productTrack()
      if (!track) return
      normalizeProductScroll(track)
      track.scrollBy({ left: 300, behavior: "smooth" })
    }, 3600)
    return () => window.clearInterval(interval)
  }, [activeProducts.length])

  return (
    <div className="space-y-5 pb-12 sm:space-y-8">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowZoom {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-1.5%, -1%); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.5; transform: scale(1.1) translate(20px, -20px); }
          100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
        }
        @keyframes heroImageSlide {
          0%, 28% { opacity: 1; transform: scale(1.02) translate(0, 0); }
          33%, 95% { opacity: 0; transform: scale(1.09) translate(-1.5%, -1%); }
          100% { opacity: 1; transform: scale(1.02) translate(0, 0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-zoom-bg {
          animation: slowZoom 30s ease-in-out infinite alternate;
        }
        .animate-pulse-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}</style>
      <section className="guest-hero relative isolate overflow-hidden bg-[#0B2417] lg:min-h-svh lg:px-8 lg:py-8">
        <div className="guest-hero-glow pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1F6B42]/35 blur-3xl animate-pulse-glow" />
        <div className="guest-hero-glow pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-[#0F5A34]/40 blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="guest-hero-card relative mx-auto grid w-full overflow-hidden bg-transparent lg:min-h-[calc(100svh-9rem)] lg:max-w-[92rem] lg:rounded-[2rem] lg:border lg:border-[#C9DACD]/30 lg:shadow-[0_28px_70px_rgba(20,107,62,0.12)] lg:ring-1 lg:ring-white/10 lg:grid-cols-[1.08fr_0.92fr] lg:bg-white lg:dark:border-[#31533D]/40 lg:dark:bg-[#14291E] lg:dark:shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
          <div className="order-1 relative overflow-hidden bg-[#D8EFC4] dark:bg-[#102619] lg:order-2 lg:min-h-full">
            <div className="absolute inset-0 overflow-hidden">
              {GUEST_HERO_IMAGES.map((image, index) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 42rem, 100vw"
                  loading={index === 0 ? "eager" : "lazy"}
                  className="guest-hero-image object-cover object-center opacity-0"
                  style={{
                    animation: "heroImageSlide 15s ease-in-out infinite",
                    animationDelay: `${index * 5}s`,
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,27,17,0.14)_0%,rgba(7,27,17,0.2)_28%,rgba(7,27,17,0.72)_68%,rgba(7,27,17,0.92)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.1)_35%,rgba(9,44,25,0.12)),linear-gradient(0deg,rgba(20,107,62,0.22),transparent_55%)] lg:dark:bg-[linear-gradient(90deg,rgba(20,41,30,0.95)_0%,rgba(20,41,30,0.15)_35%,rgba(9,44,25,0.25)),linear-gradient(0deg,rgba(20,107,62,0.32),transparent_55%)] transition-colors duration-1000" />

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {leafParticles.map(p => (
                <div
                  key={p.id}
                  className="absolute"
                  style={{
                    right: p.right,
                    top: p.top,
                    animation: `hero-leaf-drift ${p.duration} infinite linear`,
                    animationDelay: p.delay,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    opacity: p.opacity,
                    "--drift-x": p.driftX,
                    "--drift-y": p.driftY,
                    "--drift-rotation": p.rotation,
                    "--leaf-opacity": p.opacity,
                  } as React.CSSProperties}
                >
                  <Leaf className="text-emerald-600/40 dark:text-emerald-400/30 w-full h-full transform -rotate-12" />
                </div>
              ))}
            </div>

            <div className="relative z-10 px-5 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-8 lg:hidden">
              <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all animate-fade-in-up">
                <h1 className="max-w-[11ch] text-[clamp(1.8rem,7.4vw,2.35rem)] font-black leading-[0.98] text-white delay-200 animate-fade-in-up">
                  จัดการสวนทุเรียน ง่ายขึ้น
                </h1>
                <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-white/80 delay-300 animate-fade-in-up">
                  วางแผนงาน บันทึกแปลง และดูภาพรวมสวนในที่เดียว
                </p>
                <div className="mt-3 flex max-w-md gap-2.5 delay-400 animate-fade-in-up">
                  <button
                    onClick={onLogin}
                    className="guest-hero-cta group inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#143422] shadow-[0_8px_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-[0.98]"
                  >
                    <Sparkles size={16} className="text-[#146B3E] transition-transform group-hover:rotate-12" />
                    เริ่มใช้งาน
                  </button>
                  <button
                    onClick={() => onReadArticles()}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-black text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/30 hover:scale-105 active:scale-[0.98]"
                  >
                    <BookOpen size={16} />
                    บทความ
                  </button>
                </div>
                <div className="mt-4 hidden grid-cols-2 gap-2.5 delay-400 animate-fade-in-up sm:grid">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 hover:bg-black/20 transition-colors">
                    <ClipboardCheck size={18} />
                    <p className="mt-2 text-sm font-black">งานประจำวัน</p>
                    <p className="mt-0.5 text-[11px] font-bold text-white/68">บันทึกและแจ้งเตือน</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 hover:bg-black/20 transition-colors">
                    <MapPinned size={18} />
                    <p className="mt-2 text-sm font-black">ข้อมูลแปลง</p>
                    <p className="mt-0.5 text-[11px] font-bold text-white/68">ตำแหน่งและสุขภาพต้น</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="guest-hero-copy relative z-10 hidden flex-col justify-center px-6 py-8 sm:px-10 lg:order-1 lg:flex lg:px-12 lg:py-10 xl:px-16">
            <h1 className="max-w-[12ch] text-[clamp(2.6rem,4.8vw,5.2rem)] font-black leading-[1.03] text-[#146B3E] dark:text-[#72C08A] lg:max-w-none lg:whitespace-nowrap lg:text-[clamp(2.5rem,3.25vw,3.7rem)] animate-fade-in-up delay-200">
              จัดการสวนทุเรียน ง่ายขึ้น
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-[#527060] dark:text-[#B8D1C0] sm:text-lg animate-fade-in-up delay-300">
              วางแผนงาน บันทึกแปลง และดูภาพรวมสวนในที่เดียว
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-in-up delay-400">
              <button
                onClick={onLogin}
                className="guest-hero-cta group relative overflow-hidden inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146B3E] to-[#1D8A4E] dark:from-[#72C08A] dark:to-[#8ae4a3] px-6 py-3 text-base font-black text-white dark:text-[#0B1B12] shadow-xl shadow-[#146B3E]/30 dark:shadow-[#72C08A]/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#146B3E]/40 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <Sparkles size={18} className="relative z-10 text-[#F4D35E] dark:text-[#146B3E] transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
                <span className="relative z-10">เริ่มใช้งาน</span>
                <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onReadArticles()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#C9DACD] dark:border-[#31533D] bg-white dark:bg-[#1D3A29] px-6 py-3 text-base font-black text-[#143422] dark:text-[#B8D1C0] shadow-sm transition-all hover:-translate-y-1 hover:border-[#146B3E] dark:hover:border-[#72C08A] hover:text-[#146B3E] dark:hover:text-[#72C08A] hover:shadow-lg active:scale-[0.98]"
              >
                <BookOpen size={18} />
                อ่านบทความ
              </button>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 animate-fade-in-up delay-400">
              <div className="group rounded-2xl bg-[#F2F8F4] dark:bg-[#1D3A29]/50 p-4 text-[#146B3E] dark:text-[#72C08A] border border-[#E7F3EC]/50 dark:border-[#31533D]/20 transition-all hover:scale-[1.03] hover:shadow-md hover:bg-white dark:hover:bg-[#254633] duration-300">
                <ClipboardCheck size={24} className="transition-transform group-hover:scale-110 group-hover:-rotate-3" />
                <p className="mt-2 text-base font-black">งานประจำวัน</p>
                <p className="text-xs font-bold text-muted-foreground dark:text-[#B8D1C0]/60 mt-0.5 transition-colors group-hover:text-[#527060] dark:group-hover:text-[#B8D1C0]">บันทึก แจ้งเตือน งานดูแล</p>
              </div>
              <div className="group rounded-2xl bg-[#F2F8F4] dark:bg-[#1D3A29]/50 p-4 text-[#146B3E] dark:text-[#72C08A] border border-[#E7F3EC]/50 dark:border-[#31533D]/20 transition-all hover:scale-[1.03] hover:shadow-md hover:bg-white dark:hover:bg-[#254633] duration-300">
                <MapPinned size={24} className="transition-transform group-hover:scale-110 group-hover:rotate-3" />
                <p className="mt-2 text-base font-black">ข้อมูลแปลง</p>
                <p className="text-xs font-bold text-muted-foreground dark:text-[#B8D1C0]/60 mt-0.5 transition-colors group-hover:text-[#527060] dark:group-hover:text-[#B8D1C0]">แผนที่ ตำแหน่ง สุขภาพต้น</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 text-center sm:mb-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">ทำงานสวนให้เป็นระบบ</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">ฟังก์ชันที่ช่วยให้เริ่มใช้ได้ทันที</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GUEST_FEATURES.map(feature => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/70 bg-white/88 p-4 text-center shadow-[0_10px_28px_rgba(20,107,62,0.06)] transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_16px_36px_rgba(20,107,62,0.1)] dark:bg-card/70 dark:border-border/30"
              >
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${feature.tone}`}>
                  <Icon size={26} strokeWidth={2.2} />
                </div>
                <h3 className="mt-3 text-sm font-black leading-snug text-foreground sm:text-base">{feature.title}</h3>
                <p className="mx-auto mt-1.5 max-w-[12rem] text-xs font-semibold leading-5 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl rounded-[2rem] bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-[0_12px_40px_rgba(20,107,62,0.04)] border border-border/80 dark:border-border/30">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black text-foreground">บทความแนะนำ</h2>
            <p className="text-sm font-bold text-muted-foreground">เริ่มจากความรู้เรื่องน้ำ โรค ปุ๋ย ดอก และตลาดทุเรียน</p>
          </div>
          <button onClick={() => onReadArticles()} className="inline-flex shrink-0 items-center gap-2 pt-1 text-sm font-black text-primary transition-colors hover:text-primary/80">
            ดูบทความทั้งหมด <ArrowRight size={16} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {featuredArticles.map(article => (
            <button
              key={article.id}
              type="button"
              onClick={() => onReadArticles(article.id)}
              className="group w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 sm:w-full sm:min-w-0"
            >
              <div className="relative h-24 overflow-hidden sm:h-28">
                <img src={article.image} alt={article.title} loading="lazy" decoding="async" className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
              </div>
              <div className="p-4">
                <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">{article.category}</span>
                <h3 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-foreground transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-primary transition-all duration-300">
                  อ่านต่อ
                  <ArrowRight size={12} />
                </div>
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
              <p className="text-sm font-bold text-muted-foreground">รวมปุ๋ย ยา สารเคมี และอุปกรณ์ที่ใช้กับสวนทุเรียน</p>
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
                  className="group flex h-[18.5rem] w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 sm:h-[19rem] sm:w-[220px]"
                >
                  <div className="h-24 overflow-hidden sm:h-28 relative">
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{product.category}</span>
                    <h3 className="mt-2 min-h-[3.5rem] line-clamp-2 text-sm font-black leading-snug text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-1.5 min-h-[2.5rem] line-clamp-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-3.5 py-2 text-xs font-extrabold text-primary-foreground shadow-sm transition-all duration-300 group-hover:shadow-md">
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [articleView, setArticleView] = useState<"articles" | "products">("articles")
  const [user, setUser] = useState<AppUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null)
  const [farmLocation, setFarmLocation] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const [farmCoverImage, setFarmCoverImage] = useState<string | null>(null)
  const [farmCoverPosition, setFarmCoverPosition] = useState("50% 50%")
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const store = useAppData(user?.id ?? null)
  const locationStorageKey = user?.id ? `farm_location_${user.id}` : "farm_location_guest"
  const coverStorageKey = user?.id ? `farm_cover_image_${user.id}` : "farm_cover_image_guest"
  const todayTaskCount = useMemo(() => store.data.tasks.filter(task => {
    if (task.status !== "pending") return false
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.getFullYear() === today.getFullYear()
      && taskDate.getMonth() === today.getMonth()
      && taskDate.getDate() === today.getDate()
  }).length, [store.data.tasks])

  const readFarmLocation = useCallback(() => {
    if (!user?.id) {
      setFarmLocation(null)
      return
    }

    if (user.farmLocation) {
      setFarmLocation(user.farmLocation)
      return
    }

    try {
      const saved = localStorage.getItem(locationStorageKey)
      if (saved) {
        setFarmLocation(JSON.parse(saved))
        return
      }
    } catch {
      setFarmLocation(null)
    }

    setFarmLocation(null)
  }, [locationStorageKey, user])

  const readFarmCoverImage = useCallback(() => {
    if (!user?.id) {
      setFarmCoverImage(null)
      setFarmCoverPosition("50% 50%")
      return
    }

    setFarmCoverImage(user.coverImage || localStorage.getItem(coverStorageKey) || null)
    const storedX = localStorage.getItem(`${coverStorageKey}_x`)
    const storedY = localStorage.getItem(`${coverStorageKey}_y`)
    const x = user.coverPositionX ?? (storedX === null || !Number.isFinite(Number(storedX)) ? 50 : Number(storedX))
    const y = user.coverPositionY ?? (storedY === null || !Number.isFinite(Number(storedY)) ? 50 : Number(storedY))
    setFarmCoverPosition(`${x}% ${y}%`)
  }, [coverStorageKey, user])

  const handleCloseSettings = () => {
    readFarmLocation() // re-read location when settings closes
    readFarmCoverImage()
    setShowSettings(false)
  }

  useEffect(() => {
    setIsMounted(true)
    readFarmLocation()
    const onLocationChange = () => readFarmLocation()
    window.addEventListener("farm_location_changed", onLocationChange)
    return () => window.removeEventListener("farm_location_changed", onLocationChange)
  }, [readFarmLocation])

  useEffect(() => {
    readFarmCoverImage()
    const onCoverImageChange = () => readFarmCoverImage()
    window.addEventListener("farm_cover_image_changed", onCoverImageChange)
    return () => window.removeEventListener("farm_cover_image_changed", onCoverImageChange)
  }, [readFarmCoverImage])

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
      if (savedUser) {
        setUser(savedUser)
        setAuthChecking(false)
      }
    }
  }, [store.data.users])

  const handleLoginSuccess = useCallback((nextUser: AppUser) => {
    const previousUserId = localStorage.getItem("durian_current_user")
    if (previousUserId && previousUserId !== nextUser.id) {
      setFarmLocation(null)
      localStorage.removeItem("farm_location")
      localStorage.removeItem("farm_location_guest")
    }
    setUser(nextUser)
    setAuthChecking(false)
    setFailedAvatarUrl(null)
    localStorage.setItem("durian_current_user", nextUser.id)
    setShowAuth(false)
  }, [])

  useEffect(() => {
    if (user) {
      setAuthChecking(false)
      return
    }
    let active = true

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setAuthChecking(false)
      return
    }

    supabase.auth.getUser()
      .then(({ data }) => {
        const authUser = data.user
        const email = authUser?.email
        if (!active || !authUser || !email) return null

        const fullName = typeof authUser.user_metadata.full_name === "string"
          ? authUser.user_metadata.full_name
          : undefined
        const name = typeof authUser.user_metadata.name === "string"
          ? authUser.user_metadata.name
          : fullName
        const avatarUrl = typeof authUser.user_metadata.avatar_url === "string"
          ? authUser.user_metadata.avatar_url
          : undefined
        const pictureUrl = typeof authUser.user_metadata.picture === "string"
          ? authUser.user_metadata.picture
          : undefined
        const avatar = avatarUrl || pictureUrl

        return store.upsertOAuthUser({
          email,
          name,
          provider: authUser.app_metadata.provider || "google",
          avatar,
        })
      })
      .then(nextUser => {
        if (!active) return
        if (nextUser) {
          handleLoginSuccess(nextUser)
        } else {
          setAuthChecking(false)
        }
      })
      .catch(() => {
        // Keep the existing email login flow available if Supabase Auth is unavailable.
        if (active) setAuthChecking(false)
      })

    return () => {
      active = false
    }
  }, [handleLoginSuccess, store, user])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("durian_current_user")
    setUser(null)
    setAuthChecking(false)
    try {
      createClient().auth.signOut().catch(() => undefined)
    } catch {
      // Local-only mode has no Supabase client to sign out from.
    }
    if (!["dashboard", "articles"].includes(activeTab)) setActiveTab("dashboard")
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
          onLogin={() => setShowAuth(true)}
          onReadArticles={openArticles}
          onOpenProducts={openProducts}
        />
      )
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenArticle={openArticles} onOpenSettings={() => setShowSettings(true)} onOpenProducts={openProducts} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} locationStorageKey={locationStorageKey} onUpdateFarmLocation={farmLocation => store.updateUser(user!.id, { farmLocation })} coverImage={farmCoverImage} coverPosition={farmCoverPosition} userName={user?.name} />
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
        return <Articles articles={store.data.articles} products={store.data.products} initialArticleId={selectedArticleId} initialView={articleView} savedArticleIds={user?.savedArticleIds} savedArticlesStorageKey={user?.id ? `durian_saved_articles_${user.id}` : "durian_saved_articles_guest"} onSavedArticleIdsChange={savedArticleIds => user ? store.updateUser(user.id, { savedArticleIds }) : Promise.resolve()} onViewChange={setArticleView} onArticleSelect={setSelectedArticleId} />
      case "admin":
        if (user?.role !== "admin") return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenArticle={openArticles} onOpenSettings={() => setShowSettings(true)} onOpenProducts={openProducts} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} locationStorageKey={locationStorageKey} onUpdateFarmLocation={farmLocation => store.updateUser(user!.id, { farmLocation })} coverImage={farmCoverImage} coverPosition={farmCoverPosition} userName={user?.name} />
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

  const siteName = user?.farmName || store.data.siteSettings.siteName || "สวนทุเรียน"
  const tagline = store.data.siteSettings.tagline || "Smart Orchard"
  const logoUrl = store.data.siteSettings.logoUrl

  if (!user) {
    if (authChecking) return <AppShellSkeleton />

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
                onClick={() => setShowSupportModal(true)}
                aria-label="สนับสนุนเว็บนี้"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#CFE3D5] bg-white text-sm font-black text-[#146B3E] transition-colors hover:bg-[#E7F3EC] sm:w-auto sm:gap-2 sm:px-3 sm:py-2 dark:border-[#31533D] dark:bg-[#1D3A29] dark:text-[#72C08A] dark:hover:bg-[#244332]"
              >
                <HeartHandshake size={16} />
                <span className="hidden sm:inline">เลี้ยงกาแฟ</span>
              </button>
              <button
                onClick={() => setShowAuth(true)}
                aria-label="เข้าสู่ระบบ"
                className="inline-flex h-10 w-auto items-center justify-center gap-2 rounded-2xl bg-[#146B3E] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,107,62,0.18)] transition-all hover:bg-[#0F5A34] active:scale-[0.98]"
              >
                <span>เข้าสู่ระบบ</span>
                <ArrowRight size={16} className="hidden sm:block" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {activeTab === "articles" ? (
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-8 md:py-6">
              <Articles articles={store.data.articles} products={store.data.products} initialArticleId={selectedArticleId} initialView={articleView} savedArticlesStorageKey="durian_saved_articles_guest" guestMobileRail onViewChange={setArticleView} onArticleSelect={setSelectedArticleId} />
            </div>
          ) : (
            <GuestHome
              articles={store.data.articles}
              products={store.data.products}
              onLogin={() => setShowAuth(true)}
              onReadArticles={openArticles}
              onOpenProducts={openProducts}
            />
          )}
          <AppFooter onContactClick={() => setShowFeedbackModal(true)} />
        </main>

        {showAuth && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            onLoginSuccess={handleLoginSuccess}
            authenticateUser={store.authenticateUser}
            addUser={store.addUser}
            resetPassword={store.resetPassword}
          />
        )}
        {showFeedbackModal && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
          />
        )}
        {showSupportModal && (
          <SupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            onOpenContact={() => setShowFeedbackModal(true)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-transparent flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/75 dark:bg-[#0F1F17]/75 backdrop-blur-md px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex items-center justify-between gap-2 shrink-0 border-b border-[#DDEBE1]/40 dark:border-[#31533D]/45 shadow-[0_8px_30px_rgba(20,107,62,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
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
          <button
            onClick={() => setShowSupportModal(true)}
            aria-label="สนับสนุนเว็บนี้"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#146B3E] ring-1 ring-[#CFE3D5] transition-colors hover:bg-[#E7F3EC] sm:w-auto sm:gap-2 sm:px-3 sm:py-2 dark:bg-[#1D3A29] dark:text-[#72C08A] dark:ring-[#31533D] dark:hover:bg-[#244332]"
          >
            <HeartHandshake size={18} />
            <span className="hidden text-sm font-black leading-none sm:inline">เลี้ยงกาแฟ</span>
          </button>
          {user && (
            <div className="contents animate-in fade-in duration-300">
              <button
                onClick={() => setActiveTab("operations")}
                className="relative flex items-center gap-1.5 rounded-xl bg-[#E7F3EC] px-2 sm:px-3 py-2 text-[#146B3E] ring-1 ring-[#CFE3D5] transition-colors hover:bg-[#D9EEE1]"
                title={todayTaskCount > 0 ? `วันนี้มีงาน ${todayTaskCount} งาน` : "วันนี้ไม่มีงาน"}
              >
                <AlertTriangle size={14} />
                <span className="font-bold text-sm leading-none">{todayTaskCount}</span>
                <span className="hidden sm:inline text-xs font-medium text-[#527060]">งานวันนี้</span>
                {todayTaskCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white animate-in fade-in duration-500 delay-150" />
                )}
              </button>
            </div>
          )}
          {/* Profile / Login button */}
          {user ? (
            <button
              onClick={() => setShowSettings(true)}
              aria-label="เปิดตั้งค่า"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white p-0.5 shadow-sm ring-1 ring-[#CFE3D5] transition-colors hover:bg-[#F4F9F6]"
            >
              {user.avatar && user.avatar !== failedAvatarUrl
                ? <img src={user.avatar} alt={user.name} onError={() => setFailedAvatarUrl(user.avatar ?? null)} className="h-10 w-10 rounded-full object-cover" />
                : <div className="h-10 w-10 rounded-full bg-[#E7F3EC] flex items-center justify-center">
                  <span className="text-[#146B3E] text-sm font-bold">{user.name[0]}</span>
                </div>}
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              aria-label="เข้าสู่ระบบ"
              className="rounded-xl bg-[#146B3E] px-3.5 py-2 text-sm font-black text-white shadow-sm ring-1 ring-[#146B3E]/10 transition-colors hover:bg-[#0F5A34]"
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="relative z-10 flex min-w-0 flex-1 overflow-hidden">
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
        <main className="min-w-0 flex-1 overflow-y-auto bg-transparent pb-20 lg:pb-0">
          <div
            className="mx-auto w-full min-w-0 max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-8 md:py-6"
          >
            <div key={activeTab} className="animate-in fade-in duration-200">
              {renderContent()}
            </div>
          </div>
          <AppFooter onContactClick={() => setShowFeedbackModal(true)} />
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
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={handleCloseSettings}
          siteSettings={store.data.siteSettings}
          installPrompt={installPrompt}
          onInstallPromptUsed={() => setInstallPrompt(null)}
          currentUser={user}
          locationStorageKey={locationStorageKey}
          coverStorageKey={coverStorageKey}
          onUpdateCover={changes => store.updateUser(user.id, changes)}
          onUpdateFarmProfile={changes => store.updateUser(user.id, changes)}
          onLogout={handleLogout}
        />
      )}

      {/* Auth / Login Modal */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
          authenticateUser={store.authenticateUser}
          addUser={store.addUser}
          resetPassword={store.resetPassword}
        />
      )}

      {/* Feedback / Contact Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
      {showSupportModal && (
        <SupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          onOpenContact={() => setShowFeedbackModal(true)}
        />
      )}
    </div>
  )
}
