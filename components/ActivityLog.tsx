"use client"
import { useEffect, useState } from "react"
import { Activity, ActivityType, ACTIVITY_LABELS, Plot, useAppData } from "@/lib/store"
import { Plus, Trash2, Sprout, Droplets, Scissors, PackageSearch, Zap, ClipboardList, MoreHorizontal, Clock, ListFilter } from "lucide-react"

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
  prune: "text-orange-400", harvest: "text-primary", inspect: "text-purple-400", other: "text-[#527060]",
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

  useEffect(() => {
    if (localStorage.getItem("open_activity_form") === "1") {
      setShowForm(true)
      localStorage.removeItem("open_activity_form")
    }
  }, [])

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
        <h2 className="text-lg font-bold text-foreground">บันทึกสวน</h2>
        <button onClick={() => { if(showForm) handleCancel(); else setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-base font-black hover:bg-[#0F5A34] transition-colors shadow-[0_10px_24px_rgba(20,107,62,0.16)]">
          <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#E7F3EC] rounded-xl p-4 space-y-3 border border-[#B9DCC8]">
          <h3 className="font-bold text-foreground text-base">{editingId ? "แก้ไขบันทึกสวน" : "บันทึกสวนใหม่"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">วันที่</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">แปลง</label>
              <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">ประเภทกิจกรรม</label>
            <select 
              value={form.activityType} 
              onChange={e => set("activityType", e.target.value)} 
              className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => (
                <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">รายละเอียด</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="บันทึกรายละเอียดกิจกรรม..." />
          </div>
          <div>
            <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">ค่าใช้จ่าย (บาท)</label>
            <input type="number" value={form.cost} onChange={e => set("cost", Number(e.target.value))} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" min={0} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCancel} className="flex-1 bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl py-3 text-[#527060] font-bold hover:bg-[#E7F3EC] transition-colors">ยกเลิก</button>
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-bold hover:bg-[#0F5A34] shadow-lg shadow-primary/20 transition-all active:scale-95">{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</button>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilter("all")} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${filter === "all" ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "border-[#B9DCC8] bg-white text-[#146B3E] hover:border-primary/50"}`}>
          <ListFilter size={14} /> ทั้งหมด
        </button>
        {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => {
          const Icon = ACTIVITY_ICONS[t]
          return (
            <button key={t} onClick={() => setFilter(t)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${filter === t ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "border-[#B9DCC8] bg-white text-[#146B3E] hover:border-primary/50"}`}>
              <Icon size={14} /> {ACTIVITY_LABELS[t]}
            </button>
          )
        })}
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-dashed border-[#B9DCC8]">
            <ClipboardList size={48} className="text-[#527060] mx-auto mb-3" />
            <p className="text-[#527060] font-medium">ยังไม่มีบันทึกสวนในรายการนี้</p>
          </div>
        ) : filtered.map(a => {
          const Icon = ACTIVITY_ICONS[a.activityType]
          return (
            <div key={a.id} className="flex items-start gap-4 rounded-2xl border border-[#B9DCC8] bg-white p-4 shadow-[0_10px_24px_rgba(20,107,62,0.08)] transition-all group hover:border-primary/50">
              <div className={`p-3 bg-[#F7FBF8] rounded-xl shrink-0 shadow-[0_10px_24px_rgba(20,107,62,0.10)] border border-[#B9DCC8] ${ACTIVITY_COLORS[a.activityType]}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-foreground">{ACTIVITY_LABELS[a.activityType]}</span>
                  <span className="text-base text-[#527060]">•</span>
                  <span className="text-base font-medium text-primary">{plotName(a.plotId)}</span>
                </div>
                <p className="text-base text-[#527060] leading-relaxed mb-2">{a.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-base font-medium text-[#527060] flex items-center gap-1">
                    <Clock size={12} /> {formatDate(a.date)}
                  </span>
                  {a.cost > 0 && (
                    <span className="text-base font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      ฿{a.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleEdit(a)} className="p-2 text-[#527060] hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <ClipboardList size={18} />
                </button>
                <button onClick={() => deleteActivity(a.id)} className="p-2 text-[#527060] hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
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
