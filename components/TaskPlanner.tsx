"use client"
import { useState, useMemo, useEffect, useRef } from "react"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { downloadTaskCalendarFile, downloadTasksCalendarFile, getGoogleCalendarUrl } from "@/lib/calendar"
import { Task, TaskStatus, useAppData } from "@/lib/store"
import { validateDate, validateNumber, validateText } from "@/lib/form-validation"
import { Plus, Check, X, Trash2, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, Pencil, ChevronDown, ChevronUp, CalendarPlus, Download, Sparkles, AlertTriangle } from "lucide-react"
import Portal from "./Portal"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles" | "admin") => void
}

const PRIORITY_COLORS = {
  high: "border-l-rose-500 bg-white dark:bg-[#14291E] dark:border-l-rose-500",
  medium: "border-l-amber-400 bg-white dark:bg-[#14291E] dark:border-l-amber-400",
  low: "border-l-emerald-500 bg-white dark:bg-[#14291E] dark:border-l-emerald-500",
}
const PRIORITY_LABELS = { high: "ด่วนสุด", medium: "ทั่วไป", low: "รอง" }
const PRIORITY_OPTION_STYLES: Record<Task["priority"], { active: string; inactive: string }> = {
  high: {
    active: "bg-rose-600 text-white border-rose-600 shadow-[0_8px_18px_rgba(225,29,72,0.28)] dark:bg-rose-500 dark:border-rose-500 dark:text-rose-950 dark:shadow-[0_8px_18px_rgba(239,68,68,0.25)]",
    inactive: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-800/40",
  },
  medium: {
    active: "bg-amber-500 text-white border-amber-500 shadow-[0_8px_18px_rgba(245,158,11,0.28)] dark:bg-amber-400 dark:border-amber-400 dark:text-amber-950 dark:shadow-[0_8px_18px_rgba(251,191,36,0.25)]",
    inactive: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-800/40",
  },
  low: {
    active: "bg-emerald-600 text-white border-emerald-600 shadow-[0_8px_18px_rgba(5,150,105,0.28)] dark:bg-emerald-500 dark:border-emerald-500 dark:text-emerald-950 dark:shadow-[0_8px_18px_rgba(16,185,129,0.25)]",
    inactive: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-800/40",
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

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function TaskPlanner({ data, addTask, updateTask, deleteTask, onNavigate }: Props) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(today))
  const [showForm, setShowForm] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatEveryDays, setRepeatEveryDays] = useState(2)
  const [repeatLimitEnabled, setRepeatLimitEnabled] = useState(false)
  const [repeatLimitMonths, setRepeatLimitMonths] = useState(3)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [isExpanded, setIsExpanded] = useState(false)
  const hasPlots = data.plots.length > 0

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

  const tasksOnSelectedDate = useMemo(() => 
    data.tasks.filter(t => t.date.split("T")[0] === selectedDate),
    [data.tasks, selectedDate]
  )
  
  const completedTasksOnSelectedDateCount = useMemo(() => 
    tasksOnSelectedDate.filter(t => t.status === "done").length,
    [tasksOnSelectedDate]
  )

  const progressPercent = useMemo(() => {
    if (tasksOnSelectedDate.length === 0) return 0
    return Math.round((completedTasksOnSelectedDateCount / tasksOnSelectedDate.length) * 100)
  }, [tasksOnSelectedDate, completedTasksOnSelectedDateCount])

  return (
    <div className="min-w-0 space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-[#72C08A]/10 text-primary dark:text-[#72C08A]">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground -mb-0.5">วางแผนงานสวน</h2>
            <p className="text-[10px] font-bold text-muted-foreground">จัดการแผนและขั้นตอนการปฏิบัติงานเกษตร</p>
          </div>
        </div>
        {hasPlots && (
          <button
            onClick={() => {
              setForm(f => ({ ...f, date: selectedDate, plotId: data.plots[0]?.id ?? "", title: "", description: "", priority: "medium" }))
              setRepeatEnabled(false)
              setRepeatEveryDays(2)
              setRepeatLimitEnabled(false)
              setRepeatLimitMonths(3)
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10"
          >
            <Plus size={14} /> เพิ่มแผนงาน
          </button>
        )}
      </div>

      {!hasPlots ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 p-8 shadow-sm backdrop-blur-sm flex flex-col items-center gap-4 text-center max-w-xl mx-auto mt-8 orchard-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-rose-900 dark:text-rose-300">ต้องการข้อมูลแปลงทุเรียน</h3>
            <p className="text-sm font-semibold text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
              ไม่พบข้อมูลแปลงทุเรียนในระบบของคุณ เพื่อเริ่มต้นใช้งานฟังก์ชันวางแผนงานเกษตร กรุณาเพิ่มข้อมูลแปลงทุเรียนก่อน
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              คุณสามารถเพิ่มแปลงใหม่ได้ที่เมนู <span className="font-extrabold text-primary dark:text-[#72C08A]">&quot;จัดการแปลง&quot;</span>
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("plots")}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-[#72C08A] px-5 py-2.5 text-xs font-black text-white dark:text-[#0B1B12] shadow-md hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] active:scale-95 transition-all"
              >
                จัดการแปลง
              </button>
            )}
          </div>
        </div>
      ) : (
        <>

      {/* Progress Card */}
      {tasksOnSelectedDate.length > 0 && (
        <div className="rounded-2xl border border-white/60 dark:border-[#31533D]/60 bg-white dark:bg-[#14291E] p-5 shadow-sm transition-all duration-300 orchard-card">
          <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                ความคืบหน้าของงานวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                เสร็จสิ้น {completedTasksOnSelectedDateCount} จาก {tasksOnSelectedDate.length} รายการ
              </p>
            </div>
            <span className="text-sm font-black text-[#146B3E] dark:text-[#72C08A]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted dark:bg-[#0B140F]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#146B3E] dark:from-emerald-400 dark:to-[#72C08A] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:scrollbar-hide">
        {(["all", "pending", "done", "cancelled"] as (TaskStatus | "all")[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)] dark:bg-[#72C08A] dark:text-[#0B1B12] dark:border-[#72C08A] dark:shadow-[0_8px_18px_rgba(114,192,138,0.15)]"
                : "border-[#B9DCC8] dark:border-[#31533D] bg-white dark:bg-[#14291E] text-primary dark:text-[#72C08A] hover:border-primary/50 dark:hover:border-[#72C08A]/50"
            }`}
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Calendar Card (Mobile/Tablet only) */}
      <div className="lg:hidden bg-white dark:bg-[#14291E] rounded-2xl p-4 border border-[#B9DCC8] dark:border-[#31533D]/60 shadow-[0_4px_20px_rgba(20,107,62,0.04)] orchard-card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] rounded-xl transition-all"><ChevronLeft size={18} /></button>
            <span className="font-extrabold text-foreground text-base sm:text-lg">{MONTHS_TH[calMonth]} {calYear + 543}</span>
            <button onClick={nextMonth} className="p-2 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#B9DCC8] dark:border-[#31533D] bg-[#F7FAF8] dark:bg-[#0B140F] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] text-[#146B3E] dark:text-[#72C08A] hover:text-primary dark:hover:text-[#72C08A] text-xs font-black transition-all"
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
              {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-black text-[#527060] dark:text-[#B8D1C0] py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const hasTasks = !!tasksByDate[dateStr]?.length
                const isToday = dateStr === getLocalDateString(today)
                const isSelected = dateStr === selectedDate
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDate(dateStr); setIsExpanded(false); }}
                    className={`relative h-10 sm:h-11 flex flex-col items-center justify-center rounded-xl text-sm font-extrabold transition-all hover:scale-105 ${
                      isSelected
                        ? "bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] shadow-md shadow-primary/20 dark:shadow-[#72C08A]/20"
                        : isToday
                        ? "bg-primary/10 dark:bg-[#72C08A]/10 text-primary dark:text-[#72C08A] font-bold ring-1 ring-primary dark:ring-[#72C08A]"
                        : hasTasks
                        ? "text-foreground bg-[#E7F3EC] dark:bg-[#1D3A29] hover:bg-[#D8EEE2] dark:hover:bg-[#254A35]"
                        : "text-[#527060] dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] hover:text-foreground"
                    }`}
                  >
                    {day}
                    {hasTasks && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground dark:bg-[#0B1B12]" : "bg-primary dark:bg-[#72C08A]"}`} />
                    )}
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
              const isToday = dateStr === getLocalDateString(today)
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
                  className={`shrink-0 w-11 sm:w-12 h-15 sm:h-16 flex flex-col items-center justify-between py-1.5 px-1 rounded-xl text-center transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] shadow-md shadow-primary/20 dark:shadow-[#72C08A]/20 font-bold"
                      : isToday
                      ? "bg-primary/10 dark:bg-[#72C08A]/10 text-primary dark:text-[#72C08A] font-bold ring-1 ring-primary dark:ring-[#72C08A]"
                      : hasTasks
                      ? "bg-[#E7F3EC] dark:bg-[#1D3A29] text-foreground hover:bg-[#D8EEE2] dark:hover:bg-[#254A35]"
                      : "bg-[#F7FAF8] dark:bg-[#0B140F] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] text-[#527060] dark:text-[#B8D1C0]"
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-80 pointer-events-none">{dayOfWeekName}</span>
                  <span className="text-base font-extrabold pointer-events-none">{day}</span>
                  <div className="h-1 flex items-center justify-center pointer-events-none">
                    {hasTasks && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground dark:bg-[#0B1B12]" : "bg-primary dark:bg-[#72C08A]"}`} />
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
          <div className="hidden lg:block bg-white dark:bg-[#14291E] rounded-2xl p-4 border border-[#B9DCC8] dark:border-[#31533D]/60 shadow-[0_4px_20px_rgba(20,107,62,0.04)] orchard-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <span className="font-extrabold text-foreground text-lg">{MONTHS_TH[calMonth]} {calYear + 543}</span>
                <button onClick={nextMonth} className="p-2 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] rounded-xl transition-all"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_TH.map(d => <div key={d} className="text-center text-xs font-black text-[#527060] dark:text-[#B8D1C0] py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const hasTasks = !!tasksByDate[dateStr]?.length
                  const isToday = dateStr === getLocalDateString(today)
                  const isSelected = dateStr === selectedDate
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-sm font-extrabold transition-all hover:scale-105 ${
                        isSelected
                          ? "bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] shadow-md shadow-primary/20 dark:shadow-[#72C08A]/20"
                          : isToday
                          ? "bg-primary/10 dark:bg-[#72C08A]/10 text-primary dark:text-[#72C08A] font-bold ring-1 ring-primary dark:ring-[#72C08A]"
                          : hasTasks
                          ? "text-foreground bg-[#E7F3EC] dark:bg-[#1D3A29] hover:bg-[#D8EEE2] dark:hover:bg-[#254A35]"
                          : "text-[#527060] dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] hover:text-foreground"
                      }`}
                    >
                      {day}
                      {hasTasks && (
                        <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground dark:bg-[#0B1B12]" : "bg-primary dark:bg-[#72C08A]"}`} />
                      )}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-foreground flex items-center gap-2 text-sm">
                <CalendarDays size={16} className="text-primary dark:text-[#72C08A]" />
                งานวันที่ {new Date(selectedDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
                <span className="text-[10px] font-bold text-muted-foreground">({allFilteredTasks.length} รายการ)</span>
              </h3>
              {allFilteredTasks.length > 0 && (
                <button
                  onClick={() => downloadTasksCalendarFile(allFilteredTasks, plotName, `tasks-${selectedDate}`)}
                  className="hidden shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#B9DCC8] dark:border-[#31533D] text-[10px] font-black text-primary dark:text-[#72C08A] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-all active:scale-[0.98] sm:inline-flex"
                >
                  <Download size={13} />
                  ลงทุกงาน
                </button>
              )}
            </div>

            {pendingTasks.length === 0 ? (
              <div className="bg-white dark:bg-[#14291E] border-2 border-dashed border-[#B9DCC8] dark:border-[#31533D] rounded-2xl p-8 text-center shadow-sm">
                <CalendarDays size={28} className="text-[#527060] dark:text-[#B8D1C0]/60 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-[#527060] dark:text-[#B8D1C0]">ไม่มีงานที่รอดำเนินการ</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">กดปุ่มเพิ่มแผนงานด้านบน เพื่อบันทึกงานใหม่</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(t => (
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} plots={data.plots} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
              </div>
            )}
          </div>

          {/* Completed/Cancelled Section */}
          {completedTasks.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-[#527060] dark:text-[#B8D1C0] flex items-center gap-2">
                <Check size={14} className="text-emerald-500" /> งานที่เสร็จแล้ว
                <span className="bg-[#E7F3EC] dark:bg-[#1D3A29] text-[#146B3E] dark:text-[#72C08A] text-[10px] font-black px-2 py-0.5 rounded-full">{completedTasks.length}</span>
              </h3>
              <div className="space-y-3">
                {completedTasks.map(t => (
                  <TaskCard key={t.id} task={t} plotName={plotName(t.plotId)} plots={data.plots} updateTask={updateTask} deleteTask={deleteTask} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {showForm && (
        <Portal>
          <div ref={formModalRef} data-escapable-layer="true" className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-[#14291E] rounded-2xl p-5 border border-[#B9DCC8] dark:border-[#31533D]/60 shadow-2xl space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">เพิ่มแผนงานใหม่</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-1 block">วันที่</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set("date", e.target.value)}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-1 block">แปลง</label>
                <select
                  value={form.plotId}
                  onChange={e => set("plotId", e.target.value)}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                >
                  {data.plots.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block">ชื่อแผนงาน</label>
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="เช่น รดน้ำดึงตาดอก..."
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block">รายละเอียด</label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม..."
                rows={2}
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1.5 block">ความสำคัญ</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as Task["priority"][]).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => set("priority", p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${form.priority === p ? PRIORITY_OPTION_STYLES[p].active : PRIORITY_OPTION_STYLES[p].inactive}`}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#B9DCC8] dark:border-[#31533D] bg-[#F7FAF8] dark:bg-[#0B140F] p-3 space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(e) => setRepeatEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded"
                />
                งานทำซ้ำ (ทำซ้ำอัตโนมัติ)
              </label>
              {repeatEnabled && (
                <div className="space-y-3 pt-1 animate-slide-up">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-[#527060] dark:text-[#B8D1C0]">ทุก</span>
                    <input
                      type="text"
                      value={repeatEveryDays === 0 ? "" : repeatEveryDays}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "")
                        setRepeatEveryDays(val === "" ? 0 : Number(val))
                      }}
                      className="w-16 bg-white dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-lg px-2 py-1 text-xs font-bold text-center text-foreground focus:outline-none"
                    />
                    <span className="text-[#527060] dark:text-[#B8D1C0]">วัน</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#527060] dark:text-[#B8D1C0]">
                    <input
                      type="checkbox"
                      checked={repeatLimitEnabled}
                      onChange={(e) => setRepeatLimitEnabled(e.target.checked)}
                      className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded"
                    />
                    จำกัดระยะเวลา (เดือน)
                  </label>
                  {repeatLimitEnabled && (
                    <div className="flex items-center gap-2 text-xs font-bold animate-slide-up">
                      <span className="text-[#527060] dark:text-[#B8D1C0]">สูงสุด</span>
                      <input
                        type="text"
                        value={repeatLimitMonths === 0 ? "" : repeatLimitMonths}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setRepeatLimitMonths(val === "" ? 0 : Number(val))
                        }}
                        className="w-16 bg-white dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-lg px-2 py-1 text-xs font-bold text-center text-foreground focus:outline-none"
                      />
                      <span className="text-[#527060] dark:text-[#B8D1C0]">เดือน</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
        </Portal>
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

  const priorityBorder = { 
    high: "border-l-rose-500 dark:border-l-rose-500", 
    medium: "border-l-amber-400 dark:border-l-amber-400", 
    low: "border-l-emerald-500 dark:border-l-emerald-500" 
  }
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
      <div className="bg-[#E7F3EC] dark:bg-[#1D3A29]/30 rounded-2xl p-4 space-y-4 border border-[#B9DCC8] dark:border-[#31533D] animate-fade-in-up">
        <h3 className="font-extrabold text-foreground text-xs">แก้ไขรายละเอียดแผนงาน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-muted-foreground mb-1 block">วันที่</label>
            <input
              type="date"
              value={editForm.date}
              onChange={e => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-muted-foreground mb-1 block">แปลง</label>
            <select
              value={editForm.plotId}
              onChange={e => setEditForm({ ...editForm, plotId: e.target.value })}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
            >
              {plots.length > 0 ? plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option value={task.plotId}>{plotName}</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">ชื่องาน</label>
          <input
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
            placeholder="ชื่องาน..."
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">รายละเอียด</label>
          <textarea
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none resize-none"
            placeholder="รายละเอียด..."
            rows={2}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1.5 block">ความสำคัญ</label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Task["priority"][]).map(p => (
              <button
                key={p}
                onClick={() => setEditForm({ ...editForm, priority: p })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black border transition-all ${editForm.priority === p ? PRIORITY_OPTION_STYLES[p].active : PRIORITY_OPTION_STYLES[p].inactive}`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]">ยกเลิก</button>
          <button onClick={handleSaveEdit} className="flex-1 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98]">บันทึก</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-[#14291E] rounded-2xl border border-[#B9DCC8] dark:border-[#31533D]/60 border-l-4 p-4 transition-all hover:shadow-[0_10px_24px_rgba(20,107,62,0.06)] dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.15)] ${
      isDone || isCancelled 
        ? "border-l-[#B9DCC8] dark:border-l-[#31533D] opacity-75" 
        : priorityBorder[task.priority]
    }`}>
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Checkbox button */}
          <button
            onClick={() => updateTask(task.id, { status: isDone ? "pending" : "done" })}
            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all hover:scale-110 active:scale-95 ${
              isDone
                ? "bg-primary border-primary text-primary-foreground dark:bg-[#72C08A] dark:border-[#72C08A] dark:text-[#0B1B12]"
                : "border-[#B9DCC8] dark:border-[#31533D] bg-white dark:bg-[#0B140F] hover:border-primary/50 dark:hover:border-[#72C08A]/50"
            }`}
            title={isDone ? "ทำเครื่องหมายเป็นรอดำเนินการ" : "ทำเครื่องหมายเป็นเสร็จสิ้น"}
          >
            {isDone && <Check size={12} strokeWidth={3} />}
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-extrabold text-foreground ${isDone || isCancelled ? "line-through text-[#527060] dark:text-[#B8D1C0] opacity-80" : ""}`}>
                {task.title}
              </span>
              <span className={`shrink-0 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                task.priority === "high"
                  ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30"
                  : task.priority === "medium"
                    ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30"
              }`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              {isCancelled && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-[#527060] dark:text-[#B8D1C0]">
                  <X size={10} /> ยกเลิก
                </span>
              )}
            </div>
            
            <p className="text-[10px] text-[#527060] dark:text-[#B8D1C0] mt-1 font-bold">
              {plotName} · {new Date(task.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
            </p>
            
            {task.description && (
              <p className="text-xs text-[#527060] dark:text-[#B8D1C0]/85 mt-2 leading-relaxed break-words">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="เพิ่มลง Google Calendar"
            className="p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] rounded-lg hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors"
          >
            <CalendarPlus size={14} />
          </a>
          <button
            onClick={() => downloadTaskCalendarFile(task, plotName)}
            title="ดาวน์โหลดไฟล์ปฏิทินสำหรับ iPhone/Android"
            className="hidden p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] rounded-lg hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors sm:block"
          >
            <Download size={14} />
          </button>
          
          {isCancelled && (
            <button
              onClick={() => updateTask(task.id, { status: "pending" })}
              title="คืนสถานะเป็นรอดำเนินการ"
              className="p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] rounded-lg hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {!isCancelled && !isDone && (
            <button
              onClick={() => setIsEditing(true)}
              title="แก้ไขงาน"
              className="p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-primary dark:hover:text-[#72C08A] rounded-lg hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
          
          <button
            onClick={() => deleteTask(task.id)}
            title="ลบงาน"
            className="p-1.5 text-[#527060]/50 dark:text-[#B8D1C0]/40 hover:text-destructive dark:hover:text-red-400 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
