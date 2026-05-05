"use client"
import { useState } from "react"
import { Activity, ActivityType, ACTIVITY_LABELS, Plot, useAppData } from "@/lib/store"
import { Plus, Trash2, Sprout, Droplets, Scissors, PackageSearch, Zap, ClipboardList, MoreHorizontal, Clock } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
  updateActivity: AppDataReturn["updateActivity"]
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

export default function ActivityLog({ data, addActivity, deleteActivity, updateActivity }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ActivityType | "all">("all")
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    activityType: "fertilize" as ActivityType,
    description: "",
    cost: 0,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.description || !form.plotId) return
    const activityData = { ...form, date: new Date(form.date).toISOString() }
    
    if (editingId) {
      updateActivity(editingId, activityData)
      setEditingId(null)
    } else {
      addActivity(activityData)
    }
    
    setForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "", cost: 0 })
    setShowForm(false)
  }

  const handleEdit = (act: Activity) => {
    setForm({
      date: act.date.split("T")[0],
      plotId: act.plotId,
      activityType: act.activityType,
      description: act.description,
      cost: act.cost,
    })
    setEditingId(act.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "", cost: 0 })
  }

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

  const filtered = data.activities
    .filter(a => filter === "all" || a.activityType === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">บันทึกกิจกรรม</h2>
        <button onClick={() => { if(showForm) handleCancel(); else setShowForm(true); }} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
        </button>
      </div>

      {showForm && (
        <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
          <h3 className="font-bold text-foreground text-base">{editingId ? "แก้ไขบันทึกกิจกรรม" : "บันทึกกิจกรรมใหม่"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">วันที่</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">แปลง</label>
              <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">ประเภทกิจกรรม</label>
            <select 
              value={form.activityType} 
              onChange={e => set("activityType", e.target.value)} 
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => (
                <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">รายละเอียด</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="บันทึกรายละเอียดกิจกรรม..." />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">ค่าใช้จ่าย (บาท)</label>
            <input type="number" value={form.cost} onChange={e => set("cost", Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" min={0} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCancel} className="flex-1 bg-background border border-border rounded-xl py-3 text-muted-foreground font-bold hover:bg-muted/50 transition-colors">ยกเลิก</button>
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95">{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</button>
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
          <div className="bg-muted/20 rounded-xl p-6 text-center border border-dashed border-border">
            <ClipboardList size={48} className="text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">ยังไม่มีบันทึกกิจกรรมในรายการนี้</p>
          </div>
        ) : filtered.map(a => {
          const Icon = ACTIVITY_ICONS[a.activityType]
          return (
            <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 rounded-2xl transition-all group border-b border-border/50 last:border-0">
              <div className={`p-3 bg-background rounded-xl shrink-0 shadow-sm border border-border/50 ${ACTIVITY_COLORS[a.activityType]}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold text-foreground">{ACTIVITY_LABELS[a.activityType]}</span>
                  <span className="text-xs text-muted-foreground/60">•</span>
                  <span className="text-sm font-medium text-primary">{plotName(a.plotId)}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{a.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {formatDate(a.date)}
                  </span>
                  {a.cost > 0 && (
                    <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      ฿{a.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleEdit(a)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <ClipboardList size={18} />
                </button>
                <button onClick={() => deleteActivity(a.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
