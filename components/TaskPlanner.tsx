"use client"
import { useState, useMemo, useEffect, useRef } from "react"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { downloadTaskCalendarFile, downloadTasksCalendarFile, getGoogleCalendarUrl } from "@/lib/calendar"
import { Task, TaskStatus, useAppData } from "@/lib/store"
import { validateDate, validateNumber, validateText } from "@/lib/form-validation"
import { Plus, Check, X, Trash2, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, Pencil, ChevronDown, ChevronUp, CalendarPlus, Download } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
}

const PRIORITY_COLORS = {
  high: "border-l-red-500 bg-white",
  medium: "border-l-amber-500 bg-white",
  low: "border-l-emerald-600 bg-white",
}
const PRIORITY_LABELS = { high: "ด่วน", medium: "ปกติ", low: "ต่ำ" }
const PRIORITY_OPTION_STYLES: Record<Task["priority"], { active: string; inactive: string }> = {
  high: {
    active: "bg-rose-600 text-white border-rose-600 shadow-[0_8px_18px_rgba(225,29,72,0.28)]",
    inactive: "bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300",
  },
  medium: {
    active: "bg-amber-500 text-white border-amber-500 shadow-[0_8px_18px_rgba(245,158,11,0.28)]",
    inactive: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300",
  },
  low: {
    active: "bg-emerald-600 text-white border-emerald-600 shadow-[0_8px_18px_rgba(5,150,105,0.28)]",
    inactive: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300",
  },
}
const STATUS_LABELS: Record<TaskStatus, string> = { pending: "รอดำเนินการ", done: "เสร็จแล้ว", cancelled: "ยกเลิก" }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

