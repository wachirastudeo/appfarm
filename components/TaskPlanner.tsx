"use client"
import { useState, useMemo } from "react"
import { Task, TaskStatus, useAppData } from "@/lib/store"
import { Plus, Check, X, Trash2, ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react"

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

  const selectedTasks = useMemo(() =>
    (tasksByDate[selectedDate] ?? []).filter(t => statusFilter === "all" || t.status === statusFilter),
    [tasksByDate, selectedDate, statusFilter])

  const allFilteredTasks = useMemo(() =>
    data.tasks.filter(t => statusFilter === "all" || t.status === statusFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data.tasks, statusFilter])

  const plotName = (id: string) => data.plots.find(p => p.id === id)?.name ?? id

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">แผนการทำงาน</h2>
        <button onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowForm(v => !v) }} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} />{showForm ? "ยกเลิก" : "เพิ่มงาน"}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all","pending","done","cancelled"] as (TaskStatus | "all")[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Left Column: Calendar & Daily Tasks */}
        <div className="space-y-4 w-full">
          {showForm && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-foreground">เพิ่มงานใหม่</h3>
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
                <label className="text-xs text-muted-foreground mb-1 block">ชื่องาน</label>
                <input value={form.title} onChange={e => set("title", e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ชื่องาน..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">รายละเอียด</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="รายละเอียด..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ความสำคัญ</label>
                <div className="flex gap-2">
                  {(["high","medium","low"] as Task["priority"][]).map(p => (
                    <button key={p} onClick={() => set("priority", p)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.priority === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-muted-foreground">ยกเลิก</button>
                <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:opacity-90">บันทึก</button>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1.5 text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-foreground">{MONTHS_TH[calMonth]} {calYear + 543}</span>
              <button onClick={nextMonth} className="p-1.5 text-muted-foreground hover:text-foreground"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS_TH.map(d => <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const hasTasks = !!tasksByDate[dateStr]?.length
                const isToday = dateStr === today.toISOString().split("T")[0]
                const isSelected = dateStr === selectedDate
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)} className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-accent text-foreground" : "text-foreground hover:bg-accent/50"}`}>
                    {day}
                    {hasTasks && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                  </button>
                )
              })}
            </div>
          </div>

      {/* Tasks for selected date */}
      {selectedDate && (
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
            <CalendarDays size={14} />งานวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}
            {selectedTasks.length > 0 && <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">{selectedTasks.length}</span>}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4 bg-card border border-border rounded-xl">ไม่มีงานวันนี้</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />)}
            </div>
          )}
        </div>
      )}

        </div>

        {/* Right Column: All Tasks */}
        <div className="space-y-4 w-full">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">งานทั้งหมด</p>
            {allFilteredTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <CalendarDays size={36} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">ไม่มีงาน</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allFilteredTasks.map(t => <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} updateTask={updateTask} deleteTask={deleteTask} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskCard({ task, plotName, updateTask, deleteTask }: { task: Task; plotName: string; updateTask: (id: string, c: Partial<Task>) => void; deleteTask: (id: string) => void }) {
  return (
    <div className={`bg-card border border-l-4 border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3 group ${PRIORITY_COLORS[task.priority]}`}>
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-sm font-semibold truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{plotName}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(task.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
        </div>
        {task.description && <p className="text-sm text-muted-foreground leading-relaxed break-words">{task.description}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
        {task.status === "pending" ? (
          <>
            <button onClick={() => updateTask(task.id, { status: "done" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <Check size={14} />เสร็จแล้ว
            </button>
            <button onClick={() => updateTask(task.id, { status: "cancelled" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-muted-foreground border border-border rounded-full text-xs font-medium hover:bg-muted hover:text-foreground transition-all duration-200">
              <X size={14} />ยกเลิก
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/50">
            <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${task.status === "done" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted-foreground/20 text-foreground"}`}>
              {task.status === "done" ? <Check size={12} /> : <X size={12} />}
              {STATUS_LABELS[task.status]}
            </span>
            <button onClick={() => updateTask(task.id, { status: "pending" })} className="flex items-center gap-1.5 px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-background rounded-full text-xs font-medium transition-all hover:shadow-sm border border-transparent hover:border-border/50" title="ย้อนกลับเป็นรอดำเนินการ">
              <RotateCcw size={12} />ย้อนกลับ
            </button>
          </div>
        )}
        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
        <button onClick={() => deleteTask(task.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors shrink-0">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
