"use client"
import { useState, useMemo } from "react"
import { Task, TaskStatus, useAppData } from "@/lib/store"
import { Plus, Check, X, Trash2, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, Pencil } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
}

const PRIORITY_COLORS = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-yellow-500 bg-yellow-50",
  low: "border-l-green-600 bg-green-50",
}
const PRIORITY_LABELS = { high: "ด่วน", medium: "ปกติ", low: "ต่ำ" }
const STATUS_LABELS: Record<TaskStatus, string> = { pending: "รอดำเนินการ", done: "เสร็จแล้ว", cancelled: "ยกเลิก" }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
const DAYS_TH = ["อา","จ","อ","พ","พฤ","ศ","ส"]

export default function TaskPlanner({ data, addTask, updateTask, deleteTask }: Props) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split("T")[0])
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  
  const [form, setForm] = useState({
    date: selectedDate,
    plotId: data.plots[0]?.id ?? "",
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "pending" as TaskStatus,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    if (!form.title || !form.plotId) return
    addTask({ ...form, date: new Date(form.date).toISOString() })
    setForm({ date: selectedDate, plotId: data.plots[0]?.id ?? "", title: "", description: "", priority: "medium", status: "pending" })
    setShowForm(false)
  }

  // Calendar data
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    data.tasks.forEach(t => {
      const d = t.date.split("T")[0]
      if (!map[d]) map[d] = []
      map[d].push(t)
    })
    return map
  }, [data.tasks])

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

  const allFilteredTasks = useMemo(() =>
    data.tasks
      .filter(t => statusFilter === "all" || t.status === statusFilter)
      .sort((a, b) => {
        const order = { pending: 0, done: 1, cancelled: 2 }
        return (order[a.status] - order[b.status]) || new Date(a.date).getTime() - new Date(b.date).getTime()
      }),
    [data.tasks, statusFilter])

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

  const pendingTasks = allFilteredTasks.filter(t => t.status === "pending")
  const completedTasks = allFilteredTasks.filter(t => t.status !== "pending")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">แผนการทำงาน</h2>
        <button 
          onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(v => !v) }} 
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />{showForm ? "ยกเลิก" : "เพิ่มงาน"}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(["all","pending","done","cancelled"] as (TaskStatus | "all")[]).map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s)} 
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Add Form (Optional Visibility) */}
        {showForm && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
            <h3 className="font-bold text-foreground text-base">เพิ่มงานใหม่</h3>
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
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">ชื่องาน</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="ชื่อแผนงาน..." />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">รายละเอียด</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">ความสำคัญ</label>
              <div className="flex gap-2">
                {(["high","medium","low"] as Task["priority"][]).map(p => (
                  <button key={p} onClick={() => set("priority", p)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.priority === p ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-background border border-border rounded-xl py-3 text-muted-foreground font-bold hover:bg-muted/50 transition-colors">ยกเลิก</button>
              <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95">บันทึกแผนงาน</button>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-full transition-all"><ChevronLeft size={20} /></button>
            <span className="font-bold text-foreground text-lg">{MONTHS_TH[calMonth]} {calYear + 543}</span>
            <button onClick={nextMonth} className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-full transition-all"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-bold text-muted-foreground/60 py-1 uppercase tracking-tighter">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const hasTasks = !!tasksByDate[dateStr]?.length
              const isToday = dateStr === today.toISOString().split("T")[0]
              const isSelected = dateStr === selectedDate
              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(dateStr)} 
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 z-10" : isToday ? "bg-accent/40 text-foreground ring-1 ring-accent" : "text-foreground hover:bg-background hover:shadow-sm"}`}
                >
                  {day}
                  {hasTasks && <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary shadow-sm"}`} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pending Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" /> งานที่ยังไม่ได้ทำ
              {pendingTasks.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">{pendingTasks.length}</span>}
            </p>
          </div>
          
          {pendingTasks.length === 0 ? (
            <div className="bg-muted/10 border border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">ไม่มีงานที่รอดำเนินการ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(t => (
                <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
              ))}
            </div>
          )}
        </div>

        {/* Completed/Cancelled Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Check size={16} /> งานที่ทำแล้ว / ยกเลิก
              <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">{completedTasks.length}</span>
            </p>
            <div className="space-y-2">
              {completedTasks.map(t => (
                <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskCard({ task, plotName, updateTask, deleteTask }: { task: Task; plotName: string; updateTask: (id: string, c: Partial<Task>) => void; deleteTask: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: task.title, description: task.description })

  const priorityDot = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-400" }
  const priorityBg  = { high: "bg-red-50 border-red-100", medium: "bg-amber-50 border-amber-100", low: "bg-emerald-50 border-emerald-100" }
  const isDone = task.status === "done"
  const isCancelled = task.status === "cancelled"

  const handleSaveEdit = () => {
    updateTask(task.id, editForm)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="space-y-2">
          <input 
            value={editForm.title} 
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="ชื่อแผนงาน..."
          />
          <textarea 
            value={editForm.description} 
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="รายละเอียด..."
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-xs font-bold border border-border rounded-xl hover:bg-muted/50 transition-colors">ยกเลิก</button>
          <button onClick={handleSaveEdit} className="flex-1 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-sm hover:opacity-90">บันทึก</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-3.5 transition-all ${isDone || isCancelled ? "bg-muted/20 border-border/50" : priorityBg[task.priority]}`}>
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <span className={`mt-1.5 shrink-0 block w-2.5 h-2.5 rounded-full ${isDone ? "bg-emerald-400" : isCancelled ? "bg-muted-foreground/30" : priorityDot[task.priority]}`} />

        {/* Text Area */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-snug text-foreground ${isDone || isCancelled ? "line-through" : ""}`}>
            {task.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{plotName} · {new Date(task.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Actions Area */}
        <div className="shrink-0 flex items-center gap-1">
          {task.status === "pending" ? (
            <>
              <button
                onClick={() => updateTask(task.id, { status: "done" })}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <Check size={12} /> เสร็จแล้ว
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-muted-foreground/60 hover:text-primary rounded-lg hover:bg-white/80 transition-all"
                title="แก้ไข"
              >
                <Pencil size={14} />
              </button>
            </>
          ) : (
            <>
              <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-bold ${isDone ? "bg-emerald-100 text-emerald-700" : "bg-muted/60 text-muted-foreground"}`}>
                {isDone ? <Check size={11} /> : <X size={11} />}
                {STATUS_LABELS[task.status]}
              </span>
              <button
                onClick={() => updateTask(task.id, { status: "pending" })}
                className="p-1.5 text-muted-foreground/60 hover:text-primary rounded-lg hover:bg-white/80 transition-all"
                title="ย้อนกลับ"
              >
                <RotateCcw size={13} />
              </button>
            </>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all ml-1"
            title="ลบ"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
