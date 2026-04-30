"use client"
import { useMemo } from "react"
import { AppData } from "@/lib/store"
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Trees, ListTodo, Coins, Sun, CloudSun } from "lucide-react"
import Image from "next/image"

interface Props {
  data: AppData
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary", bgColor = "bg-primary/10" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; bgColor?: string
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 items-start shadow-sm hover:shadow-md transition-shadow">
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

export default function Dashboard({ data }: Props) {
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
          src="/images/durian-banner.jpg"
          alt="สวนทุเรียน"
          width={800}
          height={300}
          className="w-full h-44 sm:h-52 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/80 text-xs mb-1">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="text-white text-xl font-bold mb-2">สวัสดี, ยินดีต้อนรับ</h1>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <Sun size={14} className="text-yellow-300" />
              <span className="text-white text-sm font-medium">{WEATHER.temp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <Droplets size={14} className="text-blue-300" />
              <span className="text-white text-sm font-medium">{WEATHER.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <CloudSun size={14} className="text-white" />
              <span className="text-white text-sm font-medium">{WEATHER.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Trees} label="ต้นทั้งหมด" value={totalTrees} sub={`${data.plots.length} แปลง · ${totalArea} ไร่`} color="text-accent" bgColor="bg-accent/15" />
        <StatCard icon={ListTodo} label="งานรอดำเนินการ" value={pendingTasks} sub="งาน" color="text-secondary" bgColor="bg-secondary/15" />
        <StatCard icon={TrendingUp} label="รายรับเดือนนี้" value={`฿${thisMonthIncome.toLocaleString()}`} color="text-accent" bgColor="bg-accent/15" />
        <StatCard icon={TrendingDown} label="รายจ่ายเดือนนี้" value={`฿${thisMonthExpense.toLocaleString()}`} color="text-destructive" bgColor="bg-destructive/15" />
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><ListTodo size={16} className="text-amber-500" />งานที่ต้องทำเร็วๆ นี้</h3>
          <div className="space-y-2">
            {upcomingTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{plotName(t.plotId)} · {formatDate(t.date)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  t.priority === "high" ? "bg-destructive/15 text-destructive" :
                  t.priority === "medium" ? "bg-secondary/15 text-secondary" : "bg-accent/15 text-accent"
                }`}>
                  {t.priority === "high" ? "ด่วน" : t.priority === "medium" ? "ปกติ" : "ต่ำ"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Coins size={16} className="text-primary" />กิจกรรมล่าสุด</h3>
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
        </div>
      )}
    </div>
  )
}
