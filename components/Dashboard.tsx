"use client"
import { useMemo } from "react"
import { AppData, Task } from "@/lib/store"
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Trees, ListTodo, Coins, Sun, CloudSun, BookOpen, Clock } from "lucide-react"
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
        <p className="text-muted-foreground text-xs leading-relaxed">{label}</p>
        <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-muted-foreground text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const WEATHER = { temp: 31, humidity: 75, wind: 12, condition: "มีเมฆบางส่วน" }

const ARTICLES = [
  { id: 1, title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", readTime: "5 นาที", color: "from-emerald-400 to-teal-600" },
  { id: 2, title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", readTime: "8 นาที", color: "from-amber-400 to-orange-500" },
  { id: 3, title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", readTime: "3 นาที", color: "from-blue-400 to-indigo-600" }
]

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
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white/90 text-sm font-medium mb-1 drop-shadow-md">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="text-white text-2xl font-black mb-3 drop-shadow-lg">สวัสดี, ยินดีต้อนรับ</h1>
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <Sun size={15} className="text-yellow-400" />
              <span className="text-white text-sm font-semibold">{WEATHER.temp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <Droplets size={15} className="text-blue-300" />
              <span className="text-white text-sm font-semibold">{WEATHER.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-sm">
              <CloudSun size={15} className="text-white" />
              <span className="text-white text-sm font-semibold">{WEATHER.condition}</span>
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
              <p className="text-muted-foreground text-xs leading-relaxed">รายรับเดือนนี้</p>
              <p className="text-lg sm:text-xl font-bold leading-tight text-accent">฿{thisMonthIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-px bg-border mx-2"></div>
          <div className="flex items-center gap-3 flex-1 pl-2">
            <div className="p-2.5 rounded-xl bg-destructive/15"><TrendingDown size={20} className="text-destructive" /></div>
            <div>
              <p className="text-muted-foreground text-xs leading-relaxed">รายจ่ายเดือนนี้</p>
              <p className="text-lg sm:text-xl font-bold leading-tight text-destructive">฿{thisMonthExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Upcoming Tasks */}
        <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><ListTodo size={16} className="text-amber-500" />งานที่ต้องทำเร็วๆ นี้</h3>
          <button onClick={() => onNavigate?.("operations")} className="text-xs text-primary font-medium hover:underline">ดูทั้งหมด</button>
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
            <p className="text-sm text-muted-foreground">ไม่มีงานที่ต้องทำเร็วๆ นี้</p>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div
        className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
        onClick={() => onNavigate?.("operations")}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Coins size={16} className="text-primary" />กิจกรรมล่าสุด</h3>
          <span className="text-xs text-primary font-medium hover:underline">ดูทั้งหมด</span>
        </div>
        {recentActivities.length > 0 ? (
          <div className="space-y-2">
            {recentActivities.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{plotName(a.plotId)} · {formatDate(a.date)}</p>
                </div>
                {a.cost > 0 && <span className="text-xs text-muted-foreground">฿{a.cost.toLocaleString()}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">ไม่มีกิจกรรมล่าสุด</p>
          </div>
        )}
      </div>

      {/* Recommended Articles */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-500" /> บทความแนะนำ
          </h3>
          <button onClick={() => onNavigate?.("articles")} className="text-xs text-primary font-medium hover:underline">ดูทั้งหมด</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARTICLES.map(article => (
            <div key={article.id} className="flex bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/40 group hover:-translate-y-1">
              <div className="w-28 sm:w-32 bg-muted relative shrink-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${article.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen size={24} className="text-white/60 group-hover:text-white transition-colors group-hover:scale-110 duration-300" />
                </div>
              </div>
              <div className="p-3 sm:p-4 flex flex-col justify-center flex-1 min-w-0">
                <p className="text-[10px] text-primary font-bold mb-1.5 uppercase tracking-wider">{article.category}</p>
                <h4 className="font-bold text-sm text-foreground line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">{article.title}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mt-auto">
                  <Clock size={12} /> {article.readTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      </div>
    </div>
  )
}
