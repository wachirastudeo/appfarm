"use client"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import type { AppUser, Article, Product } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { SHOW_RECOMMENDED_PRODUCTS } from "@/lib/feature-flags"
import { TreePine, CalendarDays, Coins, BookOpen, Leaf, User, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink, ChevronLeft, ChevronRight, Mail, Phone, ClipboardCheck, MapPinned, Sparkles, CloudRain, Droplets, Sprout, Sun, Wind, MessageSquare, HeartHandshake, Check, Smartphone } from "lucide-react"
import DurianIcon from "./DurianIcon"
import DurianLogo from "./DurianLogo"
import UserAvatarImage from "./UserAvatarImage"
import { Skeleton } from "./ui/skeleton"
import AnimatedBackground from "./AnimatedBackground"
import { resolveOAuthProfileFromAuthUser } from "@/lib/oauth-profile"
import Settings from "./Settings"

const Dashboard = dynamic(() => import("./Dashboard"), { loading: () => <ContentSkeleton /> })
const PlotManagement = dynamic(() => import("./PlotManagement"), { loading: () => <ContentSkeleton /> })
const Operations = dynamic(() => import("./Operations"), { loading: () => <ContentSkeleton /> })
const Finance = dynamic(() => import("./Finance"), { loading: () => <ContentSkeleton /> })
const Articles = dynamic(() => import("./Articles"), { loading: () => <ContentSkeleton /> })
const AdminPanel = dynamic(() => import("./AdminPanel"), { loading: () => <ContentSkeleton /> })
const AuthModal = dynamic(() => import("./AuthModal"), { loading: () => null })
const FeedbackModal = dynamic(() => import("./FeedbackModal"), { loading: () => null })
const SupportModal = dynamic(() => import("./SupportModal"), { loading: () => null })
const SandboxModal = dynamic(() => import("./SandboxModal"), { loading: () => null })

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

const HERO_BENEFITS: { label: string; icon: React.ElementType }[] = [
  { label: "วางแผนงาน", icon: CalendarDays },
  { label: "บันทึกแปลง", icon: MapPinned },
  { label: "ดูภาพรวมสวน", icon: ClipboardCheck },
]

function getOAuthErrorFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const queryParams = new URLSearchParams(window.location.search)
  const error = hashParams.get("error") || queryParams.get("auth_error") || queryParams.get("error")
  if (!error) return null

  const description =
    hashParams.get("error_description") ||
    queryParams.get("auth_error_description") ||
    queryParams.get("error_description") ||
    "ไม่สามารถเข้าสู่ระบบด้วยผู้ให้บริการภายนอกได้"

  const normalized = description.replace(/\+/g, " ")
  if (/user profile from external provider/i.test(normalized)) {
    return [
      "เข้าสู่ระบบไม่สำเร็จ: Supabase ดึงโปรไฟล์จาก LINE ไม่ได้",
      "1) Custom provider ต้องเป็น Manual OAuth2 (Provider ID: line)",
      "2) โค้ดใช้ custom:line — อย่าใช้ provider ชื่อ line ถ้าไม่มี built-in LINE",
      "3) Callback ใน LINE Developers:",
      "https://hpyoyjpqitpvgckxnlww.supabase.co/auth/v1/callback",
    ].join("\n")
  }

  return normalized
}