export default function TaskPlanner({ data, addTask, updateTask, deleteTask }: Props) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split("T")[0])
  const [showForm, setShowForm] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatEveryDays, setRepeatEveryDays] = useState(2)
  const [repeatLimitEnabled, setRepeatLimitEnabled] = useState(false)
  const [repeatLimitMonths, setRepeatLimitMonths] = useState(3)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [isExpanded, setIsExpanded] = useState(false)

  const activeRef = useRef<HTMLButtonElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const [dragged, setDragged] = useState(false)
  const formModalRef = useRef<HTMLDivElement | null>(null)

  useEscapeToClose({ enabled: showForm, onEscape: () => setShowForm(false), containerRef: formModalRef })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    setDragged(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    startX.current = e.touches[0].pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    setDragged(false)
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  const handleMouseUp = () => {
    setTimeout(() => {
      isDragging.current = false
    }, 50)
  }

  const handleTouchEnd = () => {
    setTimeout(() => {
      isDragging.current = false
    }, 50)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(x - startX.current) > 5) {
      setDragged(true)
    }
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(x - startX.current) > 5) {
      setDragged(true)
    }
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  useEffect(() => {
    if (!isExpanded && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [selectedDate, isExpanded, calMonth, calYear])

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
    const title = validateText("ชื่อแผนงาน", form.title, { required: true, maxLength: 160 })
    const description = validateText("รายละเอียด", form.description, { maxLength: 500, allowMultiline: true })
    const date = validateDate("วันที่", form.date)
    const interval = validateNumber("จำนวนวันทำซ้ำ", repeatEveryDays, { min: 1, max: 365, integer: true })
    const monthLimit = validateNumber("จำนวนเดือนที่ทำซ้ำ", repeatLimitMonths, { min: 1, max: 24, integer: true })
    if (!form.plotId) {
      alert("กรุณาเลือกแปลงก่อนบันทึก")
      return
    }
    const invalid = [title, description, date, ...(repeatEnabled ? [interval] : []), ...(repeatEnabled && repeatLimitEnabled ? [monthLimit] : [])].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      alert(invalid.message)
      return
    }
    const intervalDays = interval.value
    const monthsLimit = monthLimit.value
    const startDate = new Date(`${date.value}T00:00:00`)
    const maxDate = repeatEnabled && repeatLimitEnabled
      ? new Date(startDate.getFullYear(), startDate.getMonth() + monthsLimit, startDate.getDate())
      : null

    const datesToCreate: Date[] = []
    if (!repeatEnabled) {
      datesToCreate.push(startDate)
    } else {
      let cursor = new Date(startDate)
      while (!maxDate || cursor <= maxDate) {
        datesToCreate.push(new Date(cursor))
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + intervalDays)
      }
    }

    datesToCreate.forEach((d) => {
      addTask({ ...form, title: title.value, description: description.value, date: d.toISOString() })
    })

    setSelectedDate(form.date) // Switch to the date of the new task
    setForm({ date: form.date, plotId: data.plots[0]?.id ?? "", title: "", description: "", priority: "medium", status: "pending" })
    setRepeatEnabled(false)
    setRepeatEveryDays(2)
    setRepeatLimitEnabled(false)
    setRepeatLimitMonths(3)
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
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">แผนการทำงาน</h2>
        <button
          onClick={() => {
            setForm(f => ({ ...f, date: selectedDate, plotId: data.plots[0]?.id ?? "", title: "", description: "", priority: "medium" }))
            setRepeatEnabled(false)
            setRepeatEveryDays(2)
            setRepeatLimitEnabled(false)
            setRepeatLimitMonths(3)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0F5A34] transition-opacity shadow-[0_10px_24px_rgba(20,107,62,0.10)]"
        >
          <Plus size={16} /> เพิ่มแผนงาน
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:scrollbar-hide">
        {(["all", "pending", "done", "cancelled"] as (TaskStatus | "all")[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${statusFilter === s ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "border-[#B9DCC8] bg-white text-[#146B3E] hover:border-primary/50"}`}
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Calendar Card (Mobile/Tablet only) */}
      <div className="lg:hidden bg-white rounded-2xl p-4 border border-[#B9DCC8] shadow-[0_4px_20px_rgba(20,107,62,0.04)]">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 text-[#527060] hover:text-primary hover:bg-[#E7F3EC] rounded-xl transition-all"><ChevronLeft size={18} /></button>
            <span className="font-extrabold text-foreground text-base sm:text-lg">{MONTHS_TH[calMonth]} {calYear + 543}</span>
            <button onClick={nextMonth} className="p-2 text-[#527060] hover:text-primary hover:bg-[#E7F3EC] rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#B9DCC8] bg-[#F7FAF8] hover:bg-[#E7F3EC] text-[#146B3E] hover:text-primary text-xs font-black transition-all"
          >
            <CalendarDays size={14} />
            {isExpanded ? "ย่อปฏิทิน" : "ดูรายเดือน"}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isExpanded ? (
          /* Full Month Grid Calendar View */
          <div className="mt-4 transition-all">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-black text-[#527060] py-1">{d}</div>)}
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
                    onClick={() => { setSelectedDate(dateStr); setIsExpanded(false); }}
                    className={`relative h-10 sm:h-11 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-md animate-pulse" : isToday ? "bg-primary/10 text-primary font-bold ring-1 ring-primary" : hasTasks ? "text-foreground bg-[#E7F3EC] hover:bg-[#D8EEE2]" : "text-[#527060] hover:bg-[#E7F3EC] hover:text-foreground"}`}
                  >
                    {day}
                    {hasTasks && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Compact Hotel-Booking style horizontal scrolling strip */
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="flex gap-2 overflow-x-auto py-2 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          >
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const hasTasks = !!tasksByDate[dateStr]?.length
              const isToday = dateStr === today.toISOString().split("T")[0]
              const isSelected = dateStr === selectedDate
              const dayOfWeekIndex = new Date(calYear, calMonth, day).getDay()
              const dayOfWeekName = DAYS_TH[dayOfWeekIndex]
              return (
                <button
                  key={day}
                  ref={isSelected ? activeRef : null}
                  onClick={() => {
                    if (!dragged) {
                      setSelectedDate(dateStr)
                    }
                  }}
                  className={`shrink-0 w-11 sm:w-12 h-15 sm:h-16 flex flex-col items-center justify-between py-1.5 px-1 rounded-xl text-center transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 font-bold"
                      : isToday
                      ? "bg-primary/10 text-primary font-bold ring-1 ring-primary"
                      : hasTasks
                      ? "bg-[#E7F3EC] text-foreground hover:bg-[#D8EEE2]"
                      : "bg-[#F7FAF8] hover:bg-[#E7F3EC] text-[#527060]"
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-80 pointer-events-none">{dayOfWeekName}</span>
                  <span className="text-base font-extrabold pointer-events-none">{day}</span>
                  <div className="h-1 flex items-center justify-center pointer-events-none">
                    {hasTasks && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground animate-ping" : "bg-primary"}`} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Side: Desktop Calendar & Add Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Desktop Calendar Card (hidden lg:block, always expanded month view) */}
          <div className="hidden lg:block bg-white rounded-2xl p-4 border border-[#B9DCC8] shadow-[0_4px_20px_rgba(20,107,62,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 text-[#527060] hover:text-primary hover:bg-[#E7F3EC] rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <span className="font-extrabold text-foreground text-lg">{MONTHS_TH[calMonth]} {calYear + 543}</span>
                <button onClick={nextMonth} className="p-2 text-[#527060] hover:text-primary hover:bg-[#E7F3EC] rounded-xl transition-all"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-black text-[#527060] py-1">{d}</div>)}
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
                      className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-md" : isToday ? "bg-primary/10 text-primary font-bold ring-1 ring-primary" : hasTasks ? "text-foreground bg-[#E7F3EC] hover:bg-[#D8EEE2]" : "text-[#527060] hover:bg-[#E7F3EC] hover:text-foreground"}`}
                    >
                      {day}
                      {hasTasks && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Task Lists */}
        <div className="lg:col-span-3 min-w-0 space-y-6">
          {/* Pending Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex flex-wrap items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                งานวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
                <span className="text-xs text-[#527060] font-normal">({allFilteredTasks.length} รายการ)</span>
              </h3>
              {allFilteredTasks.length > 0 && (
                <button
                  onClick={() => downloadTasksCalendarFile(allFilteredTasks, plotName, `tasks-${selectedDate}`)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B9DCC8] text-xs font-semibold text-[#146B3E] hover:bg-[#E7F3EC] transition-colors"
                >
                  <Download size={13} />
                  ลงทุกงาน
                </button>
              )}
            </div>

            {pendingTasks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#B9DCC8] rounded-2xl p-6 text-center">
                <CalendarDays size={24} className="text-[#527060] mx-auto mb-2" />
                <p className="text-[#527060] text-sm">ไม่มีงานที่รอดำเนินการ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map(t => (
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} plots={data.plots} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
              </div>
            )}
          </div>

          {/* Completed/Cancelled Section */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-[#527060] flex items-center gap-2">
                <Check size={14} /> งานที่เสร็จแล้ว
                <span className="bg-[#E7F3EC] text-[#527060] text-xs px-2 py-0.5 rounded-full">{completedTasks.length}</span>
              </h3>
              <div className="space-y-2">
                {completedTasks.map(t => (
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} plots={data.plots} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div ref={formModalRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl p-4 border border-[#B9DCC8] shadow-[0_20px_60px_rgba(20,107,62,0.18)] space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-foreground">เพิ่มแผนงาน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#527060] mb-1 block">วันที่</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set("date", e.target.value)}
                  className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#527060] mb-1 block">แปลง</label>
                <select
                  value={form.plotId}
                  onChange={e => set("plotId", e.target.value)}
                  className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {data.plots.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#527060] mb-1 block">ชื่อแผนงาน</label>
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="ชื่อแผนงาน..."
                className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#527060] mb-1 block">รายละเอียด</label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="รายละเอียด..."
                rows={2}
                className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-[#527060] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#527060] mb-1 block">ความสำคัญ</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as Task["priority"][]).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => set("priority", p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-black border transition-all ${form.priority === p ? PRIORITY_OPTION_STYLES[p].active : PRIORITY_OPTION_STYLES[p].inactive}`}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#B9DCC8] bg-[#F7FAF8] p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#146B3E]">
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(e) => setRepeatEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#146B3E]"
                />
                งานทำซ้ำ
              </label>
              {repeatEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#527060]">ทุก</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={repeatEveryDays}
                      onChange={(e) => setRepeatEveryDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 bg-white border border-[#B9DCC8] rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-[#527060]">วัน</span>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#527060]">
                    <input
                      type="checkbox"
                      checked={repeatLimitEnabled}
                      onChange={(e) => setRepeatLimitEnabled(e.target.checked)}
                      className="h-4 w-4 accent-[#146B3E]"
                    />
                    จำกัดระยะเวลา (เดือน)
                  </label>
                  {repeatLimitEnabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#527060]">สูงสุด</span>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={repeatLimitMonths}
                        onChange={(e) => setRepeatLimitMonths(Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 bg-white border border-[#B9DCC8] rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-[#527060]">เดือน</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-[#B9DCC8] rounded-lg py-2 text-sm text-[#527060] font-medium hover:bg-[#E7F3EC]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!form.title.trim() || !form.plotId}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-[#0F5A34] disabled:opacity-40"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TaskCard({ task, plotName, plots = [], updateTask, deleteTask }: {
  task: Task
  plotName: string
  plots?: { id: string; name: string }[]
  updateTask: (id: string, c: Partial<Task>) => void
  deleteTask: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    date: task.date.split("T")[0],
    plotId: task.plotId,
    title: task.title,
    description: task.description,
    priority: task.priority,
  })

  const priorityDot = { high: "bg-rose-500", medium: "bg-amber-400", low: "bg-emerald-500" }
  const priorityBorder = { high: "border-l-rose-500", medium: "border-l-amber-400", low: "border-l-emerald-400" }
  const isDone = task.status === "done"
  const isCancelled = task.status === "cancelled"
  const googleCalendarUrl = getGoogleCalendarUrl(task, plotName)

  const handleSaveEdit = () => {
    const title = validateText("ชื่องาน", editForm.title, { required: true, maxLength: 160 })
    const description = validateText("รายละเอียด", editForm.description, { maxLength: 500, allowMultiline: true })
    const date = validateDate("วันที่", editForm.date)
    if (!editForm.plotId) {
      alert("กรุณาเลือกแปลงก่อนบันทึก")
      return
    }
    const invalid = [title, description, date].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      alert(invalid.message)
      return
    }
    updateTask(task.id, { ...editForm, title: title.value, description: description.value, date: new Date(date.value).toISOString() })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-[#E7F3EC] rounded-xl p-4 space-y-3 border border-[#B9DCC8]">
        <h3 className="font-semibold text-foreground text-sm">แก้ไขงาน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#527060] mb-1 block">วันที่</label>
            <input
              type="date"
              value={editForm.date}
              onChange={e => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#527060] mb-1 block">แปลง</label>
            <select
              value={editForm.plotId}
              onChange={e => setEditForm({ ...editForm, plotId: e.target.value })}
              className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {plots.length > 0 ? plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option value={task.plotId}>{plotName}</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#527060] mb-1 block">ชื่องาน</label>
          <input
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="ชื่อแผนงาน..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#527060] mb-1 block">รายละเอียด</label>
          <textarea
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full bg-background border border-[#B9DCC8] rounded-lg px-3 py-2 text-sm text-[#527060] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="รายละเอียด..."
            rows={2}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#527060] mb-1 block">ความสำคัญ</label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Task["priority"][]).map(p => (
              <button
                key={p}
                onClick={() => setEditForm({ ...editForm, priority: p })}
                className={`flex-1 py-2 rounded-xl text-sm font-black border transition-all ${editForm.priority === p ? PRIORITY_OPTION_STYLES[p].active : PRIORITY_OPTION_STYLES[p].inactive}`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 border border-[#B9DCC8] rounded-lg py-2 text-sm text-[#527060] font-medium hover:bg-[#E7F3EC]">ยกเลิก</button>
          <button onClick={handleSaveEdit} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-[#0F5A34]">บันทึก</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl border border-[#B9DCC8] border-l-4 p-3 transition-all hover:shadow-[0_10px_24px_rgba(20,107,62,0.10)] ${isDone || isCancelled ? "border-l-[#B9DCC8] opacity-80" : priorityBorder[task.priority]}`}>
      <div className="grid min-w-0 grid-cols-1 gap-2 min-[430px]:grid-cols-[minmax(0,1fr)_auto] min-[430px]:items-center min-[430px]:gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1.5 shrink-0 block w-2.5 h-2.5 rounded-full ${isDone ? "bg-emerald-500" : isCancelled ? "bg-[#B9DCC8]" : priorityDot[task.priority]}`} />
          <div className="min-w-0">
            <p className={`text-sm font-medium text-foreground ${isDone || isCancelled ? "line-through text-[#527060]" : ""}`}>
              {task.title}
            </p>
            <p className="text-xs text-[#527060] mt-0.5">{plotName} · {new Date(task.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}</p>
            {task.description && (
              <p className="text-xs text-[#527060] mt-1 line-clamp-1">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1 min-[430px]:justify-end">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="เพิ่มลง Google Calendar"
            className="p-1.5 text-[#527060] hover:text-primary rounded-lg hover:bg-[#E7F3EC] transition-colors"
          >
            <CalendarPlus size={14} />
          </a>
          <button
            onClick={() => downloadTaskCalendarFile(task, plotName)}
            title="ดาวน์โหลดไฟล์ปฏิทินสำหรับ iPhone/Android"
            className="p-1.5 text-[#527060] hover:text-primary rounded-lg hover:bg-[#E7F3EC] transition-colors"
          >
            <Download size={14} />
          </button>
          {task.status === "pending" ? (
            <>
              <button
                onClick={() => updateTask(task.id, { status: "done" })}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-[#0F5A34] transition-opacity"
              >
                <Check size={12} /> เสร็จ
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-[#527060] hover:text-primary rounded-lg hover:bg-[#E7F3EC] transition-colors"
              >
                <Pencil size={14} />
              </button>
            </>
          ) : (
            <>
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${isDone ? "bg-emerald-100 text-emerald-700" : "bg-[#E7F3EC] text-[#527060]"}`}>
                {isDone ? <Check size={12} /> : <X size={12} />}
                {STATUS_LABELS[task.status]}
              </span>
              <button
                onClick={() => updateTask(task.id, { status: "pending" })}
                className="p-1.5 text-[#527060] hover:text-primary rounded-lg hover:bg-[#E7F3EC] transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 text-[#527060]/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
