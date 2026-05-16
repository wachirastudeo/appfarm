"use client"
import { useMemo, useState, useEffect } from "react"
import { AppData, Task } from "@/lib/store"
import { 
  Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Trees, ListTodo, Coins, Sun, CloudSun, BookOpen, Clock,
  Sprout, Zap, Scissors, PackageSearch, ClipboardList, MoreHorizontal, Plus, X, Check, MapPin
} from "lucide-react"
import Image from "next/image"
import { TaskCard } from "./TaskPlanner"

interface Props {
  data: AppData
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles") => void
  onOpenSettings?: () => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
  farmLocation: { lat: number; lon: number; label: string } | null
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", bgColor = "bg-primary/10", onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; bgColor?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`orchard-card rounded-xl p-4 flex gap-3 items-center overflow-hidden relative ${onClick ? 'orchard-card-hover cursor-pointer' : ''}`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#dff0e4]/55" />
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

const ARTICLES = [
  { id: 1, title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", image: "/images/articles/article_watering_1778037948644.png" },
  { id: 2, title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", image: "/images/articles/article_disease_1778037967060.png" },
  { id: 3, title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", image: "/images/articles/article_market_1778038017547.png" }
]


const ACTIVITY_ICONS: any = { fertilize: Sprout, spray: Zap, water: Droplets, prune: Scissors, harvest: PackageSearch, inspect: ClipboardList, other: MoreHorizontal }
const ACTIVITY_COLORS: any = { fertilize: "text-green-500", spray: "text-yellow-500", water: "text-blue-500", prune: "text-orange-500", harvest: "text-primary", inspect: "text-purple-500", other: "text-muted-foreground" }

export default function Dashboard({ data, onNavigate, onOpenSettings, updateTask, deleteTask, addTask, farmLocation }: Props) {
  const [weather, setWeather] = useState({ temp: "–", humidity: "–", wind: "–", condition: "กำลังโหลด..." })

  // Memoize loc so the object reference only changes when lat/lon actually change
  const loc = useMemo(
    () => farmLocation ?? { lat: 12.6081, lon: 102.1048 }, // default: จันทบุรี
    [farmLocation]
  )

  // Use farmLocation as the dependency — ensures re-fetch whenever the user picks a new place
  useEffect(() => {
    setWeather({ temp: "–", humidity: "–", wind: "–", condition: "กำลังโหลด..." })
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current
        setWeather({
          temp: Math.round(c.temperature_2m),
          humidity: Math.round(c.relative_humidity_2m),
          wind: Math.round(c.wind_speed_10m),
          condition: WEATHER_CODE_MAP[c.weather_code] ?? `รหัส ${c.weather_code}`,
        })
      })
      .catch(() => setWeather(w => ({ ...w, condition: "ไม่สามารถโหลดได้" })))
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

  return (
    <div className="space-y-5">
      {/* Hero Banner with Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-[0_22px_55px_rgba(15,59,37,0.22)] ring-1 ring-white/70">
        <Image
          src="/images/durian-banner.png"
          alt="สวนทุเรียน"
          width={1200}
          height={400}
          className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,59,37,0.86),rgba(15,59,37,0.46)_48%,rgba(15,59,37,0.12)),linear-gradient(0deg,rgba(0,0,0,0.52),transparent_55%)]" />
        <div className="absolute right-4 top-4 hidden sm:flex items-center gap-2 rounded-full bg-[#dff0e4]/92 px-3 py-1.5 text-[#0f3b25] shadow-lg">
          <Sprout size={15} />
          <span className="text-xs font-bold">Smart Farm View</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-8">
          <p className="text-[#dff0e4] text-sm font-semibold mb-1 uppercase tracking-wider">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-white text-2xl lg:text-3xl font-black drop-shadow-lg leading-tight">สวัสดีคุณชาวสวน</h1>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 transition-colors shrink-0"
                title={farmLocation ? "เปลี่ยนสถานที่สวน" : "ตั้งสถานที่สวน"}
              >
                <MapPin size={16} className="text-white/80" />
              </button>
            )}
          </div>
          <a
            href={`https://www.windy.com/${loc.lat}/${loc.lon}?${loc.lat},${loc.lon},10`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-wrap gap-2 group/weather"
          >
            <div className="flex items-center gap-1.5 bg-white/18 backdrop-blur-sm rounded-full px-3 py-1.5 ring-1 ring-white/16 group-hover/weather:bg-white/28 transition-colors">
              <Sun size={14} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">{weather.temp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/18 backdrop-blur-sm rounded-full px-3 py-1.5 ring-1 ring-white/16 group-hover/weather:bg-white/28 transition-colors">
              <Droplets size={14} className="text-blue-300" />
              <span className="text-white text-sm font-medium">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/18 backdrop-blur-sm rounded-full px-3 py-1.5 ring-1 ring-white/16 group-hover/weather:bg-white/28 transition-colors">
              <CloudSun size={14} className="text-white/80" />
              <span className="text-white text-sm font-medium">{weather.condition}</span>
            </div>
            {farmLocation?.label && (
              <div className="flex items-center gap-1.5 bg-white/12 backdrop-blur-sm rounded-full px-3 py-1.5 ring-1 ring-white/12 group-hover/weather:bg-white/22 transition-colors">
                <Wind size={13} className="text-white/60" />
                <span className="text-white/80 text-xs font-medium truncate max-w-[120px]">{farmLocation.label}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#dff0e4]/24 border border-[#dff0e4]/42 backdrop-blur-sm rounded-full px-3 py-1.5 group-hover/weather:bg-[#dff0e4]/34 transition-colors">
              <Wind size={13} className="text-cyan-300" />
              <span className="text-white text-xs font-semibold">Windy ↗</span>
            </div>
          </a>
        </div>
      </div>

      {/*
        Mobile:  Banner → Tasks → Stats → Activities → Articles
        Desktop: Banner → Stats → [Tasks | Activities] → Articles
      */}
      <div className="flex flex-col gap-5">
        {/* Stats Grid — order-2 on mobile, order-1 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 order-2 lg:order-1">
          <StatCard onClick={() => onNavigate?.("plots")} icon={Trees} label="ต้นทั้งหมด" value={`${totalTrees} ต้น`} color="text-primary" bgColor="bg-primary/10" />
          <StatCard onClick={() => onNavigate?.("operations")} icon={ListTodo} label="งานต้องทำ" value={`${pendingTasks} งาน`} color="text-amber-600" bgColor="bg-amber-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingUp} label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingDown} label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} color="text-rose-600" bgColor="bg-rose-100" />
        </div>

        {/* Tasks (mobile: order-1 / desktop: order-2 inside 2-col grid with Activities) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start order-1 lg:order-2">
          {/* Tasks card — always visible */}
          <div className="orchard-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-amber-100 p-1.5"><ListTodo size={18} className="text-amber-600" /></span>งานที่ต้องทำ</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTask(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold transition-all ${
                    showAddTask ? "bg-amber-100 text-amber-700" : "bg-[#dff0e4] text-[#1f5a35] hover:bg-[#cfe8d6]"
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
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={quickForm.date}
                    onChange={e => setQuickForm(f => ({ ...f, date: e.target.value }))}
                    className="flex-1 bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <select
                    value={quickForm.plotId}
                    onChange={e => setQuickForm(f => ({ ...f, plotId: e.target.value }))}
                    className="flex-1 bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  >
                    {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    value={quickForm.priority}
                    onChange={e => setQuickForm(f => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className="bg-white border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
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
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
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
              <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-[#dff0e4] p-1.5"><ClipboardList size={18} className="text-primary" /></span>กิจกรรมล่าสุด</h3>
              <span className="text-sm text-primary font-medium">ดูทั้งหมด</span>
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.map(a => {
                  const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-[#dff0e4]/45 px-2 rounded-lg transition-colors">
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
                <p className="text-sm text-muted-foreground">ไม่มีกิจกรรมล่าสุด</p>
              </div>
            )}
          </div>
        </div>

        {/* Activities — mobile only (order-3, after Stats) */}
        <div
          className="lg:hidden orchard-card orchard-card-hover rounded-xl p-4 cursor-pointer order-3"
          onClick={() => onNavigate?.("operations")}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><span className="rounded-lg bg-[#dff0e4] p-1.5"><ClipboardList size={18} className="text-primary" /></span>กิจกรรมล่าสุด</h3>
            <span className="text-sm text-primary font-medium">ดูทั้งหมด</span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map(a => {
                const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-[#dff0e4]/45 px-2 rounded-lg transition-colors">
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
              <p className="text-sm text-muted-foreground">ไม่มีกิจกรรมล่าสุด</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Articles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-[#0f3b25] px-4 py-3 text-white shadow-[0_12px_30px_rgba(15,59,37,0.16)]">
          <h3 className="font-bold flex items-center gap-2">
            <span className="rounded-lg bg-white/12 p-1.5"><BookOpen size={18} className="text-[#dff0e4]" /></span> บทความแนะนำ
          </h3>
          <button onClick={() => onNavigate?.("articles")} className="text-sm text-[#dff0e4] font-medium hover:text-white">ดูทั้งหมด</button>
        </div>
        
        {/* Horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {ARTICLES.map(article => (
            <div
              key={article.id}
              className="flex-shrink-0 w-[260px] snap-start lg:w-auto orchard-card orchard-card-hover rounded-xl overflow-hidden cursor-pointer group"
            >
              <div className="relative h-32 lg:h-36 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-[#dff0e4]/95 backdrop-blur-sm rounded-full px-2.5 py-0.5 shadow-sm">
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
