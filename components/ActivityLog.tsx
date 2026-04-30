"use client"
import { useState } from "react"
import { Activity, ActivityType, ACTIVITY_LABELS, Plot, useAppData } from "@/lib/store"
import { Plus, Trash2, Sprout, Droplets, Scissors, PackageSearch, Zap, ClipboardList, MoreHorizontal } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  fertilize: Sprout, spray: Zap, water: Droplets, prune: Scissors,
  harvest: PackageSearch, inspect: ClipboardList, other: MoreHorizontal,
}
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  fertilize: "text-green-400", spray: "text-yellow-400", water: "text-blue-400",
  prune: "text-orange-400", harvest: "text-primary", inspect: "text-purple-400", other: "text-muted-foreground",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
}

export default function ActivityLog({ data, addActivity, deleteActivity }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<ActivityType | "all">("all")
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    activityType: "fertilize" as ActivityType,
    description: "",
    cost: 0,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    if (!form.description || !form.plotId) return
    addActivity({ ...form, date: new Date(form.date).toISOString() })
    setForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "", cost: 0 })
    setShowForm(false)
  }

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

  const filtered = data.activities
    .filter(a => filter === "all" || a.activityType === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">บันทึกกิจกรรม</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">บันทึกกิจกรรมใหม่</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">วันที่</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">แปลง</label>
              <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ประเภทกิจกรรม</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => {
                const Icon = ACTIVITY_ICONS[t]
                return (
                  <button key={t} onClick={() => set("activityType", t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.activityType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Icon size={13} />{ACTIVITY_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">รายละเอียด</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="รายละเอียด..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ค่าใช้จ่าย (บาท)</label>
            <input type="number" value={form.cost} onChange={e => set("cost", Number(e.target.value))} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" min={0} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-muted-foreground">ยกเลิก</button>
            <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:opacity-90">บันทึก</button>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilter("all")} className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>ทั้งหมด</button>
        {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{ACTIVITY_LABELS[t]}</button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <ClipboardList size={36} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">ยังไม่มีบันทึกกิจกรรม</p>
          </div>
        ) : filtered.map(a => {
          const Icon = ACTIVITY_ICONS[a.activityType]
          return (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 group">
              <div className={`p-2 bg-accent/30 rounded-lg shrink-0 ${ACTIVITY_COLORS[a.activityType]}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{ACTIVITY_LABELS[a.activityType]}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{plotName(a.plotId)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{a.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                  {a.cost > 0 && <span className="text-xs text-destructive">฿{a.cost.toLocaleString()}</span>}
                </div>
              </div>
              <button onClick={() => deleteActivity(a.id)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
