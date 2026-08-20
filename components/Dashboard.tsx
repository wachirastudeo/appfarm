"use client"
import { useMemo, useState, useEffect, useRef } from "react"
import { AppData, Task, ActivityType, ACTIVITY_LABELS, FLOWER_STAGE_LABELS, FlowerStage } from "@/lib/store"
import { validateDate, validateText } from "@/lib/form-validation"
import {
  Droplets, Wind, TrendingUp, TrendingDown, ListTodo, Sun, CloudSun, CloudRain,
  Sprout, Zap, Scissors, PackageSearch, ClipboardList, MoreHorizontal, Plus, X, Check, MapPin,
  AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ExternalLink,
  Layers, DollarSign, HeartPulse, Info
} from "lucide-react"
import Image from "next/image"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { SHOW_RECOMMENDED_PRODUCTS } from "@/lib/feature-flags"
import { TaskCard } from "./TaskPlanner"
import DurianIcon from "./DurianIcon"
import { Skeleton } from "./ui/skeleton"

interface Props {
  data: AppData
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles") => void
  onOpenArticle?: (articleId: string) => void
  onOpenSettings?: () => void
  onOpenProducts?: () => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
  addActivity: (activity: Omit<import("@/lib/store").Activity, "id">) => void
  farmLocation: FarmLocation | null
  locationStorageKey: string
  onUpdateFarmLocation: (location: FarmLocation) => Promise<void>
  coverImage?: string | null
  coverPosition?: string
  userName?: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  bgColor = "bg-primary/10",
  badge,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
  bgColor?: string
  badge?: { text: string; positive?: boolean }
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`dashboard-stat-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-300 ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgColor} ring-1 ring-black/5 dark:ring-white/10`}>
          <Icon size={22} className={color} />
        </div>
        {badge && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              badge.positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-3 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className={`mt-0.5 text-xl sm:text-2xl font-black tracking-tight ${color}`}>{value}</p>
        {sub && <p className="mt-1 text-xs font-medium text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  )
}

const WEATHER_CODE_MAP: Record<number, string> = {
  0: "ท้องฟ้าแจ่มใส", 1: "ส่วนใหญ่แจ่มใส", 2: "มีเมฆบางส่วน", 3: "มีเมฆมาก",
  45: "หมอก", 48: "หมอกเยือกแข็ง",
  51: "ฝนปรอย", 53: "ฝนปรอยปานกลาง", 55: "ฝนปรอยหนัก",
  61: "ฝนตกเล็กน้อย", 63: "ฝนตกปานกลาง", 65: "ฝนตกหนัก",
  80: "ฝนตกสลับ", 81: "ฝนตกสลับปานกลาง", 82: "ฝนตกสลับหนัก",
  95: "พายุฝนฟ้าคะนอง", 96: "พายุกับลูกเห็บ", 99: "พายุรุนแรง",
}

type ForecastAlert = {
  label: string
  detail: string
  level: "clear" | "rain" | "storm"
  items: string[]
  days: {
    date: string
    day: string
    code: number
    rain: number
    high: number | null
    low: number | null
  }[]
}

type PlaceResult = { display_name: string; lat: string; lon: string }
type FarmLocation = { lat: number; lon: number; label: string }

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  fertilize: Sprout,
  spray: Zap,
  water: Droplets,
  prune: Scissors,
  harvest: PackageSearch,
  inspect: ClipboardList,
  other: MoreHorizontal,
}

const ACTIVITY_COLORS: Record<string, string> = {
  fertilize: "text-emerald-600 bg-emerald-500/10",
  spray: "text-amber-600 bg-amber-500/10",
  water: "text-blue-600 bg-blue-500/10",
  prune: "text-orange-600 bg-orange-500/10",
  harvest: "text-primary bg-primary/10",
  inspect: "text-purple-600 bg-purple-500/10",
  other: "text-muted-foreground bg-muted",
}

