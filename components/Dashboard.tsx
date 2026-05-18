"use client"
import { useMemo, useState, useEffect } from "react"
import { AppData, Task } from "@/lib/store"
import { 
  Droplets, Wind, TrendingUp, TrendingDown, ListTodo, Sun, CloudSun, CloudRain, BookOpen,
  Sprout, Zap, Scissors, PackageSearch, ClipboardList, MoreHorizontal, Plus, X, Check, MapPin,
  AlertTriangle
} from "lucide-react"
import Image from "next/image"
import { TaskCard } from "./TaskPlanner"
import DurianIcon from "./DurianIcon"
import { Skeleton } from "./ui/skeleton"

interface Props {
  data: AppData
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles") => void
  onOpenArticle?: (articleId: string) => void
  onOpenSettings?: () => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
  farmLocation: FarmLocation | null
  userName?: string
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", bgColor = "bg-primary/10", onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; bgColor?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`orchard-card rounded-xl p-4 flex gap-3 items-center overflow-hidden relative ${onClick ? 'orchard-card-hover cursor-pointer' : ''}`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#E7F3EC]/55" />
      <div className={`relative p-3 rounded-xl ${bgColor} ring-1 ring-black/5`}><Icon size={22} className={color} /></div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm font-medium truncate">{label}</p>
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

export default function Dashboard({ data, onNavigate, onOpenArticle, onOpenSettings, updateTask, deleteTask, addTask, farmLocation, userName }: Props) {
  const [weather, setWeather] = useState<{ temp: string | number; humidity: string | number; rain: string | number; wind: string | number; condition: string }>({ temp: "–", humidity: "–", rain: "–", wind: "–", condition: "กำลังโหลด..." })
  const [forecastAlert, setForecastAlert] = useState<ForecastAlert | null>(null)
  const [showLocationEditor, setShowLocationEditor] = useState(false)
  const [placeSearch, setPlaceSearch] = useState("")
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [pendingLocation, setPendingLocation] = useState<FarmLocation | null>(null)
  const [searchingPlace, setSearchingPlace] = useState(false)
  const recommendedArticles = useMemo(() => data.articles.filter(article => article.status === "published").slice(0, 3), [data.articles])
  const weatherLoading = weather.condition === "กำลังโหลด..."

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
  const totalTrees = useMemo(() => data.plots.reduce((s, p) => s + p.trees.length, 0), [data])
  const totalArea = useMemo(() => data.plots.reduce((s, p) => s + p.area, 0), [data])
  const pendingTasks = useMemo(() => data.tasks.filter(t => t.status === "pending").length, [data])
  const thisMonthIncome = useMemo(() => {
    const now = new Date()
    return data.finance.filter(f => {
      const d = new Date(f.date)
      return f.type === "income" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((s, f) => s + f.amount, 0)
  }, [data])
  const thisMonthExpense = useMemo(() => {
    const now = new Date()
    return data.finance.filter(f => {
      const d = new Date(f.date)
      return f.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((s, f) => s + f.amount, 0)
  }, [data])

  const recentActivities = useMemo(() =>
    [...data.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4),
    [data])

  const upcomingTasks = useMemo(() =>
    data.tasks.filter(t => t.status === "pending").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3),
    [data])

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

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

  const handleQuickAdd = () => {
    if (!quickForm.title.trim()) return
    addTask({
      title: quickForm.title.trim(),
      date: new Date(quickForm.date).toISOString(),
      plotId: quickForm.plotId,
      priority: quickForm.priority,
      description: "",
      status: "pending",
    })
    setQuickForm({ title: "", date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", priority: "medium" })
    setShowAddTask(false)
  }

  const handlePlaceSearch = async () => {
    if (!placeSearch.trim()) return
    setSearchingPlace(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeSearch + " ประเทศไทย")}` +
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

  const saveLocation = () => {
    if (!pendingLocation) return
    localStorage.setItem("farm_location", JSON.stringify(pendingLocation))
    window.dispatchEvent(new Event("farm_location_changed"))
    setShowLocationEditor(false)
    setPlaceSearch("")
    setSearchResults([])
    setPendingLocation(null)
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner with Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-[0_22px_55px_rgba(15,59,37,0.22)] ring-1 ring-white/70">
        <Image
          src="/images/durian-banner.avif"
          alt="สวนทุเรียน"
          width={1200}
          height={400}
          className="w-full h-[27rem] sm:h-[25rem] lg:h-[25rem] object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,59,37,0.86),rgba(15,59,37,0.46)_48%,rgba(15,59,37,0.12)),linear-gradient(0deg,rgba(0,0,0,0.52),transparent_55%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-8">
          <p className="text-[#E7F3EC] text-sm font-semibold mb-1 uppercase tracking-wider">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-black drop-shadow-lg leading-tight">
              สวัสดีคุณ{userName?.trim() || "ชาวสวน"}
            </h1>
            <button
              onClick={() => setShowLocationEditor(true)}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 transition-colors shrink-0"
              title={farmLocation ? "เปลี่ยนสถานที่สวน" : "ตั้งสถานที่สวน"}
            >
              <MapPin size={16} className="text-white/80" />
            </button>
          </div>
          <div className="w-full max-w-[29rem] rounded-2xl bg-white/16 p-3 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md sm:p-4">
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
              <button
                type="button"
                onClick={() => setShowLocationEditor(true)}
                className="flex min-w-0 flex-wrap items-center gap-1.5 text-left text-xs font-bold text-white/72 transition-colors hover:text-white"
              >
                <MapPin size={13} className="shrink-0" />
                <span className="max-w-[12rem] truncate sm:max-w-[16rem]">{farmLocation?.label ?? "ค่าเริ่มต้น: จันทบุรี"}</span>
              </button>
              {!farmLocation && (
                <button
                  onClick={() => setShowLocationEditor(true)}
                  className="shrink-0 rounded-full bg-amber-300/18 px-3 py-1 text-xs font-black text-amber-50 ring-1 ring-amber-200/36 transition-colors hover:bg-amber-300/28"
                >
                  ตั้งสถานที่
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
                    className={`rounded-full px-2 py-1 text-[10px] font-black ring-1 ${
                      forecastAlert.level === "storm"
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-4 shadow-2xl sm:p-5">
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
                      className={`flex w-full items-start gap-2 border-b border-border/60 px-3 py-3 text-left last:border-b-0 transition-colors ${
                        isSelected ? "bg-[#E7F3EC] text-[#146B3E]" : "hover:bg-muted/60"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 order-2 lg:order-1">
          <StatCard onClick={() => onNavigate?.("plots")} icon={DurianIcon} label="ต้นทั้งหมด" value={`${totalTrees} ต้น`} color="text-primary" bgColor="bg-primary/10" />
          <StatCard onClick={() => onNavigate?.("operations")} icon={ListTodo} label="งานต้องทำ" value={`${pendingTasks} งาน`} color="text-amber-600" bgColor="bg-amber-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingUp} label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingDown} label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} color="text-rose-600" bgColor="bg-rose-100" />
        </div>

        {/* Tasks (mobile: order-1 / desktop: order-2 inside 2-col grid with Activities) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start order-1 lg:order-2">
          {/* Tasks card — always visible */}
          <div className="orchard-card rounded-xl p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-amber-100 p-1.5"><ListTodo size={18} className="text-amber-600" /></span>งานที่ต้องทำ</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTask(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold transition-all ${
                    showAddTask ? "bg-amber-100 text-amber-700" : "bg-[#E7F3EC] text-[#146B3E] hover:bg-[#D8EEE2]"
                  }`}
                >
                  {showAddTask ? <X size={14} /> : <Plus size={14} />}
                  {showAddTask ? "ยกเลิก" : "เพิ่ม"}
                </button>
                <button onClick={() => onNavigate?.("operations")} className="text-sm text-primary font-medium hover:underline">ดูทั้งหมด</button>
              </div>
            </div>

            {/* Quick Add Form */}
            {showAddTask && (
              <div className="mb-3 bg-[#fff8e8] border border-amber-200 rounded-xl p-3 space-y-2 shadow-inner">
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
                    {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  disabled={!quickForm.title.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Check size={15} /> บันทึกงาน
                </button>
              </div>
            )}

            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
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
            className="hidden lg:block orchard-card orchard-card-hover rounded-xl p-4 cursor-pointer"
            onClick={() => onNavigate?.("operations")}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-[#E7F3EC] p-1.5"><ClipboardList size={18} className="text-primary" /></span>บันทึกสวน</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    localStorage.setItem("open_activity_form", "1")
                    onNavigate?.("operations")
                  }}
                  className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  <Plus size={14} /> บันทึก
                </button>
                <span className="text-sm text-primary font-medium">ดูทั้งหมด</span>
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
                <p className="text-sm text-muted-foreground">ไม่มีบันทึกสวน</p>
              </div>
            )}
          </div>
        </div>

        {/* Activities — mobile only (order-3, after Stats) */}
        <div
          className="lg:hidden orchard-card orchard-card-hover rounded-xl p-3 sm:p-4 cursor-pointer order-3"
          onClick={() => onNavigate?.("operations")}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-[#E7F3EC] p-1.5"><ClipboardList size={18} className="text-primary" /></span>บันทึกสวน</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  localStorage.setItem("open_activity_form", "1")
                  onNavigate?.("operations")
                }}
                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Plus size={14} /> บันทึก
              </button>
              <span className="text-sm text-primary font-medium">ดูทั้งหมด</span>
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
              <p className="text-sm text-muted-foreground">ไม่มีบันทึกสวน</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Articles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-[#146B3E] px-4 py-3 text-white shadow-[0_12px_30px_rgba(15,59,37,0.16)]">
          <h3 className="font-bold flex items-center gap-2">
            <span className="rounded-lg bg-white/12 p-1.5"><BookOpen size={18} className="text-[#E7F3EC]" /></span> บทความแนะนำ
          </h3>
          <button onClick={() => onNavigate?.("articles")} className="text-sm text-[#E7F3EC] font-medium hover:text-white">ดูทั้งหมด</button>
        </div>
        
        {/* Horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {recommendedArticles.map(article => (
            <div
              key={article.id}
              onClick={() => onOpenArticle?.(article.id) ?? onNavigate?.("articles")}
              className="flex-shrink-0 w-[260px] snap-start lg:w-auto orchard-card orchard-card-hover rounded-xl overflow-hidden cursor-pointer group"
            >
              <div className="relative h-32 lg:h-36 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-[#E7F3EC]/95 backdrop-blur-sm rounded-full px-2.5 py-0.5 shadow-sm">
                  <span className="text-xs text-primary font-semibold">{article.category}</span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{article.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
