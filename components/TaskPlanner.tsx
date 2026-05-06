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
  high: "border-l-red-500 bg-card",
  medium: "border-l-amber-500 bg-card",
  low: "border-l-emerald-600 bg-card",
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
    const taskDate = new Date(form.date).toISOString()
    addTask({ ...form, date: taskDate })
    setSelectedDate(form.date) // Switch to the date of the new task
    setForm({ date: form.date, plotId: data.plots[0]?.id ?? "", title: "", description: "", priority: "medium", status: "pending" })
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
      .filter(t => {
        const matchesStatus = statusFilter === "all" || t.status === statusFilter
        const matchesDate = t.date.split("T")[0] === selectedDate
        return matchesStatus && matchesDate
      })
      .sort((a, b) => {
        const order = { pending: 0, done: 1, cancelled: 2 }
        return (order[a.status] - order[b.status]) || new Date(a.date).getTime() - new Date(b.date).getTime()
      }),
    [data.tasks, statusFilter, selectedDate])

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

  const pendingTasks = allFilteredTasks.filter(t => t.status === "pending")
  const completedTasks = allFilteredTasks.filter(t => t.status !== "pending")

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">แผนการทำงาน</h2>
        <button 
          onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(v => !v) }} 
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />{showForm ? "ยกเลิก" : "เพิ่มงาน"}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {(["all","pending","done","cancelled"] as (TaskStatus | "all")[]).map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s)} 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Calendar — compact on desktop */}
        <div className="lg:col-span-2 lg:sticky lg:top-6">
        {/* Add Form (Optional Visibility) */}
        {showForm && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border mb-4">
            <h3 className="font-semibold text-foreground text-sm">เพิ่มงานใหม่</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">วันที่</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">แปลง</label>
                <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">ชื่องาน</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="ชื่อแผนงาน..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">รายละเอียด</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">ความสำคัญ</label>
              <div className="flex gap-2">
                {(["high","medium","low"] as Task["priority"][]).map(p => (
                  <button key={p} onClick={() => set("priority", p)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${form.priority === p ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground font-medium hover:bg-muted/50">ยกเลิก</button>
              <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:opacity-90">บันทึก</button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all"><ChevronLeft size={18} /></button>
            <span className="font-bold text-foreground">{MONTHS_TH[calMonth]} {calYear + 543}</span>
            <button onClick={nextMonth} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
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
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-md" : isToday ? "bg-primary/10 text-primary font-bold ring-1 ring-primary" : hasTasks ? "text-foreground bg-muted hover:bg-muted/80" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {day}
                  {hasTasks && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                </button>
              )
            })}
          </div>
        </div>
        </div>

        {/* Task Lists — right side on desktop */}
        <div className="lg:col-span-3 space-y-6">
        {/* Pending Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" /> 
              งานวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
              <span className="text-xs text-muted-foreground font-normal">({allFilteredTasks.length} รายการ)</span>
            </h3>
          </div>
          
          {pendingTasks.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
              <CalendarDays size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">ไม่มีงานที่รอดำเนินการ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(t => (
                <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
              ))}
            </div>
          )}
        </div>

        {/* Completed/Cancelled Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check size={14} /> งานที่เสร็จแล้ว
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{completedTasks.length}</span>
            </h3>
            <div className="space-y-2">
              {completedTasks.map(t => (
                <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export function TaskCard({ task, plotName, updateTask, deleteTask }: { task: Task; plotName: string; updateTask: (id: string, c: Partial<Task>) => void; deleteTask: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: task.title, description: task.description })

  const priorityDot = { high: "bg-rose-500", medium: "bg-amber-400", low: "bg-emerald-400" }
  const priorityBorder = { high: "border-l-rose-500", medium: "border-l-amber-400", low: "border-l-emerald-400" }
  const isDone = task.status === "done"
  const isCancelled = task.status === "cancelled"

  const handleSaveEdit = () => {
    updateTask(task.id, editForm)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-card border border-primary/30 rounded-xl p-3 space-y-2">
        <input 
          value={editForm.title} 
          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="ชื่อแผนงาน..."
        />
        <textarea 
          value={editForm.description} 
          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="รายละเอียด..."
          rows={2}
        />
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-muted/50">ยกเลิก</button>
          <button onClick={handleSaveEdit} className="flex-1 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90">บันทึก</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card rounded-xl border border-border border-l-4 p-3 transition-all hover:shadow-sm ${isDone || isCancelled ? "border-l-muted-foreground/30 opacity-60" : priorityBorder[task.priority]}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 shrink-0 block w-2 h-2 rounded-full ${isDone ? "bg-emerald-400" : isCancelled ? "bg-muted-foreground/30" : priorityDot[task.priority]}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-foreground ${isDone || isCancelled ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{plotName} · {new Date(task.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{task.description}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {task.status === "pending" ? (
            <>
              <button
                onClick={() => updateTask(task.id, { status: "done" })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Check size={12} /> เสร็จ
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
              >
                <Pencil size={14} />
              </button>
            </>
          ) : (
            <>
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${isDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {isDone ? <Check size={12} /> : <X size={12} />}
                {STATUS_LABELS[task.status]}
              </span>
              <button
                onClick={() => updateTask(task.id, { status: "pending" })}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
