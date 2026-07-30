"use client"
import { useMemo, useState, useEffect, useRef } from "react"
import { AppData, Task } from "@/lib/store"
import { validateDate, validateText } from "@/lib/form-validation"
import {
  Droplets, Wind, TrendingUp, TrendingDown, ListTodo, Sun, CloudSun, CloudRain,
  Sprout, Zap, Scissors, PackageSearch, ClipboardList, MoreHorizontal, Plus, X, Check, MapPin,
  AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react"
import Image from "next/image"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { SHOW_RECOMMENDED_PRODUCTS } from "@/lib/feature-flags"
import { TaskCard } from "./TaskPlanner"
import DurianIcon from "./DurianIcon"
import { Skeleton } from "./ui/skeleton"
import SparklesText from "./magicui/sparkles-text"
import BorderBeam from "./magicui/border-beam"

interface Props {
  data: AppData
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles") => void
  onOpenArticle?: (articleId: string) => void
  onOpenSettings?: () => void
  onOpenProducts?: () => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
  farmLocation: FarmLocation | null
  locationStorageKey: string
  onUpdateFarmLocation: (location: FarmLocation) => Promise<void>
  coverImage?: string | null
  coverPosition?: string
  userName?: string
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", bgColor = "bg-primary/10", onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; bgColor?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`orchard-card rounded-[28px] p-5 sm:p-6 flex gap-3 items-center overflow-hidden relative ${onClick ? 'orchard-card-hover cursor-pointer' : ''}`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#E7F3EC]/55" />
      <div className={`relative p-3 rounded-xl ${bgColor} ring-1 ring-black/5`}><Icon size={22} className={color} /></div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm font-medium leading-tight">{label}</p>
        <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
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

const ACTIVITY_ICONS: any = { fertilize: Sprout, spray: Zap, water: Droplets, prune: Scissors, harvest: PackageSearch, inspect: ClipboardList, other: MoreHorizontal }
const ACTIVITY_COLORS: any = { fertilize: "text-green-500", spray: "text-yellow-500", water: "text-blue-500", prune: "text-orange-500", harvest: "text-primary", inspect: "text-purple-500", other: "text-muted-foreground" }

export default function Dashboard({ data, onNavigate, onOpenArticle, onOpenSettings, onOpenProducts, updateTask, deleteTask, addTask, farmLocation, locationStorageKey, onUpdateFarmLocation, coverImage, coverPosition, userName }: Props) {
  const [weather, setWeather] = useState<{ temp: string | number; humidity: string | number; rain: string | number; wind: string | number; condition: string }>({ temp: "–", humidity: "–", rain: "–", wind: "–", condition: "กำลังโหลด..." })
  const [forecastAlert, setForecastAlert] = useState<ForecastAlert | null>(null)
  const [showLocationEditor, setShowLocationEditor] = useState(false)
  const [placeSearch, setPlaceSearch] = useState("")
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [pendingLocation, setPendingLocation] = useState<FarmLocation | null>(null)
  const [searchingPlace, setSearchingPlace] = useState(false)
  const locationEditorRef = useRef<HTMLDivElement | null>(null)
  const recommendedArticles = useMemo(() => {
    const active = data.articles.filter(article => article.status === "published")
    if (active.length >= 9) return active.slice(0, 9)
    const defaultSeeds = [
      { id: "art1", title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", image: "/images/articles/article_watering_1778037948644.avif", status: "published" },
      { id: "art2", title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", image: "/images/articles/article_disease_1778037967060.avif", status: "published" },
      { id: "art3", title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", image: "/images/articles/article_market_1778038017547.avif", status: "published" }
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

  // Products carousel
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
    }, 3600)
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

  // Memoize loc so the object reference only changes when lat/lon actually change
  const loc = useMemo(
    () => farmLocation ?? { lat: 12.6081, lon: 102.1048 }, // default: จันทบุรี
    [farmLocation]
  )

  // Use farmLocation as the dependency — ensures re-fetch whenever the user picks a new place
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
          label: hasStorm ? "เตือนพายุ 5 วัน" : hasHeavyRain ? `ฝนสูง ${maxRain}%` : `ฝน ${maxRain}% ใน 5 วัน`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmLocation])
  const totalTrees = useMemo(() => data.plots.reduce((s, p) => s + p.trees.length, 0), [data.plots])
  const totalArea = useMemo(() => data.plots.reduce((s, p) => s + p.area, 0), [data.plots])
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
  const recentActivities = useMemo(() =>
    [...data.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4),
    [data.activities])

  const upcomingTasks = useMemo(() =>
    data.tasks.filter(t => t.status === "pending").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3),
    [data.tasks])

  const plotName = (id: string) => plotNameById.get(id) ?? id

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })
  }

  const [showAddTask, setShowAddTask] = useState(false)
  const [quickForm, setQuickForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    priority: "medium" as Task["priority"],
  })

  // data.plots loads async (store/Supabase), so quickForm.plotId may be "" on first
  // mount even though the <select> visually shows the first plot. Sync it once plots
  // arrive (or when the selected plot is removed) so "บันทึกงาน" doesn't falsely block.
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
    // Fall back to the first plot if state hasn't caught up to the rendered <select>.
    const plotId = data.plots.some(p => p.id === quickForm.plotId)
      ? quickForm.plotId
      : data.plots[0]?.id ?? ""
    if (!plotId) {
      alert("ยังไม่มีแปลงทุเรียน กรุณาเพิ่มแปลงก่อนจึงจะบันทึกงานได้")
      setShowAddTask(false)
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
    setShowAddTask(false)
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
      const errMsg = err instanceof Error ? err.message : (typeof err === "object" && err !== null && "message" in err ? String((err as any).message) : String(err))
      alert("บันทึกตำแหน่งสวนไม่สำเร็จ: " + errMsg)
      return
    }
    setShowLocationEditor(false)
    setPlaceSearch("")
    setSearchResults([])
    setPendingLocation(null)
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner with Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(15,59,37,0.25)] ring-1 ring-white/80 transition-all duration-300 hover:shadow-[0_30px_70px_rgba(15,59,37,0.3)]">
        <Image
          src={coverImage || "/images/durian-banner.avif"}
          alt="สวนทุเรียน"
          width={1200}
          height={400}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
          style={{ objectPosition: coverPosition }}
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,59,37,0.88),rgba(15,59,37,0.48)_48%,rgba(15,59,37,0.15)),linear-gradient(0deg,rgba(0,0,0,0.58),transparent_55%)]" />
        <div className="relative flex min-h-[27rem] flex-col justify-end p-4 sm:min-h-[25rem] sm:p-5 lg:p-8">
          <p className="mb-1 max-w-full text-sm font-semibold leading-tight text-[#E7F3EC] break-words">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-black drop-shadow-lg leading-tight">
              สวัสดีคุณ<SparklesText text={userName?.trim() || "ชาวสวน"} className="p-0 text-white font-black inline-block" sparklesCount={3} />
            </h1>
            <button
              onClick={() => setShowLocationEditor(true)}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 transition-colors shrink-0"
              title={farmLocation ? "เปลี่ยนสถานที่สวน" : "ตั้งสถานที่สวน"}
            >
              <MapPin size={16} className="text-white/80" />
            </button>
          </div>
          <div className="w-full max-w-[29rem] rounded-2xl bg-white/16 p-3 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md sm:p-4 relative overflow-hidden">
            <BorderBeam duration={10} size={120} colorFrom="#10B981" colorTo="#F59E0B" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/18">
                  <Sun size={24} className="text-yellow-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-white/68">อากาศสวนวันนี้</p>
                  {weatherLoading ? (
                    <div className="mt-1 flex items-end gap-2">
                      <Skeleton className="h-9 w-16 rounded-lg bg-white/20" />
                      <Skeleton className="h-5 w-28 rounded-lg bg-white/20" />
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="text-3xl font-black leading-none">{weather.temp}°</span>
                      <span className="truncate text-sm font-bold text-white/88">{weather.condition}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:w-52">
                <div className="rounded-xl bg-blue-50 px-2 py-2 text-blue-700 shadow-sm ring-1 ring-blue-100">
                  <CloudRain size={15} className="mx-auto mb-1 text-blue-600" />
                  {weatherLoading ? <Skeleton className="mx-auto h-5 w-10 bg-blue-100" /> : <p className="text-base font-black leading-none">{weather.rain}%</p>}
                  <p className="mt-1 text-[10px] font-black text-blue-600">ฝนวันนี้</p>
                </div>
                <div className="rounded-xl bg-white/14 px-2 py-2 ring-1 ring-white/12">
                  <Wind size={14} className="mx-auto mb-1 text-cyan-200" />
                  {weatherLoading ? <Skeleton className="mx-auto h-4 w-8 bg-white/20" /> : <p className="text-sm font-black leading-none">{weather.wind}</p>}
                  <p className="mt-1 text-[10px] font-bold text-white/62">กม./ชม.</p>
                </div>
                <a
                  href={`https://www.windy.com/${loc.lat}/${loc.lon}?${loc.lat},${loc.lon},10`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#E7F3EC]/22 px-2 py-2 text-center ring-1 ring-[#E7F3EC]/30 transition-colors hover:bg-[#E7F3EC]/32"
                >
                  <Wind size={14} className="mx-auto mb-1 text-cyan-200" />
                  <p className="text-sm font-black leading-none">Windy</p>
                  <p className="mt-1 text-[10px] font-bold text-white/62">เปิด</p>
                </a>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/12 pt-2 sm:flex-row sm:items-center sm:justify-between">
              {farmLocation ? (
                <button
                  type="button"
                  onClick={() => setShowLocationEditor(true)}
                  className="flex min-w-0 flex-wrap items-center gap-1.5 text-left text-xs font-bold text-white/72 transition-colors hover:text-white"
                >
                  <MapPin size={13} className="shrink-0" />
                  <span className="max-w-[12rem] truncate sm:max-w-[16rem]">{farmLocation.label}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLocationEditor(true)}
                  className="inline-flex min-h-10 w-fit max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-white/10 transition-all hover:bg-[#0F5A34] active:scale-95 sm:px-4"
                >
                  <MapPin size={16} />
                  <span className="sm:hidden">ตั้งสถานที่สวน</span>
                  <span className="hidden sm:inline">ตั้งค่าสถานที่สวนเลย</span>
                </button>
              )}
            </div>
            {weatherLoading ? (
              <div className="mt-3 border-t border-white/12 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-32 bg-white/20" />
                  <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
                </div>
                <div className="-mx-1 flex gap-2 overflow-hidden px-1 pb-1">
                  {[1, 2, 3, 4, 5].map(item => (
                    <Skeleton key={item} className="h-[5.5rem] w-[4.9rem] shrink-0 rounded-2xl bg-white/28" />
                  ))}
                </div>
              </div>
            ) : forecastAlert && forecastAlert.days.length > 0 && (
              <div className="mt-3 border-t border-white/12 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wider text-white/78">พยากรณ์ล่วงหน้า 5 วัน</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-black ring-1 ${forecastAlert.level === "storm"
                      ? "bg-rose-50 text-rose-700 ring-rose-100"
                      : forecastAlert.level === "rain"
                        ? "bg-amber-50 text-amber-800 ring-amber-100"
                        : "bg-emerald-50 text-emerald-800 ring-emerald-100"
                      }`}
                  >
                    {forecastAlert.label}
                  </span>
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:overflow-visible sm:pb-0">
                  {forecastAlert.days.map(day => {
                    const Icon = day.code >= 95 ? AlertTriangle : day.rain >= 45 ? CloudRain : CloudSun
                    return (
                      <div key={day.date} className="w-[4.9rem] shrink-0 rounded-2xl bg-white/90 px-2.5 py-2 text-center shadow-sm ring-1 ring-white/80">
                        <p className="text-[11px] font-black text-[#527060]">{day.day}</p>
                        <Icon size={18} className={`mx-auto my-1 ${day.code >= 95 ? "text-rose-600" : day.rain >= 45 ? "text-blue-600" : "text-amber-500"}`} />
                        <p className="text-xs font-black text-[#143422]">{day.rain}%</p>
                        <p className="mt-0.5 text-[10px] font-bold text-[#527060]">
                          {day.high ?? "–"}°/{day.low ?? "–"}°
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationEditor && (
        <div ref={locationEditorRef} data-escapable-layer="true" className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 p-3 pt-5 backdrop-blur-sm sm:p-4 sm:pt-8">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-4 shadow-2xl sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-foreground">เปลี่ยนสถานที่สวน</h3>
                <p className="text-sm font-semibold text-muted-foreground">ค้นหา เลือกสถานที่ แล้วกดตกลงเพื่อบันทึก</p>
              </div>
              <button
                onClick={() => {
                  setShowLocationEditor(false)
                  setPendingLocation(null)
                }}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                placeholder="เช่น อำเภอหลังสวน ชุมพร"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={handlePlaceSearch}
                disabled={searchingPlace || !placeSearch.trim()}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {searchingPlace ? "ค้น..." : "ค้นหา"}
              </button>
            </div>

            <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-border bg-background">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm font-semibold text-muted-foreground">
                  {pendingLocation ? "เลือกสถานที่แล้ว กดตกลงเพื่อบันทึก" : "พิมพ์ชื่อสถานที่เพื่อค้นหา"}
                </div>
              ) : (
                searchResults.map(result => {
                  const label = result.display_name.split(",").slice(0, 2).join(",").trim()
                  const isSelected = pendingLocation?.lat === parseFloat(parseFloat(result.lat).toFixed(4))
                    && pendingLocation?.lon === parseFloat(parseFloat(result.lon).toFixed(4))
                  return (
                    <button
                      key={`${result.lat}-${result.lon}-${result.display_name}`}
                      onClick={() => selectPlace(result)}
                      className={`flex w-full items-start gap-2 border-b border-border/60 px-3 py-3 text-left last:border-b-0 transition-colors ${isSelected ? "bg-[#E7F3EC] text-[#146B3E]" : "hover:bg-muted/60"
                        }`}
                    >
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-black">{label}</p>
                        <p className="line-clamp-1 text-xs font-semibold text-muted-foreground">{result.display_name}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {pendingLocation && (
              <div className="mt-3 rounded-2xl bg-[#E7F3EC] px-3 py-2 text-sm font-black text-[#146B3E]">
                เลือก: {pendingLocation.label}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowLocationEditor(false)
                  setPendingLocation(null)
                }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-black text-muted-foreground transition-colors hover:bg-muted"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveLocation}
                disabled={!pendingLocation}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        Mobile:  Banner → Tasks → Stats → Activities → Articles
        Desktop: Banner → Stats → [Tasks | Activities] → Articles
      */}
      <div className="flex flex-col gap-5">
        {/* Stats Grid — order-2 on mobile, order-1 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 order-2 lg:order-1">
          <StatCard onClick={() => onNavigate?.("plots")} icon={DurianIcon} label="ต้นทั้งหมด" value={`${totalTrees} ต้น`} color="text-primary" bgColor="bg-primary/10" />
          <StatCard onClick={() => onNavigate?.("operations")} icon={ListTodo} label="งานต้องทำ" value={`${pendingTasks} งาน`} color="text-amber-600" bgColor="bg-amber-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingUp} label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingDown} label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} color="text-rose-600" bgColor="bg-rose-100" />
        </div>

        {/* Tasks (mobile: order-1 / desktop: order-2 inside 2-col grid with Activities) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6 items-stretch order-1 lg:order-2">
          {/* Tasks card — always visible */}
          <div
            onClick={() => onNavigate?.("operations")}
            className="orchard-card orchard-card-hover rounded-[32px] p-5 sm:p-6 xl:p-7 flex h-full min-h-[18rem] flex-col cursor-pointer"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600"><ListTodo size={18} /></span>งานที่ต้องทำ</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddTask(v => !v); }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition-all ${
                    showAddTask
                      ? "bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm"
                      : "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(20,107,62,0.12)] hover:bg-[#0F5A34]"
                  }`}
                >
                  {showAddTask ? <X size={14} /> : <Plus size={14} />}
                  {showAddTask ? "ยกเลิก" : "เพิ่ม"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate?.("operations"); }}
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-black text-primary transition-colors hover:bg-[#E7F3EC]"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {showAddTask && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mb-3 bg-[#fff8e8] border border-amber-200 rounded-xl p-3 space-y-2 shadow-inner"
              >
                <input
                  autoFocus
                  value={quickForm.title}
                  onChange={e => setQuickForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                  placeholder="ชื่องาน..."
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="date"
                    value={quickForm.date}
                    onChange={e => setQuickForm(f => ({ ...f, date: e.target.value }))}
                    className="min-w-0 bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <select
                    value={quickForm.plotId}
                    onChange={e => setQuickForm(f => ({ ...f, plotId: e.target.value }))}
                    className="min-w-0 bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  >
                    {data.plots.length === 0
                      ? <option value="">ยังไม่มีแปลง</option>
                      : data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    value={quickForm.priority}
                    onChange={e => setQuickForm(f => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className="min-w-0 bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  >
                    <option value="high">สำคัญมาก</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="low">ไม่เร่งด่วน</option>
                  </select>
                </div>
                <button
                  onClick={handleQuickAdd}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-black hover:bg-[#0F5A34] transition-colors shadow-[0_10px_24px_rgba(20,107,62,0.12)]"
                >
                  <Check size={15} /> บันทึกงาน
                </button>
              </div>
            )}

            {upcomingTasks.length > 0 ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                {upcomingTasks.map(t => (
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} plots={data.plots} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ListTodo size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">ไม่มีงานที่ต้องทำ</p>
              </div>
            )}
          </div>

          {/* Activities — desktop only (inside 2-col grid) */}
          <div
            className="hidden lg:block orchard-card orchard-card-hover rounded-[32px] p-5 sm:p-6 xl:p-7 cursor-pointer h-full min-h-[18rem]"
            onClick={() => onNavigate?.("operations")}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F3EC] text-primary"><ClipboardList size={18} /></span>บันทึกสวน</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    localStorage.setItem("open_activity_form", "1")
                    onNavigate?.("operations")
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(20,107,62,0.12)] transition-colors hover:bg-[#0F5A34]"
                >
                  <Plus size={14} /> บันทึก
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate?.("operations") }}
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-black text-primary transition-colors hover:bg-[#E7F3EC]"
                >ดูทั้งหมด</button>
              </div>
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.map(a => {
                  const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-[#E7F3EC]/45 px-2 rounded-lg transition-colors">
                      <div className={`p-2 rounded-lg bg-muted ${ACTIVITY_COLORS[a.activityType] || 'text-muted-foreground'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{plotName(a.plotId)} · {formatDate(a.date)}</p>
                      </div>
                      {a.cost > 0 && <span className="text-sm font-bold text-destructive shrink-0">฿{a.cost.toLocaleString()}</span>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ClipboardList size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">ไม่มีบันทึกสวน</p>
              </div>
            )}
          </div>
        </div>

        {/* Activities — mobile only (order-3, after Stats) */}
        <div
          className="lg:hidden orchard-card orchard-card-hover rounded-[32px] p-5 sm:p-6 cursor-pointer order-3"
          onClick={() => onNavigate?.("operations")}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F3EC] text-primary"><ClipboardList size={18} /></span>บันทึกสวน</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  localStorage.setItem("open_activity_form", "1")
                  onNavigate?.("operations")
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(20,107,62,0.12)] transition-colors hover:bg-[#0F5A34]"
              >
                <Plus size={14} /> บันทึก
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate?.("operations") }}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-black text-primary transition-colors hover:bg-[#E7F3EC]"
              >ดูทั้งหมด</button>
            </div>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map(a => {
                const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-[#E7F3EC]/45 px-2 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg bg-muted ${ACTIVITY_COLORS[a.activityType] || 'text-muted-foreground'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.description}</p>
                      <p className="text-xs text-muted-foreground">{plotName(a.plotId)} · {formatDate(a.date)}</p>
                    </div>
                    {a.cost > 0 && <span className="text-sm font-bold text-destructive shrink-0">฿{a.cost.toLocaleString()}</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ClipboardList size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">ไม่มีบันทึกสวน</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Articles */}
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-[0_12px_40px_rgba(20,107,62,0.04)] border border-border/80 dark:border-border/30">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black text-foreground">บทความแนะนำ</h2>
            <p className="text-sm font-bold text-muted-foreground">เริ่มจากความรู้เรื่องน้ำ โรค ปุ๋ย ดอก และตลาดทุเรียน</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => onNavigate?.("articles")} className="hidden items-center gap-2 text-sm font-black text-primary transition-colors hover:text-primary/80 sm:inline-flex">
              ดูบทความทั้งหมด <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const track = document.getElementById("dashboard-article-carousel")
                if (track) track.scrollBy({ left: -300, behavior: "smooth" })
              }}
              aria-label="เลื่อนบทความซ้าย"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-primary transition-all hover:border-primary/30 hover:bg-muted active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                const track = document.getElementById("dashboard-article-carousel")
                if (track) track.scrollBy({ left: 300, behavior: "smooth" })
              }}
              aria-label="เลื่อนบทความขวา"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/95 hover:scale-105 active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div id="dashboard-article-carousel" className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {recommendedArticles.map(article => (
            <button
              key={article.id}
              type="button"
              onClick={() => onOpenArticle?.(article.id) ?? onNavigate?.("articles")}
              className="group w-[240px] sm:w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30"
            >
              <div className="relative h-24 overflow-hidden sm:h-28">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 240px"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                />
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
      </div>

      {/* Products Carousel */}
      {SHOW_RECOMMENDED_PRODUCTS && activeProducts.length > 0 && (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md py-6 shadow-[0_12px_40px_rgba(20,107,62,0.04)] dark:border-border/30">
          <div className="mb-4 flex items-center justify-between gap-3 px-5 sm:px-6">
            <div>
              <h2 className="text-2xl font-black text-foreground">ปุ๋ยและยาแนะนำ</h2>
              <p className="text-sm font-bold text-muted-foreground">รวมปุ๋ย ยา สารเคมี และอุปกรณ์ที่ใช้กับสวนทุเรียน</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => onOpenProducts?.()} className="hidden rounded-2xl border border-border bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:inline-flex">
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
              id="dashboard-product-carousel"
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
                  onClick={() => onOpenProducts?.()}
                  className="group flex h-[18.5rem] w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 sm:h-[19rem] sm:w-[220px]"
                >
                  <div className="h-24 overflow-hidden sm:h-28 relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="220px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    />
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
        </div>
      )}
    </div>
  )
}