export default function Dashboard({
  data,
  onNavigate,
  onOpenArticle,
  onOpenSettings,
  onOpenProducts,
  updateTask,
  deleteTask,
  addTask,
  addActivity,
  farmLocation,
  locationStorageKey,
  onUpdateFarmLocation,
  coverImage,
  coverPosition,
  userName,
}: Props) {
  const [weather, setWeather] = useState<{
    temp: string | number
    humidity: string | number
    rain: string | number
    wind: string | number
    condition: string
  }>({
    temp: "–",
    humidity: "–",
    rain: "–",
    wind: "–",
    condition: "กำลังโหลด...",
  })

  const [forecastAlert, setForecastAlert] = useState<ForecastAlert | null>(null)
  const [showLocationEditor, setShowLocationEditor] = useState(false)
  const [placeSearch, setPlaceSearch] = useState("")
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [pendingLocation, setPendingLocation] = useState<FarmLocation | null>(null)
  const [searchingPlace, setSearchingPlace] = useState(false)
  const locationEditorRef = useRef<HTMLDivElement | null>(null)
  const entryModalRef = useRef<HTMLDivElement | null>(null)

  // Recommended Articles
  const recommendedArticles = useMemo(() => {
    const active = data.articles.filter(article => article.status === "published")
    if (active.length >= 9) return active.slice(0, 9)
    const defaultSeeds = [
      { id: "art1", title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", image: "/images/articles/article_watering_1778037948644.avif", status: "published" },
      { id: "art2", title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", image: "/images/articles/article_disease_1778037967060.avif", status: "published" },
      { id: "art3", title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", image: "/images/articles/article_market_1778038017547.avif", status: "published" },
    ]
    const list = [...active]
    for (const seed of defaultSeeds) {
      if (list.length >= 9) break
      if (!list.some(a => a.title === seed.title)) {
        list.push(seed as any)
      }
    }
    return list.slice(0, 9)
  }, [data.articles])

  // Recommended Products carousel
  const activeProducts = useMemo(() => data.products.filter(p => p.status === "active"), [data.products])
  const carouselProducts = useMemo(() => activeProducts.length > 0 ? [...activeProducts, ...activeProducts] : [], [activeProducts])
  const productDrag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const productTrack = () => document.getElementById("dashboard-product-carousel")

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

  const stopProductDrag = () => { productDrag.current.active = false }

  useEffect(() => {
    if (activeProducts.length <= 1) return
    const interval = window.setInterval(() => {
      const track = productTrack()
      if (!track) return
      normalizeProductScroll(track)
      track.scrollBy({ left: 300, behavior: "smooth" })
    }, 4500)
    return () => window.clearInterval(interval)
  }, [activeProducts.length])

  useEscapeToClose({
    enabled: showLocationEditor,
    onEscape: () => {
      setShowLocationEditor(false)
      setPendingLocation(null)
    },
    containerRef: locationEditorRef,
  })

  const weatherLoading = weather.condition === "กำลังโหลด..."
  const plotNameById = useMemo(
    () => new Map(data.plots.map(plot => [plot.id, plot.name])),
    [data.plots]
  )

  const loc = useMemo(
    () => farmLocation ?? { lat: 12.6081, lon: 102.1048 }, // default: จันทบุรี
    [farmLocation]
  )

  // Weather fetch
  useEffect(() => {
    setWeather({ temp: "–", humidity: "–", rain: "–", wind: "–", condition: "กำลังโหลด..." })
    setForecastAlert(null)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min&forecast_days=6&wind_speed_unit=kmh`
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current
        const todayRain = Number(d.daily?.precipitation_probability_max?.[0] ?? 0)
        const dates: string[] = d.daily?.time?.slice(1, 6) ?? []
        const codes: number[] = d.daily?.weather_code?.slice(1, 6) ?? []
        const rain: number[] = d.daily?.precipitation_probability_max?.slice(1, 6) ?? []
        const wind: number[] = d.daily?.wind_speed_10m_max?.slice(1, 6) ?? []
        const highs: number[] = d.daily?.temperature_2m_max?.slice(1, 6) ?? []
        const lows: number[] = d.daily?.temperature_2m_min?.slice(1, 6) ?? []
        const maxRain = Math.max(0, ...rain.map(Number))
        const maxWind = Math.max(0, ...wind.map(Number))
        const hasStorm = codes.some(code => code >= 95) || maxWind >= 45
        const hasHeavyRain = maxRain >= 70 || codes.some(code => [63, 65, 80, 81, 82].includes(code))
        const items = dates.map((date, i) => {
          const day = new Date(date).toLocaleDateString("th-TH", { weekday: "short" })
          return `${day} ฝน ${rain[i] ?? 0}%`
        })
        const days = dates.map((date, i) => ({
          date,
          day: new Date(date).toLocaleDateString("th-TH", { weekday: "short" }),
          code: Number(codes[i] ?? 0),
          rain: Number(rain[i] ?? 0),
          high: Number.isFinite(Number(highs[i])) ? Math.round(Number(highs[i])) : null,
          low: Number.isFinite(Number(lows[i])) ? Math.round(Number(lows[i])) : null,
        }))

        setWeather({
          temp: Math.round(c.temperature_2m),
          humidity: Math.round(c.relative_humidity_2m),
          rain: Math.round(todayRain),
          wind: Math.round(c.wind_speed_10m),
          condition: WEATHER_CODE_MAP[c.weather_code] ?? `รหัส ${c.weather_code}`,
        })
        setForecastAlert({
          label: hasStorm ? "เตือนพายุ 5 วัน" : hasHeavyRain ? `ฝนตกชุกสูงสุด ${maxRain}%` : `ฝนสูงสุด ${maxRain}% ใน 5 วัน`,
          detail: items.join(" · ") || "พยากรณ์ฝน 5 วันข้างหน้า",
          level: hasStorm ? "storm" : hasHeavyRain ? "rain" : "clear",
          items,
          days,
        })
      })
      .catch(() => {
        setWeather(w => ({ ...w, condition: "ไม่สามารถโหลดได้" }))
        setForecastAlert(null)
      })
  }, [farmLocation, loc.lat, loc.lon])

  // Agri-Weather Guidance
  const weatherAdvice = useMemo(() => {
    const rainNum = typeof weather.rain === "number" ? weather.rain : parseInt(String(weather.rain)) || 0
    const tempNum = typeof weather.temp === "number" ? weather.temp : parseInt(String(weather.temp)) || 0
    const windNum = typeof weather.wind === "number" ? weather.wind : parseInt(String(weather.wind)) || 0

    if (rainNum >= 65) {
      return {
        text: "โอกาสฝนตกสูง ควรงดหรือเลื่อนการพ่นปุ๋ย/ยาทางใบ เพื่อลดการชะล้าง",
        tone: "warning",
      }
    }
    if (rainNum >= 35) {
      return {
        text: "อาจมีฝนประปราย ควรตรวจเช็คทางระบายน้ำในร่องแปลงและปรับแผนการให้น้ำ",
        tone: "info",
      }
    }
    if (tempNum >= 36) {
      return {
        text: "อากาศร้อนจัด แดดแรง ควรเพิ่มรอบการให้น้ำช่วงเช้าตรู่เพื่อรักษาความชื้นทรงพุ่ม",
        tone: "warning",
      }
    }
    if (windNum >= 28) {
      return {
        text: "ลมค่อนข้างแรง ตรวจสอบการค้ำกิ่งและผูกโยงผลทุเรียนเพื่อป้องกันความเสียหาย",
        tone: "warning",
      }
    }
    return {
      text: "สภาพอากาศแจ่มใส เหมาะแก่การตัดแต่งกิ่ง ใส่ปุ๋ยทางดิน และบันทึกกิจกรรมสวน",
      tone: "good",
    }
  }, [weather.rain, weather.temp, weather.wind])

  // Orchard Stats & Metrics
  const { totalTrees, totalArea, healthCounts, stageDistribution } = useMemo(() => {
    let treesCount = 0
    let areaSum = 0
    const health = { good: 0, fair: 0, poor: 0 }
    const stages: Record<string, number> = {}

    data.plots.forEach(plot => {
      areaSum += plot.area || 0
      plot.trees.forEach(tree => {
        treesCount++
        const stg = tree.stage || "vegetative"
        stages[stg] = (stages[stg] || 0) + 1
        if (tree.health === "fair") health.fair++
        else if (tree.health === "poor") health.poor++
        else health.good++
      })
    })

    return {
      totalTrees: treesCount,
      totalArea: areaSum,
      healthCounts: health,
      stageDistribution: stages,
    }
  }, [data.plots])

  const pendingTasks = useMemo(() => data.tasks.filter(t => t.status === "pending").length, [data.tasks])

  const monthlyTotals = useMemo(() => {
    const now = new Date()
    return data.finance.reduce((totals, record) => {
      const d = new Date(record.date)
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
        return totals
      }
      if (record.type === "income") totals.income += record.amount
      if (record.type === "expense") totals.expense += record.amount
      return totals
    }, { income: 0, expense: 0 })
  }, [data.finance])

  const thisMonthIncome = monthlyTotals.income
  const thisMonthExpense = monthlyTotals.expense
  const thisMonthNet = thisMonthIncome - thisMonthExpense

  const recentActivities = useMemo(() =>
    [...data.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [data.activities])

  const upcomingTasks = useMemo(() =>
    data.tasks.filter(t => t.status === "pending").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4),
    [data.tasks])

  const plotName = (id: string) => plotNameById.get(id) ?? id

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })
  }

  // Dashboard quick-entry modal shared by tasks and activities.
  const [entryModal, setEntryModal] = useState<"task" | "activity" | null>(null)
  const [quickForm, setQuickForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    priority: "medium" as Task["priority"],
  })

  useEffect(() => {
    if (data.plots.length === 0) return
    const valid = data.plots.some(p => p.id === quickForm.plotId)
    if (!valid) {
      setQuickForm(f => ({ ...f, plotId: data.plots[0].id }))
    }
  }, [data.plots, quickForm.plotId])

  const handleQuickAdd = () => {
    const title = validateText("ชื่องาน", quickForm.title, { required: true, maxLength: 160 })
    const date = validateDate("วันที่", quickForm.date)
    const plotId = data.plots.some(p => p.id === quickForm.plotId)
      ? quickForm.plotId
      : data.plots[0]?.id ?? ""

    if (!plotId) {
      alert("ยังไม่มีแปลงทุเรียน กรุณาเพิ่มแปลงก่อนจึงจะบันทึกงานได้")
      setEntryModal(null)
      onNavigate?.("plots")
      return
    }
    if (!title.ok || !date.ok) {
      alert(!title.ok ? title.message : date.message)
      return
    }

    addTask({
      title: title.value,
      date: new Date(date.value).toISOString(),
      plotId,
      priority: quickForm.priority,
      description: "",
      status: "pending",
    })
    setQuickForm({ title: "", date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", priority: "medium" })
    setEntryModal(null)
  }

  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    activityType: "fertilize" as ActivityType,
    description: "",
  })

  useEscapeToClose({
    enabled: entryModal !== null,
    onEscape: () => setEntryModal(null),
    containerRef: entryModalRef,
  })

  useEffect(() => {
    if (data.plots.length > 0 && !data.plots.some(plot => plot.id === activityForm.plotId)) {
      setActivityForm(form => ({ ...form, plotId: data.plots[0].id }))
    }
  }, [activityForm.plotId, data.plots])

  const handleQuickActivityAdd = () => {
    const description = validateText("รายละเอียด", activityForm.description, { required: true, maxLength: 500, allowMultiline: true })
    const date = validateDate("วันที่", activityForm.date)
    if (!description.ok || !date.ok) {
      alert(!description.ok ? description.message : date.message)
      return
    }

    addActivity({
      date: new Date(date.value).toISOString(),
      plotId: activityForm.plotId,
      activityType: activityForm.activityType,
      description: description.value,
      cost: 0,
      createdAt: new Date().toISOString(),
    })
    setActivityForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "" })
    setEntryModal(null)
  }

  const handlePlaceSearch = async () => {
    const search = validateText("ชื่อสถานที่", placeSearch, { required: true, maxLength: 160 })
    if (!search.ok) {
      alert(search.message)
      return
    }
    setSearchingPlace(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search.value + " ประเทศไทย")}` +
        `&format=json&limit=5&addressdetails=1&accept-language=th`
      )
      setSearchResults(await res.json())
    } catch {
      alert("ไม่สามารถค้นหาสถานที่ได้ กรุณาลองใหม่")
    } finally {
      setSearchingPlace(false)
    }
  }

  const selectPlace = (result: PlaceResult) => {
    const parts = result.display_name.split(",")
    setPendingLocation({
      lat: parseFloat(parseFloat(result.lat).toFixed(4)),
      lon: parseFloat(parseFloat(result.lon).toFixed(4)),
      label: parts.slice(0, 2).join(",").trim(),
    })
  }

  const saveLocation = async () => {
    if (!pendingLocation) return
    localStorage.setItem(locationStorageKey, JSON.stringify(pendingLocation))
    try {
      await onUpdateFarmLocation(pendingLocation)
      window.dispatchEvent(new Event("farm_location_changed"))
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      alert("บันทึกตำแหน่งสวนไม่สำเร็จ: " + errMsg)
      return
    }
    setShowLocationEditor(false)
    setPlaceSearch("")
    setSearchResults([])
    setPendingLocation(null)
  }

  // Top stages active in the orchard
  const topActiveStages = useMemo(() => {
    return Object.entries(stageDistribution)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [stageDistribution])

  return (
    <div data-page="dashboard" className="space-y-5 sm:space-y-6">
      {/* 1. Hero & Weather Overview */}
      <div className="dashboard-hero relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all">
        {/* Banner Cover Image */}
        <div className="relative h-40 sm:h-52 lg:h-56 w-full overflow-hidden">
          <Image
            src={coverImage || "/images/durian-banner.avif"}
            alt="สวนทุเรียน"
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-700 hover:scale-105"
            style={{ objectPosition: coverPosition || "center 40%" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
          
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-300">
                {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                สวัสดีคุณ{userName?.trim() || "ชาวสวน"}
              </h1>
            </div>

            {/* Farm Location Badge */}
            <button
              onClick={() => setShowLocationEditor(true)}
              className="inline-flex w-fit items-center gap-1.5 sm:gap-2 rounded-xl bg-white/15 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
            >
              <MapPin size={15} className="text-emerald-400 shrink-0" />
              <span className="max-w-[12rem] sm:max-w-[18rem] truncate">
                {farmLocation ? farmLocation.label : "ตั้งค่าตำแหน่งสวน"}
              </span>
            </button>
          </div>
        </div>

        {/* Weather Bar & Agri-Guidance inside Hero Card */}
        <div className="dashboard-weather border-t border-border/60 bg-muted/40 p-3.5 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3 sm:gap-4 items-center">
            {/* Weather Metrics */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                  <Sun size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase">อากาศวันนี้</p>
                  {weatherLoading ? (
                    <Skeleton className="h-6 sm:h-7 w-20 sm:w-24 rounded-lg mt-0.5" />
                  ) : (
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-foreground">{weather.temp}°C</span>
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground">{weather.condition}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border/60 pl-3 sm:pl-6">
                <div className="text-left">
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">โอกาสฝน</p>
                  <p className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <CloudRain size={13} /> {weather.rain}%
                  </p>
                </div>
                <div className="text-left border-l border-border/60 pl-3">
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">ความเร็วลม</p>
                  <p className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-1">
                    <Wind size={13} className="text-muted-foreground" /> {weather.wind} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">กม./ชม.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Agri-Weather Guidance Alert */}
            <div className={`flex items-start gap-2 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm font-semibold border ${
              weatherAdvice.tone === "warning"
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20"
                : weatherAdvice.tone === "info"
                  ? "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
            }`}>
              <Info size={16} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-black mr-1">คำแนะนำสวน:</span>
                <span>{weatherAdvice.text}</span>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast Row */}
          {forecastAlert && forecastAlert.days.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-border/50 flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[11px] sm:text-xs font-black text-muted-foreground shrink-0 uppercase tracking-wider">
                พยากรณ์ 5 วัน:
              </span>
              <div className="flex gap-1.5 sm:gap-2 min-w-max">
                {forecastAlert.days.map(day => {
                  const Icon = day.code >= 95 ? AlertTriangle : day.rain >= 45 ? CloudRain : CloudSun
                  return (
                    <div
                      key={day.date}
                      className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-card border border-border/80 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-xs"
                    >
                      <span className="text-xs font-black text-foreground">{day.day}</span>
                      <Icon size={13} className={day.code >= 95 ? "text-rose-500" : day.rain >= 45 ? "text-blue-500" : "text-amber-500"} />
                      <span className="text-xs font-bold text-muted-foreground">{day.rain}%</span>
                      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                        {day.high ?? "–"}°/{day.low ?? "–"}°
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Stats Grid (จำนวนงานต่าง ๆ และตัวเลขสถิติ - ขึ้นมาก่อน) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          onClick={() => onNavigate?.("operations")}
          icon={ListTodo}
          label="งานค้างที่ต้องทำ"
          value={`${pendingTasks} งาน`}
          sub={pendingTasks > 0 ? "มีงานที่ต้องติดตาม" : "จัดการเรียบร้อยทั้งหมด"}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-500/10"
        />

        <StatCard
          onClick={() => onNavigate?.("plots")}
          icon={DurianIcon}
          label="ต้นทุเรียนทั้งหมด"
          value={`${totalTrees} ต้น`}
          sub={`${totalArea} ไร่ (${data.plots.length} แปลง)`}
          color="text-primary"
          bgColor="bg-primary/10"
        />

        <StatCard
          onClick={() => onNavigate?.("finance")}
          icon={TrendingUp}
          label="รายรับเดือนนี้"
          value={`฿${thisMonthIncome.toLocaleString()}`}
          sub="ยอดขายผลผลิต"
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/10"
        />

        <StatCard
          onClick={() => onNavigate?.("finance")}
          icon={TrendingDown}
          label="รายจ่ายเดือนนี้"
          value={`฿${thisMonthExpense.toLocaleString()}`}
          sub={`คงเหลือ: ฿${thisMonthNet.toLocaleString()}`}
          badge={{
            text: thisMonthNet >= 0 ? `+฿${thisMonthNet.toLocaleString()}` : `-฿${Math.abs(thisMonthNet).toLocaleString()}`,
            positive: thisMonthNet >= 0,
          }}
          color="text-rose-600 dark:text-rose-400"
          bgColor="bg-rose-500/10"
        />
      </div>

      {/* 3. Quick Action Hub (ปุ่มทางลัดสร้างงาน / บันทึกสวน / การเงิน / แปลง) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => setEntryModal("task")}
          className="dashboard-quick-action group flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <ListTodo size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-foreground truncate">เพิ่มงานด่วน</p>
            <p className="text-[11px] font-medium text-muted-foreground truncate">สร้างกำหนดการ</p>
          </div>
        </button>

        <button
          onClick={() => {
            setEntryModal("activity")
          }}
          className="dashboard-quick-action group flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Sprout size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-foreground truncate">บันทึกสวน</p>
            <p className="text-[11px] font-medium text-muted-foreground truncate">ใส่ปุ๋ย/พ่นยา/รดน้ำ</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.("finance")}
          className="dashboard-quick-action group flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <DollarSign size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-foreground truncate">บันทึกเงิน</p>
            <p className="text-[11px] font-medium text-muted-foreground truncate">รายรับ-รายจ่าย</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.("plots")}
          className="dashboard-quick-action group flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/5 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Layers size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-foreground truncate">จัดการแปลง</p>
            <p className="text-[11px] font-medium text-muted-foreground truncate">{data.plots.length} แปลง · {totalTrees} ต้น</p>
          </div>
        </button>
      </div>

      {/* 4. Tasks (สร้างกำหนดการ) กับ Activities (บันทึกสวน) อยู่ต่อกันทันที */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Section 4.1: งานที่ต้องทำ & สร้างกำหนดการ */}
        <div className="dashboard-panel rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <h3 className="font-black text-foreground text-base sm:text-lg flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ListTodo size={18} />
              </span>
              งานที่ต้องทำ
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setEntryModal("task")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <Plus size={14} /> สร้างกำหนดการ
              </button>
              <button
                onClick={() => onNavigate?.("operations")}
                className="inline-flex items-center text-xs font-black text-primary hover:underline px-1.5 py-1"
              >
                ดูทั้งหมด ({pendingTasks})
              </button>
            </div>
          </div>

          {/* Task List */}
          {upcomingTasks.length > 0 ? (
            <div className="space-y-2">
              {upcomingTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  plotName={plotName(t.plotId)}
                  plots={data.plots}
                  updateTask={updateTask}
                  deleteTask={deleteTask}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 sm:py-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
              <ListTodo size={32} className="text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-foreground">ไม่มีงานค้าง</p>
              <p className="text-xs text-muted-foreground mt-0.5">กดปุ่ม &quot;สร้างกำหนดการ&quot; เพื่อเพิ่มงานใหม่</p>
            </div>
          )}
        </div>

        {/* Section 4.2: บันทึกกิจกรรมสวน (อยู่ต่อกันทันที) */}
        <div className="dashboard-panel rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <h3 className="font-black text-foreground text-base sm:text-lg flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList size={18} />
              </span>
              บันทึกกิจกรรมสวนล่าสุด
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  setEntryModal("activity")
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
              >
                <Plus size={14} /> บันทึกกิจกรรม
              </button>
              <button
                onClick={() => onNavigate?.("operations")}
                className="inline-flex items-center text-xs font-black text-primary hover:underline px-1.5 py-1"
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map(a => {
                const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                const colorClass = ACTIVITY_COLORS[a.activityType] || "text-muted-foreground bg-muted"
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-border/60 bg-background/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 sm:p-2.5 rounded-xl ${colorClass} shrink-0`}>
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">{a.description}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {plotName(a.plotId)} · {formatDate(a.date)}
                      </p>
                    </div>
                    {a.cost > 0 && (
                      <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                        ฿{a.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 sm:py-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
              <ClipboardList size={32} className="text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-foreground">ยังไม่มีบันทึกกิจกรรม</p>
              <p className="text-xs text-muted-foreground mt-0.5">กด &quot;บันทึกกิจกรรม&quot; เพื่อเริ่มเก็บประวัติการดูแลสวน</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Durian Stage & Orchard Health Pulse Overview */}
      {totalTrees > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stage Progress Summary */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sprout size={16} className="text-primary" />
                ระยะพัฒนาการต้นทุเรียน
              </h3>
              <button
                onClick={() => onNavigate?.("plots")}
                className="text-xs font-bold text-primary hover:underline"
              >
                ดูรายละเอียด
              </button>
            </div>
            
            {topActiveStages.length > 0 ? (
              <div className="space-y-2">
                {topActiveStages.map(([stgKey, count]) => {
                  const percent = Math.round((count / totalTrees) * 100)
                  const label = FLOWER_STAGE_LABELS[stgKey as FlowerStage] || stgKey
                  return (
                    <div key={stgKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{label}</span>
                        <span className="font-bold text-muted-foreground">{count} ต้น ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">ยังไม่มีการบันทึกระยะต้น</p>
            )}
          </div>

          {/* Orchard Health Pulse */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <HeartPulse size={16} className="text-emerald-500" />
                  ภาพรวมสุขภาพต้นไม้
                </h3>
                <span className="text-xs font-bold text-muted-foreground">ทั้งหมด {totalTrees} ต้น</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div className="rounded-xl bg-emerald-500/10 p-2 sm:p-2.5 border border-emerald-500/20">
                  <p className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400">สมบูรณ์ดี</p>
                  <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-300 mt-0.5">{healthCounts.good}</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2 sm:p-2.5 border border-amber-500/20">
                  <p className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400">ปานกลาง</p>
                  <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-300 mt-0.5">{healthCounts.fair}</p>
                </div>
                <div className="rounded-xl bg-rose-500/10 p-2 sm:p-2.5 border border-rose-500/20">
                  <p className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-400">ต้องดูแล</p>
                  <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-300 mt-0.5">{healthCounts.poor}</p>
                </div>
              </div>
            </div>

            {healthCounts.poor > 0 ? (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-3 flex items-center gap-1.5">
                <AlertTriangle size={14} /> มีต้นทุเรียน {healthCounts.poor} ต้น ที่ต้องตรวจรักษาโรค/แมลง
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5">
                <Check size={14} /> สุขภาพต้นไม้โดยรวมอยู่ในเกณฑ์ดี
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. Recommended Articles Carousel */}
      <div className="dashboard-panel rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
        <div className="mb-4 sm:mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-black text-foreground">บทความแนะนำสำหรับการดูแลสวน</h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">เทคนิคการทำดอก ดูแลระบบน้ำ จัดการโรค และตลาดทุเรียน</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onNavigate?.("articles")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline mr-2"
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const track = document.getElementById("dashboard-article-carousel")
                if (track) track.scrollBy({ left: -280, behavior: "smooth" })
              }}
              aria-label="เลื่อนบทความซ้าย"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:bg-muted active:scale-95"
            >
              <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => {
                const track = document.getElementById("dashboard-article-carousel")
                if (track) track.scrollBy({ left: 280, behavior: "smooth" })
              }}
              aria-label="เลื่อนบทความขวา"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
            >
              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        <div id="dashboard-article-carousel" className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
          {recommendedArticles.map(article => (
            <button
              key={article.id}
              type="button"
              onClick={() => onOpenArticle?.(article.id) ?? onNavigate?.("articles")}
              className="group w-[210px] sm:w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
            >
              <div className="relative h-24 sm:h-28 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="260px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5 sm:p-4">
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-primary">
                  {article.category}
                </span>
                <h3 className="mt-1.5 sm:mt-2 line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
                <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary">
                  อ่านต่อ <ArrowRight size={12} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 7. Recommended Products Carousel (Conditional Feature Flag) */}
      {SHOW_RECOMMENDED_PRODUCTS && activeProducts.length > 0 && (
        <div className="dashboard-panel rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-xl font-black text-foreground">ปุ๋ยและยาแนะนำ</h2>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">ปุ๋ย สารปรับปรุงดิน และสารป้องกันกำจัดศัตรูพืช</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onOpenProducts?.()}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline mr-2"
              >
                ดูสินค้าทั้งหมด <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("left")}
                aria-label="เลื่อนปุ๋ยและยาซ้าย"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => scrollProducts("right")}
                aria-label="เลื่อนปุ๋ยและยาขวา"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
              >
                <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          <div
            id="dashboard-product-carousel"
            className="flex w-full cursor-grab select-none gap-3 sm:gap-4 overflow-x-auto active:cursor-grabbing scrollbar-hide pb-2"
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
                onClick={() => onOpenProducts?.()}
                className="group flex h-[17.5rem] sm:h-[18rem] w-[185px] sm:w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-background text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
              >
                <div className="relative h-24 sm:h-28 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="220px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                  <span className="inline-block w-fit text-[10px] sm:text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  <h3 className="mt-1.5 line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-xs font-normal text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-primary">
                    ดูข้อมูลสินค้า <ExternalLink size={12} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {entryModal && (
        <div
          ref={entryModalRef}
          data-escapable-layer="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setEntryModal(null)}
        >
          <div className="w-full max-w-lg rounded-3xl border border-[#B9DCC8] bg-card p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">บันทึกข้อมูลสวน</p>
                <h3 className="mt-1 text-lg font-black text-foreground">
                  {entryModal === "task" ? "สร้างกำหนดการใหม่" : "บันทึกกิจกรรมสวน"}
                </h3>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">กรอกข้อมูลสั้น ๆ แล้วบันทึกได้ทันที</p>
              </div>
              <button type="button" onClick={() => setEntryModal(null)} className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="ปิด">
                <X size={18} />
              </button>
            </div>

            {entryModal === "task" ? (
              <div className="space-y-3">
                <input
                  autoFocus
                  value={quickForm.title}
                  onChange={event => setQuickForm(form => ({ ...form, title: event.target.value }))}
                  onKeyDown={event => event.key === "Enter" && handleQuickAdd()}
                  placeholder="เช่น รดน้ำแปลงบน, พ่นยากำจัดเพลี้ย..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                    วันที่
                    <input type="date" value={quickForm.date} onChange={event => setQuickForm(form => ({ ...form, date: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
                  </label>
                  <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                    แปลง
                    <select value={quickForm.plotId} onChange={event => setQuickForm(form => ({ ...form, plotId: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40">
                      {data.plots.length === 0 ? <option value="">ยังไม่มีแปลง</option> : data.plots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                  ความสำคัญ
                  <select value={quickForm.priority} onChange={event => setQuickForm(form => ({ ...form, priority: event.target.value as Task["priority"] }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="high">สำคัญมาก (ด่วน)</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="low">ทั่วไป</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                    วันที่
                    <input type="date" value={activityForm.date} onChange={event => setActivityForm(form => ({ ...form, date: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
                  </label>
                  <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                    แปลง
                    <select value={activityForm.plotId} onChange={event => setActivityForm(form => ({ ...form, plotId: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="">ไม่ระบุแปลง</option>
                      {data.plots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="space-y-1.5 text-xs font-black text-muted-foreground">
                  ประเภทกิจกรรม
                  <select value={activityForm.activityType} onChange={event => setActivityForm(form => ({ ...form, activityType: event.target.value as ActivityType }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40">
                    {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(type => <option key={type} value={type}>{ACTIVITY_LABELS[type]}</option>)}
                  </select>
                </label>
                <textarea
                  autoFocus
                  value={activityForm.description}
                  onChange={event => setActivityForm(form => ({ ...form, description: event.target.value }))}
                  placeholder="เช่น ใส่ปุ๋ยสูตร 15-15-15 ให้แปลง A..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setEntryModal(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-black text-muted-foreground transition-colors hover:bg-muted">ยกเลิก</button>
              <button type="button" onClick={entryModal === "task" ? handleQuickAdd : handleQuickActivityAdd} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]">
                <Check size={16} className="mr-1.5 inline-block" /> บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Location Editor Modal */}
      {showLocationEditor && (
        <div
          ref={locationEditorRef}
          data-escapable-layer="true"
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-foreground">ตั้งค่าตำแหน่งสวน</h3>
                <p className="text-xs font-semibold text-muted-foreground">ค้นหาและเลือกอำเภอ/จังหวัดเพื่อดึงสภาพอากาศที่แม่นยำ</p>
              </div>
              <button
                onClick={() => {
                  setShowLocationEditor(false)
                  setPendingLocation(null)
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={placeSearch}
                onChange={event => setPlaceSearch(event.target.value)}
                onKeyDown={event => event.key === "Enter" && handlePlaceSearch()}
                placeholder="เช่น ท่าใหม่ จันทบุรี, หลังสวน ชุมพร..."
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={handlePlaceSearch}
                disabled={searchingPlace || !placeSearch.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {searchingPlace ? "ค้นหา..." : "ค้นหา"}
              </button>
            </div>

            <div className="mt-3 max-h-52 overflow-y-auto rounded-2xl border border-border bg-background">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs font-semibold text-muted-foreground">
                  {pendingLocation ? "เลือกสถานที่แล้ว กด 'บันทึก' ด้านล่าง" : "พิมพ์ชื่ออำเภอหรือจังหวัดเพื่อค้นหา"}
                </div>
              ) : (
                searchResults.map(result => {
                  const label = result.display_name.split(",").slice(0, 2).join(",").trim()
                  const isSelected =
                    pendingLocation?.lat === parseFloat(parseFloat(result.lat).toFixed(4)) &&
                    pendingLocation?.lon === parseFloat(parseFloat(result.lon).toFixed(4))
                  return (
                    <button
                      key={`${result.lat}-${result.lon}-${result.display_name}`}
                      onClick={() => selectPlace(result)}
                      className={`flex w-full items-start gap-2 border-b border-border/60 px-3.5 py-2.5 text-left last:border-b-0 transition-colors ${
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-black">{label}</p>
                        <p className="line-clamp-1 text-xs font-medium text-muted-foreground">{result.display_name}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {pendingLocation && (
              <div className="mt-3 rounded-xl bg-primary/10 p-2.5 text-xs font-bold text-primary flex items-center gap-2">
                <MapPin size={14} /> สถานที่ที่เลือก: {pendingLocation.label}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowLocationEditor(false)
                  setPendingLocation(null)
                }}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-black text-muted-foreground hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveLocation}
                disabled={!pendingLocation}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                บันทึกตำแหน่ง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
