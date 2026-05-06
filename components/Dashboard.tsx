"use client"
import { useMemo } from "react"
import { AppData, Task } from "@/lib/store"
import { 
  Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Trees, ListTodo, Coins, Sun, CloudSun, BookOpen, Clock,
  Sprout, Zap, Scissors, PackageSearch, ClipboardList, MoreHorizontal 
} from "lucide-react"
import Image from "next/image"
import { TaskCard } from "./TaskPlanner"

interface Props {
  data: AppData
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles") => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", bgColor = "bg-primary/10", onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; bgColor?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-4 flex gap-3 items-center shadow-sm hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-primary/40 hover:-translate-y-1' : ''}`}
    >
      <div className={`p-3 rounded-xl ${bgColor}`}><Icon size={22} className={color} /></div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm font-medium truncate">{label}</p>
        <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const WEATHER = { temp: 31, humidity: 75, wind: 12, condition: "มีเมฆบางส่วน" }

const ARTICLES = [
  { id: 1, title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", image: "/images/articles/article_watering_1778037948644.png" },
  { id: 2, title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", image: "/images/articles/article_disease_1778037967060.png" },
  { id: 3, title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", image: "/images/articles/article_market_1778038017547.png" }
]


const ACTIVITY_ICONS: any = { fertilize: Sprout, spray: Zap, water: Droplets, prune: Scissors, harvest: PackageSearch, inspect: ClipboardList, other: MoreHorizontal }
const ACTIVITY_COLORS: any = { fertilize: "text-green-500", spray: "text-yellow-500", water: "text-blue-500", prune: "text-orange-500", harvest: "text-primary", inspect: "text-purple-500", other: "text-muted-foreground" }

export default function Dashboard({ data, onNavigate, updateTask, deleteTask }: Props) {
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

  return (
    <div className="space-y-5">
      {/* Hero Banner with Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <Image
          src="/images/durian-banner.png"
          alt="สวนทุเรียน"
          width={1200}
          height={400}
          className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-8">
          <p className="text-white/80 text-sm font-semibold mb-1 uppercase tracking-wider">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-white text-2xl lg:text-3xl font-bold mb-3 drop-shadow-lg leading-tight">สวัสดีคุณชาวสวน</h1>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Sun size={14} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">{WEATHER.temp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Droplets size={14} className="text-blue-300" />
              <span className="text-white text-sm font-medium">{WEATHER.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <CloudSun size={14} className="text-white/80" />
              <span className="text-white text-sm font-medium">{WEATHER.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard onClick={() => onNavigate?.("plots")} icon={Trees} label="ต้นทั้งหมด" value={`${totalTrees} ต้น`} color="text-primary" bgColor="bg-primary/10" />
        <StatCard onClick={() => onNavigate?.("operations")} icon={ListTodo} label="งานต้องทำ" value={`${pendingTasks} งาน`} color="text-amber-600" bgColor="bg-amber-100" />
        <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingUp} label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} color="text-emerald-600" bgColor="bg-emerald-100" />
        <StatCard onClick={() => onNavigate?.("finance")} icon={TrendingDown} label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} color="text-rose-600" bgColor="bg-rose-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Upcoming Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><ListTodo size={18} className="text-amber-500" />งานที่ต้องทำ</h3>
            <button onClick={() => onNavigate?.("operations")} className="text-sm text-primary font-medium hover:underline">ดูทั้งหมด</button>
          </div>
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

        {/* Recent Activities */}
        <div
          className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate?.("operations")}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><Coins size={18} className="text-primary" />กิจกรรมล่าสุด</h3>
            <span className="text-sm text-primary font-medium hover:underline">ดูทั้งหมด</span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map(a => {
                const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
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
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-500" /> บทความแนะนำ
          </h3>
          <button onClick={() => onNavigate?.("articles")} className="text-sm text-primary font-medium hover:underline">ดูทั้งหมด</button>
        </div>
        
        {/* Horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {ARTICLES.map(article => (
            <div
              key={article.id}
              className="flex-shrink-0 w-[260px] snap-start lg:w-auto bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/30 group"
            >
              <div className="relative h-32 lg:h-36 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-0.5">
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