const GUEST_FEATURES: {
  title: string
  description: string
  kicker: string
  icon: React.ElementType
  tone: string
  shadowColor: string
  themeColor: string
  surface: string
  hoverClass: string
  details: string[]
}[] = [
  {
    title: "วางแผนงานสวน",
    description: "สร้างงานประจำวัน จัดลำดับ และตามงานที่ต้องทำ",
    kicker: "งานวันนี้",
    icon: ClipboardCheck,
    tone: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/50 dark:ring-emerald-400/40",
    shadowColor: "rgba(16, 185, 129, 0.45)",
    themeColor: "#10B981",
    surface: "from-emerald-50 via-white to-teal-50 dark:from-emerald-950/25 dark:via-[#14291E] dark:to-teal-950/20",
    hoverClass: "hover-bounce-subtle",
    details: ["งานด่วน", "เช็กสถานะ", "เตือนซ้ำ"],
  },
  {
    title: "จัดการแปลงและต้น",
    description: "เก็บข้อมูลแปลง ตำแหน่ง สุขภาพ และระยะการเติบโต",
    kicker: "ข้อมูลสวน",
    icon: MapPinned,
    tone: "bg-gradient-to-br from-lime-500 to-green-600 text-white ring-2 ring-lime-400/50 dark:ring-lime-400/40",
    shadowColor: "rgba(132, 204, 22, 0.45)",
    themeColor: "#84CC16",
    surface: "from-lime-50 via-white to-green-50 dark:from-lime-950/20 dark:via-[#14291E] dark:to-green-950/20",
    hoverClass: "hover-expand-subtle",
    details: ["แผนที่", "สุขภาพต้น", "ระยะโต"],
  },
  {
    title: "บันทึกกิจกรรม",
    description: "จดงานรดน้ำ ใส่ปุ๋ย พ่นยา และค่าใช้จ่ายย้อนหลัง",
    kicker: "บันทึกเร็ว",
    icon: CalendarDays,
    tone: "bg-gradient-to-br from-sky-500 to-blue-600 text-white ring-2 ring-sky-400/50 dark:ring-sky-400/40",
    shadowColor: "rgba(14, 165, 233, 0.45)",
    themeColor: "#0EA5E9",
    surface: "from-sky-50 via-white to-blue-50 dark:from-sky-950/20 dark:via-[#14291E] dark:to-blue-950/20",
    hoverClass: "hover-jingle-subtle",
    details: ["รดน้ำ", "ใส่ปุ๋ย", "ค่าใช้จ่าย"],
  },
  {
    title: "ดูภาพรวมการเงิน",
    description: "แยกรายรับรายจ่าย เห็นต้นทุนและผลตอบแทนชัดขึ้น",
    kicker: "ต้นทุนกำไร",
    icon: Coins,
    tone: "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-400/50 dark:ring-amber-400/40",
    shadowColor: "rgba(245, 158, 11, 0.45)",
    themeColor: "#F59E0B",
    surface: "from-amber-50 via-white to-orange-50 dark:from-amber-950/20 dark:via-[#14291E] dark:to-orange-950/20",
    hoverClass: "hover-wiggle-subtle",
    details: ["รายรับ", "รายจ่าย", "กำไรสุทธิ"],
  },

  {
    title: "เช็กสภาพอากาศ",
    description: "ใช้พยากรณ์ช่วยตัดสินใจงานน้ำและงานดูแลสวน",
    kicker: "ก่อนลงสวน",
    icon: CloudRain,
    tone: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white ring-2 ring-cyan-400/50 dark:ring-cyan-400/40",
    shadowColor: "rgba(6, 182, 212, 0.45)",
    themeColor: "#06B6D4",
    surface: "from-cyan-50 via-white to-sky-50 dark:from-cyan-950/20 dark:via-[#14291E] dark:to-sky-950/20",
    hoverClass: "hover-sway-subtle",
    details: ["ฝน", "แดด", "ลม"],
  },
  {
    title: "คลังความรู้ทุเรียน",
    description: "อ่านเรื่องโรค น้ำ ปุ๋ย ดอก ตลาด",
    kicker: "เรียนรู้ต่อ",
    icon: BookOpen,
    tone: "bg-gradient-to-br from-rose-500 to-pink-600 text-white ring-2 ring-rose-400/50 dark:ring-rose-400/40",
    shadowColor: "rgba(244, 63, 94, 0.45)",
    themeColor: "#F43F5E",
    surface: "from-rose-50 via-white to-pink-50 dark:from-rose-950/20 dark:via-[#14291E] dark:to-pink-950/20",
    hoverClass: "hover-float-subtle",
    details: ["โรค", "ดอก", "ตลาด"],
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
  onOpenSandbox,
  installPrompt,
  onInstall,
  isInstalled,
}: {
  articles: Article[]
  products: Product[]
  onLogin: () => void
  onReadArticles: (articleId?: string) => void
  onOpenProducts: () => void
  onOpenSandbox: (tab: "tasks" | "plots" | "activities" | "finance") => void
  installPrompt: BeforeInstallPromptEvent | null
  onInstall: () => Promise<void>
  isInstalled: boolean
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
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px) scale(1.08); }
        }
        @keyframes wiggleSubtle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes jingleSubtle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.15) rotate(-12deg); }
          60% { transform: scale(1.15) rotate(12deg); }
        }
        @keyframes swaySubtle {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-4px) translateY(-2px); }
        }
        @keyframes expandSubtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes cardSheen {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .premium-feature-card {
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          translate: 0 0;
          scale: 1;
        }
        .premium-feature-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: none;
        }
        .premium-feature-card:hover::after {
          animation: cardSheen 1.2s ease-in-out forwards;
        }
        .premium-feature-card:hover {
          translate: 0 -8px;
          scale: 1.015;
          border-color: var(--hover-glow);
          box-shadow: 0 20px 40px -10px var(--hover-glow), 0 0 1px 0 var(--hover-glow);
        }
        .dark .premium-feature-card:hover {
          border-color: var(--hover-glow);
        }
        .group:hover .hover-bounce-subtle {
          animation: bounceSubtle 0.6s ease-in-out;
        }
        .group:hover .hover-float-subtle {
          animation: floatSubtle 1.2s ease-in-out infinite;
        }
        .group:hover .hover-wiggle-subtle {
          animation: wiggleSubtle 0.5s ease-in-out;
        }
        .group:hover .hover-jingle-subtle {
          animation: jingleSubtle 0.6s ease-in-out;
        }
        .group:hover .hover-sway-subtle {
          animation: swaySubtle 0.7s ease-in-out;
        }
        .group:hover .hover-expand-subtle {
          animation: expandSubtle 0.6s ease-in-out;
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
      <section className="guest-hero relative isolate overflow-hidden bg-[#06150D] py-12 sm:py-16 lg:min-h-svh lg:px-8 lg:py-12">
        {/* Pulsing Auroras for immersive depth */}
        <div className="guest-hero-glow pointer-events-none absolute -left-40 top-10 h-[450px] w-[450px] rounded-full bg-[#185333]/25 blur-[120px] animate-pulse-glow" />
        <div className="guest-hero-glow pointer-events-none absolute -right-32 bottom-8 h-[500px] w-[500px] rounded-full bg-[#0a3a20]/35 blur-[140px] animate-pulse-glow" style={{ animationDelay: '3s' }} />
        <div className="guest-hero-glow pointer-events-none absolute left-1/3 top-1/4 h-[350px] w-[350px] rounded-full bg-[#D97B18]/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: '5s' }} />

        {/* Bento/Asymmetric Grid Container */}
        <div className="relative mx-auto max-w-[92rem] grid w-full gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center xl:gap-12">
          
          {/* Left Column: Premium Headline & CTAs */}
          <div className="guest-hero-copy relative z-10 flex flex-col justify-center text-center lg:text-left">


            <h1 className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[1.05] text-white tracking-tight">
              จัดการสวนทุเรียน
              <br />
              <span className="relative mt-3 inline-block origin-left -rotate-1 text-[1.12em] font-black leading-snug tracking-wide pt-1 pb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97B18] to-[#F59E0B] dark:from-[#F4D35E] dark:to-[#F59E0B] drop-shadow-[0_10px_22px_rgba(217,123,24,0.22)]">
                  ให้ง่ายขึ้น
                </span>
                <svg className="absolute -bottom-1.5 left-0 right-0 h-4 w-full text-[#F59E0B] dark:text-[#F4D35E]" viewBox="0 0 300 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12C50 15 100 10 150 10C200 10 250 15 295 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 15C70 17 120 13 170 13C210 13 250 16 280 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 mx-auto lg:mx-0 max-w-xl text-base font-semibold leading-relaxed text-[#B8D1C0]/90 md:text-lg">
              แอปบันทึกงานดูแลสวน วางแผนงาน ติดตามพยากรณ์อากาศ วิเคราะห์การเงิน ครบจบในที่เดียว
            </p>

            {/* Benefits badging pills */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5">
              {HERO_BENEFITS.map(({ label, icon: Icon }) => (
                <div key={label} className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 duration-300">
                  <Icon size={14} className="text-emerald-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button
                onClick={onLogin}
                className="guest-hero-cta group relative overflow-hidden inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-8 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-900/35 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/25 active:scale-[0.98]"
              >
                <Sparkles size={18} className="text-[#F4D35E] transition-transform duration-500 group-hover:rotate-180" />
                <span>เข้าสู่ระบบ / สมัครใช้งาน</span>
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onOpenSandbox("plots")}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 backdrop-blur-md px-8 py-3.5 text-base font-black text-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
              >
                <Smartphone size={18} className="text-emerald-400 group-hover:scale-110" />
                <span>ทดลองเล่น Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Premium Visual Bento Grid Showcase */}
          <div className="relative z-10 flex flex-col justify-center">
            {/* The Main Bento Shell */}
            <div className="relative w-full rounded-[2.5rem] border border-white/10 bg-[#050D08]/20 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col justify-end">
              
              {/* Backlight shine overlay */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[60px]" />
              
              {/* Slideshow background image of orchard (with gradient overlay) */}
              <div className="absolute inset-0 z-0 overflow-hidden opacity-90 select-none pointer-events-none">
                <Image
                  src="/images/durian-hero-new.png"
                  alt="durian orchard"
                  fill
                  className="object-cover object-center scale-105"
                  sizes="(min-width: 1024px) 46rem, 100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
              </div>

              {/* Center Row: Dynamic Leaf particles inside bento */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-40">
                {leafParticles.slice(0, 3).map(p => (
                  <div
                    key={`bento-leaf-${p.id}`}
                    className="absolute"
                    style={{
                      right: p.right,
                      top: p.top,
                      animation: `hero-leaf-drift ${p.duration} infinite linear`,
                      animationDelay: p.delay,
                      width: `${p.size + 4}px`,
                      height: `${p.size + 4}px`,
                      opacity: p.opacity,
                      "--drift-x": p.driftX,
                      "--drift-y": p.driftY,
                      "--drift-rotation": p.rotation,
                      "--leaf-opacity": p.opacity,
                    } as React.CSSProperties}
                  >
                    <Leaf className="text-emerald-500 w-full h-full transform" />
                  </div>
                ))}
              </div>

              {/* Bottom Row: Elegant PWA Installation Badge / Card */}
              <div className="relative z-10 mt-auto w-full">
                <div className="w-full rounded-3xl border border-white/12 bg-gradient-to-br from-white/10 to-white/0 p-5 backdrop-blur-lg shadow-xl relative overflow-hidden">
                  {/* Decorative PWA pulsing dot */}
                  <div className="absolute right-4 top-4 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black ring-1 ring-emerald-500/20">PWA</span>
                        <h3 className="text-base font-black text-white">ติดตั้งเป็นแอปมือถือ</h3>
                      </div>
                      <p className="text-xs font-semibold text-white/70">
                        ใช้งานสะดวก รวดเร็ว และรองรับโหมดออฟไลน์
                      </p>
                    </div>
                    {!isInstalled && (
                      <button
                        onClick={onInstall}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-400 active:scale-95 transition-all shadow-md"
                      >
                        <DurianLogo size={18} className="h-[18px] w-[18px] rounded-md object-cover" />
                        <span>ติดตั้งแอป</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#EEF8F0] px-4 pb-10 pt-3 dark:bg-[#0D1E15] sm:px-6 sm:pb-16 sm:pt-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(20,107,62,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,107,62,0.07)_1px,transparent_1px)] bg-[size:42px_42px] dark:bg-[linear-gradient(to_right,rgba(114,192,138,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(114,192,138,0.08)_1px,transparent_1px)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[38rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl dark:bg-[#22563A]/25" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-10 sm:gap-4">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-black leading-tight tracking-tight text-[#143422] dark:text-[#E6F4EA] sm:text-3xl">
                ฟังก์ชันที่ช่วยให้เริ่มใช้ได้ทันที
              </h2>
              <p className="text-sm font-semibold text-[#527060] dark:text-[#B8D1C0]/70 mt-1">
                คลิกเพื่อทดลองใช้งานระบบจำลอง หรืออ่านคู่มือการเริ่มต้นใช้งาน
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-2 place-items-center gap-3 sm:gap-5 lg:grid-cols-3">
            {GUEST_FEATURES.map((feature, idx) => {
              const Icon = feature.icon
              const handleClick = () => {
                if (idx === 4) {
                  onLogin()
                } else if (idx === 5) {
                  onReadArticles()
                } else {
                  const tabs: ("tasks" | "plots" | "activities" | "finance")[] = [
                    "tasks",
                    "plots",
                    "activities",
                    "finance"
                  ]
                  onOpenSandbox(tabs[idx])
                }
              }
              return (
                <button
                  key={feature.title}
                  onClick={handleClick}
                  className={`group premium-feature-card relative flex min-h-[12rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#B9DCC8]/50 bg-gradient-to-br ${feature.surface} p-3 text-center shadow-[0_14px_38px_rgba(20,107,62,0.07)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_30px_60px_-15px_var(--hover-glow)] hover:border-[#146B3E]/30 dark:border-[#31533D]/50 dark:shadow-[0_16px_48px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_30px_60px_-15px_var(--hover-glow)] dark:hover:border-[#72C08A]/30 sm:min-h-[15.5rem] sm:max-w-[19rem] sm:rounded-[2rem] sm:p-5`}
                  style={{
                    "--hover-glow": feature.shadowColor,
                  } as React.CSSProperties}
                >
                  {/* Large floating background icon for premium feeling */}
                  <div className="pointer-events-none absolute -right-8 -top-8 text-[#146B3E]/5 transition-all duration-700 group-hover:rotate-12 group-hover:scale-125 group-hover:text-[#146B3E]/10 dark:text-[#72C08A]/5 dark:group-hover:text-[#72C08A]/10">
                    <Icon size={150} strokeWidth={1} />
                  </div>
                  <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-35" style={{ backgroundColor: feature.themeColor }} />

                  <div className="absolute inset-x-6 top-0 h-1.5 rounded-b-full opacity-80 sm:inset-x-10" style={{ backgroundColor: feature.themeColor }} />

                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mt-1 flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:mt-2 sm:h-24 sm:w-24">
                      <span className="absolute inset-0 rounded-full border border-white/80 bg-white/45 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5" />
                      <span className="absolute inset-3 rounded-full opacity-20 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-35" style={{ backgroundColor: feature.themeColor }} />
                      <span className="absolute left-1 top-5 h-3 w-3 rounded-full opacity-70 shadow-sm" style={{ backgroundColor: feature.themeColor }} />
                      <span className="absolute right-3 top-2 h-5 w-5 rounded-full border-2 border-white/85 bg-white/65 shadow-sm dark:border-white/20 dark:bg-white/10" />
                      <span className="absolute bottom-3 right-1 h-4 w-4 rounded-full opacity-60 shadow-sm" style={{ backgroundColor: feature.themeColor }} />
                      <div className={`relative flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1.15rem] shadow-[0_18px_36px_var(--hover-glow)] ring-4 ring-white/70 transition-all duration-300 group-hover:rotate-3 group-hover:scale-105 dark:ring-white/10 sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-[1.5rem] ${feature.tone}`}>
                        <Icon size={26} strokeWidth={2.25} className={`drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)] sm:size-8 ${feature.hoverClass}`} />
                      </div>
                    </div>

                    <div className="mt-2 max-w-sm sm:mt-4">
                      <h3 className="text-base font-black leading-tight text-[#243B2D] transition-colors duration-300 group-hover:text-[#146B3E] dark:text-[#E6F4EA] dark:group-hover:text-[#72C08A] sm:text-xl">
                        {feature.title}
                      </h3>
                      <p className="mx-auto mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#5E7568] dark:text-[#B8D1C0]/72 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-6">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-4 hidden flex-wrap justify-center gap-2 sm:flex">
                      {feature.details.map(detail => (
                        <span
                          key={detail}
                          className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-black text-[#527060] ring-1 ring-[#B9DCC8]/50 transition-colors group-hover:text-[#146B3E] dark:bg-white/8 dark:text-[#B8D1C0]/80 dark:ring-white/10 dark:group-hover:text-[#72C08A]"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>

                  </div>
                </button>
              )
            })}
          </div>
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

      {SHOW_RECOMMENDED_PRODUCTS && activeProducts.length > 0 && (
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
  const isSyncingFromHistory = useRef(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSandbox, setShowSandbox] = useState(false)
  const [sandboxTab, setSandboxTab] = useState<"tasks" | "plots" | "activities" | "finance">("tasks")
  const [authError, setAuthError] = useState<string | null>(null)
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
  const [isInstalled, setIsInstalled] = useState(false)
  const store = useAppData(user?.id ?? null)
  const locationStorageKey = user?.id ? `farm_location_${user.id}` : "farm_location_guest"
  const coverStorageKey = user?.id ? `farm_cover_image_${user.id}` : "farm_cover_image_guest"
  const openAuth = useCallback(() => {
    setAuthError(null)
    setShowAuth(true)
  }, [])
  const openSandbox = useCallback((tab: "tasks" | "plots" | "activities" | "finance") => {
    setSandboxTab(tab)
    setShowSandbox(true)
  }, [])
  const todayTaskCount = useMemo(() => store.data.tasks.filter(task => {
    if (task.status !== "pending") return false
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.getFullYear() === today.getFullYear()
      && taskDate.getMonth() === today.getMonth()
      && taskDate.getDate() === today.getDate()
  }).length, [store.data.tasks])

  const syncStateFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    const articleId = params.get("articleId") || params.get("article")
    setActiveTab(tab && ["dashboard", "plots", "operations", "finance", "articles", "admin"].includes(tab) ? tab as Tab : articleId ? "articles" : "dashboard")

    const view = params.get("view")
    setArticleView(view && ["articles", "products"].includes(view) ? view as "articles" | "products" : "articles")

    setSelectedArticleId(articleId)
  }, [])

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
    
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone
      setIsInstalled(!!isStandalone)
    }

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

  // Sync URL search parameters to local state on mount and browser back/forward.
  useEffect(() => {
    isSyncingFromHistory.current = true
    syncStateFromUrl()

    const onPopState = () => {
      isSyncingFromHistory.current = true
      syncStateFromUrl()
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [syncStateFromUrl])

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
      url.searchParams.delete("article")
    } else {
      url.searchParams.delete("view")
      url.searchParams.delete("articleId")
      url.searchParams.delete("article")
    }

    const nextUrl = url.toString()
    if (nextUrl === window.location.href) {
      isSyncingFromHistory.current = false
      return
    }

    if (isSyncingFromHistory.current) {
      isSyncingFromHistory.current = false
      window.history.replaceState({}, "", nextUrl)
      return
    }

    window.history.pushState({}, "", nextUrl)
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
    setAuthError(null)
    setFailedAvatarUrl(null)
    localStorage.setItem("durian_current_user", nextUser.id)
    setShowAuth(false)
  }, [])

  useEffect(() => {
    const oauthError = getOAuthErrorFromUrl()
    if (!oauthError) return

    setAuthError(oauthError)
    setShowAuth(true)

    window.history.replaceState(null, "", window.location.pathname || "/")
  }, [])

  // Stable listener — mounted once, never re-subscribes on user state changes
  useEffect(() => {
    let active = true

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setAuthChecking(false)
      return
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session?.user) return
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED" && event !== "INITIAL_SESSION") return

      const identity = resolveOAuthProfileFromAuthUser(session.user)
      if (!identity) return

      void store.upsertOAuthUser(identity).then(nextUser => {
        if (active && nextUser) handleLoginSuccess(nextUser)
      })
    })

    // Also sync immediately in case session already exists (e.g. after OAuth redirect)
    void supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) {
        setAuthChecking(false)
        return
      }
      const identity = resolveOAuthProfileFromAuthUser(data.user)
      if (!identity) {
        setAuthChecking(false)
        return
      }
      void store.upsertOAuthUser(identity).then(nextUser => {
        if (active && nextUser) handleLoginSuccess(nextUser)
        else setAuthChecking(false)
      }).catch(() => setAuthChecking(false))
    }).catch(() => setAuthChecking(false))

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount-only — handleLoginSuccess and store are stable refs

  useEffect(() => {
    // Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err))
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
  }, [])

  const handleInstallApp = async () => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (installPrompt) {
      await installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
      return
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      alert("ติดตั้งแอปไว้แล้ว")
      return
    }

    alert(isIos
      ? "บน iPhone/iPad ให้กดปุ่ม Share (แชร์) แล้วเลือก Add to Home Screen (เพิ่มไปยังหน้าจอโฮม)"
      : "หากเบราว์เซอร์รองรับ ให้ใช้เมนู Install app หรือ Add to Home screen"
    )
  }

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
    if (!SHOW_RECOMMENDED_PRODUCTS) return
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
          onLogin={openAuth}
          onReadArticles={openArticles}
          onOpenProducts={openProducts}
          onOpenSandbox={openSandbox}
          installPrompt={installPrompt}
          onInstall={handleInstallApp}
          isInstalled={isInstalled}
        />
      )
    }

    if (!user && activeTab !== "articles") {
      return (
        <GuestHome
          articles={store.data.articles}
          products={store.data.products}
          onLogin={openAuth}
          onReadArticles={openArticles}
          onOpenProducts={openProducts}
          onOpenSandbox={openSandbox}
          installPrompt={installPrompt}
          onInstall={handleInstallApp}
          isInstalled={isInstalled}
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

  const savedSiteName = store.data.siteSettings.siteName
  const siteName = user?.farmName || (savedSiteName === "DurianFlow" ? "Durian Flow" : savedSiteName) || "สวนทุเรียน"
  const tagline = store.data.siteSettings.tagline || "Smart Orchard"
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#146B3E] text-white ring-1 ring-[#CFE3D5] dark:bg-[#146B3E] dark:text-white dark:ring-[#31533D]">
                <DurianLogo size={26} className="h-7 w-7" />
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
              {SHOW_RECOMMENDED_PRODUCTS && (
                <button
                  onClick={openProducts}
                  className="hidden rounded-2xl px-4 py-2 text-sm font-black text-[#146B3E] transition-colors hover:bg-[#E7F3EC] md:inline-flex dark:text-[#72C08A] dark:hover:bg-white/10"
                >
                  สินค้าแนะนำ
                </button>
              )}
              {!isInstalled && (
                <button
                  onClick={handleInstallApp}
                  className="relative overflow-hidden md:hidden inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-100/90 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black text-[#146B3E] transition-all hover:scale-105 active:scale-95 dark:border-emerald-800/35 dark:bg-emerald-950/25 dark:text-[#72C08A] dark:hover:bg-emerald-950/50 shadow-sm"
                >
                  <DurianLogo size={18} className="h-[18px] w-[18px] rounded-md object-cover" />
                  <span className="hidden xs:inline">ติดตั้งแอป</span>
                  <span className="inline xs:hidden">ติดตั้ง</span>
                </button>
              )}
              <button
                onClick={() => setShowSupportModal(true)}
                aria-label="สนับสนุนเว็บนี้"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#CFE3D5] bg-white text-sm font-black text-[#146B3E] transition-colors hover:bg-[#E7F3EC] sm:w-auto sm:gap-2 sm:px-3 sm:py-2 dark:border-[#31533D] dark:bg-[#1D3A29] dark:text-[#72C08A] dark:hover:bg-[#244332]"
              >
                <HeartHandshake size={16} />
                <span className="hidden sm:inline">เลี้ยงกาแฟ</span>
              </button>
              <button
                onClick={openAuth}
                aria-label="เข้าสู่ระบบ"
                className="inline-flex h-10 w-auto items-center justify-center gap-2 rounded-2xl bg-[#146B3E] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,107,62,0.18)] transition-all hover:bg-[#0F5A34] active:scale-[0.98]"
              >
                <span>เข้าสู่ระบบ</span>
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
              onLogin={openAuth}
              onReadArticles={openArticles}
              onOpenProducts={openProducts}
              onOpenSandbox={openSandbox}
              installPrompt={installPrompt}
              onInstall={handleInstallApp}
              isInstalled={isInstalled}
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
            initialError={authError ?? undefined}
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
        {showSandbox && (
          <SandboxModal
            isOpen={showSandbox}
            onClose={() => setShowSandbox(false)}
            onLogin={openAuth}
            initialTab={sandboxTab}
          />
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-transparent flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/75 dark:bg-[#0F1F17]/75 backdrop-blur-md px-3 sm:px-4 md:px-8 pt-2 sm:pt-2 pb-2 sm:pb-2 flex items-center justify-between gap-2 shrink-0 border-b border-[#DDEBE1]/40 dark:border-[#31533D]/45 shadow-[0_8px_30px_rgba(20,107,62,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity active:scale-95"
        >
          <div className="shrink-0 p-2 sm:p-2.5 bg-[#146B3E] dark:bg-[#146B3E] rounded-xl shadow-sm ring-1 ring-[#CFE3D5] dark:ring-[#31533D] animate-float-sway">
            <DurianLogo size={22} className="h-5 w-5 sm:h-6 sm:w-6" />
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
            className="inline-flex py-2 w-10 items-center justify-center rounded-xl bg-white text-[#146B3E] ring-1 ring-[#CFE3D5] transition-colors hover:bg-[#E7F3EC] sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2 dark:bg-[#1D3A29] dark:text-[#72C08A] dark:ring-[#31533D] dark:hover:bg-[#244332]"
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
                ? <UserAvatarImage src={user.avatar} alt={user.name} onError={() => setFailedAvatarUrl(user.avatar ?? null)} className="h-10 w-10 rounded-full object-cover" />
                : <div className="h-10 w-10 rounded-full bg-[#E7F3EC] flex items-center justify-center">
                  <span className="text-[#146B3E] text-sm font-bold">{user.name[0]}</span>
                </div>}
            </button>
          ) : (
            <button
              onClick={openAuth}
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
          initialError={authError ?? undefined}
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
