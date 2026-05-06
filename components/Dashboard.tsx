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
      className={`bg-card border border-border rounded-2xl p-4 flex gap-3 items-start shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary/50 hover:-translate-y-0.5' : ''}`}
    >
      <div className={`p-2.5 rounded-xl ${bgColor}`}><Icon size={20} className={color} /></div>
      <div>
        <p className="text-muted-foreground text-base leading-relaxed">{label}</p>
        <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-muted-foreground text-base mt-0.5">{sub}</p>}
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
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <Image
          src="/images/durian-banner.png"
          alt="สวนทุเรียน"
          width={1200}
          height={400}
          className="w-full h-44 sm:h-52 md:h-72 lg:h-80 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <p className="text-white/90 text-lg font-black mb-1.5 drop-shadow-md uppercase tracking-widest">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-white text-3xl lg:text-4xl font-black mb-4 drop-shadow-lg leading-tight">สวัสดีคุณชาวสวน, <br className="sm:hidden" />ยินดีต้อนรับกลับมา</h1>
          <p className="text-white/80 text-lg font-bold mb-6 max-w-xl hidden sm:block">วันนี้สวนทุเรียนของคุณมีความพร้อมสูงสุด ระบบพร้อมช่วยคุณดูแลจัดการทุกอย่าง</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <Sun size={15} className="text-yellow-400" />
              <span className="text-white text-base font-semibold">{WEATHER.temp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <Droplets size={15} className="text-blue-300" />
              <span className="text-white text-base font-semibold">{WEATHER.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <CloudSun size={15} className="text-white" />
              <span className="text-white text-base font-semibold">{WEATHER.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <StatCard onClick={() => onNavigate?.("plots")} icon={Trees} label="ต้นทั้งหมด" value={`${totalTrees} ต้น`} color="text-accent" bgColor="bg-accent/15" />
        <StatCard onClick={() => onNavigate?.("operations")} icon={ListTodo} label="งานต้องทำ" value={`${pendingTasks} งาน`} color="text-secondary" bgColor="bg-secondary/15" />

        {/* Combined Finance Card */}
        <div
          onClick={() => onNavigate?.("finance")}
          className="col-span-2 bg-card border border-border rounded-2xl p-4 flex shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-accent/15"><TrendingUp size={20} className="text-accent" /></div>
            <div>
              <p className="text-muted-foreground text-base leading-relaxed">รายรับเดือนนี้</p>
              <p className="text-lg sm:text-xl font-bold leading-tight text-accent">฿{thisMonthIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-px bg-border mx-2"></div>
          <div className="flex items-center gap-3 flex-1 pl-2">
            <div className="p-2.5 rounded-xl bg-destructive/15"><TrendingDown size={20} className="text-destructive" /></div>
            <div>
              <p className="text-muted-foreground text-base leading-relaxed">รายจ่ายเดือนนี้</p>
              <p className="text-lg sm:text-xl font-bold leading-tight text-destructive">฿{thisMonthExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Upcoming Tasks */}
        <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-foreground flex items-center gap-2"><ListTodo size={20} className="text-amber-500" />งานที่ต้องทำเร็วๆ นี้</h3>
          <button onClick={() => onNavigate?.("operations")} className="text-base text-primary font-bold hover:underline">ดูทั้งหมด</button>
        </div>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-2">
            {upcomingTasks.map(t => (
              <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-xl p-4 text-center">
            <ListTodo size={24} className="text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-base text-muted-foreground">ไม่มีงานที่ต้องทำเร็วๆ นี้</p>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div
        className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
        onClick={() => onNavigate?.("operations")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg text-foreground flex items-center gap-2"><Coins size={20} className="text-primary" />กิจกรรมล่าสุด</h3>
          <span className="text-base text-primary font-bold hover:underline">ดูทั้งหมด</span>
        </div>
        {recentActivities.length > 0 ? (
          <div className="space-y-2">
            {recentActivities.map(a => {
              const Icon = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.other
              return (
                <div key={a.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-xl transition-colors">
                  <div className={`p-2.5 rounded-xl bg-background shadow-sm border border-border/50 ${ACTIVITY_COLORS[a.activityType] || 'text-muted-foreground'}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-foreground leading-snug">{a.description}</p>
                    <p className="text-base text-foreground/60 font-bold mt-0.5">{plotName(a.plotId)} · {formatDate(a.date)}</p>
                  </div>
                  {a.cost > 0 && <span className="text-base font-black text-destructive">฿{a.cost.toLocaleString()}</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-base text-muted-foreground">ไม่มีกิจกรรมล่าสุด</p>
          </div>
        )}
      </div>

      {/* Recommended Articles — full width on desktop */}
      <div className="lg:col-span-2 space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-500" /> บทความแนะนำ
          </h3>
          <button onClick={() => onNavigate?.("articles")} className="text-base text-primary font-medium hover:underline">ดูทั้งหมด</button>
        </div>
        
        {/* Horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {ARTICLES.map(article => (
            <div
              key={article.id}
              className="flex-shrink-0 w-[280px] snap-start lg:w-auto bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/40 group"
            >
              {/* Cover image */}
              <div className="relative h-36 lg:h-40 shrink-0 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent`} />
                {/* Category badge on image */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-base text-primary font-bold uppercase tracking-wider">{article.category}</span>
                </div>
              </div>
              {/* Text content */}
              <div className="p-4 sm:p-5">
                <h4 className="font-bold text-base text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">{article.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      </div>
    </div>
  )
}
