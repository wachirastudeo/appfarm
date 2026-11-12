"use client"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Download, ListChecks, MoreHorizontal, Plus, Printer, CalendarPlus } from "lucide-react"
import { Task, useAppData } from "@/lib/store"
import { downloadTasksCalendarFile } from "@/lib/calendar"
import { exportOperationsToCSV } from "@/lib/report-utils"
import { addDaysToKey, DAYS_TH, daysBetween, formatThaiDate, MONTHS_TH, relativeDayLabel, toDateKey, todayKey } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { PrintReportData } from "./PrintReportView"
import TaskFormSheet, { TaskDraft } from "./records/TaskFormSheet"
import ActivityFormSheet, { ActivityDefaults, ActivityDraft } from "./records/ActivityFormSheet"
import { inferActivityType, PRIORITY_META } from "./records/meta"
import { Fab } from "./records/ui"
import { saveActivityWithExpense } from "./ActivityLog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
  addActivity?: AppDataReturn["addActivity"]
  addFinance?: AppDataReturn["addFinance"]
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles" | "admin") => void
  onPrint?: (reportData: Omit<PrintReportData, "farmName" | "userName" | "plots">) => void
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const byDateThenPriority = (a: Task, b: Task) =>
  toDateKey(a.date).localeCompare(toDateKey(b.date)) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]

export default function TaskPlanner({ data, addTask, updateTask, deleteTask, addActivity, addFinance, onNavigate, onPrint }: Props) {
  const today = todayKey()
  const [view, setView] = useState<"list" | "calendar">("list")
  const [createOpen, setCreateOpen] = useState(false)
  const [createDateKey, setCreateDateKey] = useState(today)
  const [showDone, setShowDone] = useState(false)
  const [laterLimit, setLaterLimit] = useState(8)
  const [logDefaults, setLogDefaults] = useState<ActivityDefaults | null>(null)

  const now = new Date()
  const [cal, setCal] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selectedDay, setSelectedDay] = useState(today)

  const plotName = (id: string) => (id ? data.plots.find(p => p.id === id)?.name ?? "แปลงที่ถูกลบ" : "ทั้งสวน")

  const sections = useMemo(() => {
    const pending = data.tasks.filter(t => t.status === "pending").sort(byDateThenPriority)
    const diff = (t: Task) => daysBetween(today, toDateKey(t.date))
    return {
      overdue: pending.filter(t => diff(t) < 0),
      today: pending.filter(t => diff(t) === 0),
      tomorrow: pending.filter(t => diff(t) === 1),
      week: pending.filter(t => diff(t) >= 2 && diff(t) <= 7),
      later: pending.filter(t => diff(t) > 7),
      done: data.tasks
        .filter(t => t.status !== "pending" && daysBetween(toDateKey(t.date), today) <= 14)
        .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date))),
    }
  }, [data.tasks, today])

  const todayAll = data.tasks.filter(t => toDateKey(t.date) === today && t.status !== "cancelled")
  const todayDone = todayAll.filter(t => t.status === "done").length
  const pendingAll = [...sections.overdue, ...sections.today, ...sections.tomorrow, ...sections.week, ...sections.later]

  const handleComplete = (task: Task) => {
    updateTask(task.id, { status: "done" })
    if (!addActivity) {
      toast.success("ทำเสร็จแล้ว")
      return
    }
    toast.success(`เสร็จแล้ว: ${task.title}`, {
      description: "จดลงบันทึกสวนไว้ดูย้อนหลังไหม?",
      duration: 7000,
      action: {
        label: "ลงบันทึก",
        onClick: () => setLogDefaults({
          activityType: inferActivityType(task.title),
          plotId: task.plotId,
          description: [task.title, task.description].filter(Boolean).join(" · "),
          dateKey: todayKey(),
        }),
      },
    })
  }

  const handleCreate = (drafts: TaskDraft[]) => {
    drafts.forEach(addTask)
    toast.success(drafts.length > 1 ? `สร้างงานทำซ้ำ ${drafts.length} ครั้งแล้ว` : "เพิ่มงานแล้ว", {
      description: `${drafts[0].title} · ${relativeDayLabel(drafts[0].date)}`,
    })
  }

  const handleDelete = (task: Task) => {
    deleteTask(task.id)
    toast("ลบงานแล้ว", {
      action: { label: "เลิกทำ", onClick: () => addTask({ title: task.title, description: task.description, date: task.date, plotId: task.plotId, priority: task.priority, status: task.status }) },
    })
  }

  const openCreate = (dateKey = today) => {
    setCreateDateKey(dateKey)
    setCreateOpen(true)
  }

  const cardProps = { plots: data.plots, updateTask, onDelete: handleDelete, onComplete: handleComplete }

  // ---- Calendar data ----
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    data.tasks.forEach(t => {
      const key = toDateKey(t.date)
      ;(map[key] ??= []).push(t)
    })
    return map
  }, [data.tasks])
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate()
  const firstWeekday = new Date(cal.year, cal.month, 1).getDay()
  const moveMonth = (delta: number) => setCal(c => {
    const d = new Date(c.year, c.month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const selectedDayTasks = (tasksByDay[selectedDay] ?? []).slice().sort((a, b) =>
    (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-foreground">วันนี้ <span className="font-bold text-muted-foreground">{formatThaiDate(today, { weekday: true })}</span></h2>
          <p className="text-sm text-muted-foreground">
            {pendingAll.length ? `เหลือ ${pendingAll.length} งานที่ยังไม่ได้ทำ` : "ไม่มีงานค้าง เยี่ยมมาก!"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="ตัวเลือกเพิ่มเติม" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 hover:bg-muted">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem disabled={!pendingAll.length} onSelect={() => downloadTasksCalendarFile(pendingAll, plotName, "durian-tasks")} className="gap-2 py-2.5 font-semibold">
                <CalendarPlus size={16} /> ลงปฏิทินมือถือ (งานค้างทั้งหมด)
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!data.tasks.length} onSelect={() => exportOperationsToCSV(data.tasks, [], id => plotName(id ?? ""))} className="gap-2 py-2.5 font-semibold">
                <Download size={16} /> ส่งออก Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!pendingAll.length}
                onSelect={() => onPrint?.({ type: "operations", title: "รายงานแผนงานสวนที่ยังค้าง", dateRange: `ณ ${formatThaiDate(today, { year: true })}`, tasks: pendingAll, activities: [] })}
                className="gap-2 py-2.5 font-semibold"
              >
                <Printer size={16} /> พิมพ์แผนงาน (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => openCreate()} className="hidden h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary/90 lg:inline-flex">
            <Plus size={18} /> เพิ่มแผนงาน
          </button>
        </div>
      </div>

      {/* Today summary */}
      <section className="grid grid-cols-3 gap-2">
        <SummaryTile label="เลยกำหนด" value={sections.overdue.length} tone={sections.overdue.length ? "danger" : "muted"} />
        <SummaryTile label="วันนี้" value={todayAll.length ? `${todayDone}/${todayAll.length}` : 0} tone="primary" progress={todayAll.length ? todayDone / todayAll.length : undefined} />
        <SummaryTile label="7 วันข้างหน้า" value={sections.tomorrow.length + sections.week.length} tone="muted" />
      </section>

      {/* View switch */}
      <div role="tablist" aria-label="มุมมองแผนงาน" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {([["list", "รายการ", ListChecks], ["calendar", "ปฏิทิน", CalendarDays]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            type="button"
            onClick={() => setView(id)}
            className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-bold transition", view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="space-y-5">
          {pendingAll.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
                <Check size={26} strokeWidth={3} />
              </div>
              <p className="font-bold text-foreground">ไม่มีงานค้าง</p>
              <p className="mt-1 text-sm text-muted-foreground">วางแผนพ่นยา ใส่ปุ๋ย ล่วงหน้า ระบบจะเรียงให้ตามวัน</p>
              <button type="button" onClick={() => openCreate()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground">
                <Plus size={16} /> เพิ่มแผนงาน
              </button>
              {data.plots.length === 0 && onNavigate && (
                <button type="button" onClick={() => onNavigate("plots")} className="mt-2 block w-full text-sm font-bold text-primary">
                  หรือเพิ่มแปลงทุเรียนก่อน →
                </button>
              )}
            </div>
          )}
          <TaskSection title="เลยกำหนด" tone="danger" tasks={sections.overdue} cardProps={cardProps} plotName={plotName} />
          <TaskSection title="วันนี้" hideDate tasks={sections.today} cardProps={cardProps} plotName={plotName} />
          <TaskSection title="พรุ่งนี้" subtitle={formatThaiDate(addDaysToKey(today, 1), { weekday: true })} hideDate tasks={sections.tomorrow} cardProps={cardProps} plotName={plotName} />
          <TaskSection title="ในสัปดาห์นี้" tasks={sections.week} cardProps={cardProps} plotName={plotName} />
          <TaskSection title="ถัดไป" tasks={sections.later.slice(0, laterLimit)} cardProps={cardProps} plotName={plotName}
            footer={sections.later.length > laterLimit && (
              <button type="button" onClick={() => setLaterLimit(l => l + 20)} className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold text-primary hover:bg-muted">
                ดูเพิ่มอีก {Math.min(20, sections.later.length - laterLimit)} งาน
              </button>
            )}
          />

          {sections.done.length > 0 && (
            <section>
              <button type="button" onClick={() => setShowDone(v => !v)} className="flex w-full items-center justify-between px-1 py-2 text-sm font-black text-muted-foreground">
                เสร็จ/ยกเลิก ใน 14 วันที่ผ่านมา ({sections.done.length})
                <ChevronDown size={18} className={cn("transition", showDone && "rotate-180")} />
              </button>
              {showDone && (
                <ul className="space-y-2">
                  {sections.done.map(t => <li key={t.id}><TaskCard task={t} plotName={plotName(t.plotId)} {...cardProps} /></li>)}
                </ul>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="เดือนก่อน" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"><ChevronLeft size={20} /></button>
              <p className="font-black text-foreground">{MONTHS_TH[cal.month]} {cal.year + 543}</p>
              <button type="button" onClick={() => moveMonth(1)} aria-label="เดือนถัดไป" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">
              {DAYS_TH.map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const key = `${cal.year}-${String(cal.month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
                const dayTasks = tasksByDay[key] ?? []
                const pendingCount = dayTasks.filter(t => t.status === "pending").length
                const hasOverdue = pendingCount > 0 && key < today
                const isSelected = key === selectedDay
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-full text-sm font-bold transition",
                      isSelected ? "bg-primary text-primary-foreground" : key === today ? "text-primary ring-2 ring-primary/40" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {i + 1}
                    {dayTasks.length > 0 && (
                      <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : hasOverdue ? "bg-rose-500" : pendingCount ? "bg-amber-500" : "bg-primary/50")}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-foreground">
                {relativeDayLabel(selectedDay)}
                <span className="ml-1.5 font-semibold text-muted-foreground">{selectedDayTasks.length} งาน</span>
              </h3>
              <button type="button" onClick={() => openCreate(selectedDay)} className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-bold text-primary hover:bg-muted">
                <Plus size={16} /> เพิ่มวันนี้
              </button>
            </div>
            {selectedDayTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">ไม่มีงานในวันนี้</p>
            ) : (
              <ul className="space-y-2">
                {selectedDayTasks.map(t => <li key={t.id}><TaskCard task={t} plotName={plotName(t.plotId)} {...cardProps} /></li>)}
              </ul>
            )}
          </section>
        </div>
      )}

      <Fab onClick={() => openCreate(view === "calendar" ? selectedDay : today)} label="เพิ่มงาน" icon={<Plus size={20} strokeWidth={2.75} />} />

      <TaskFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        plots={data.plots}
        defaultDateKey={createDateKey}
        onCreate={handleCreate}
      />

      {addActivity && (
        <ActivityFormSheet
          open={logDefaults !== null}
          onOpenChange={open => { if (!open) setLogDefaults(null) }}
          plots={data.plots}
          defaults={logDefaults ?? undefined}
          onSave={(draft: ActivityDraft, { addExpense }) => {
            saveActivityWithExpense(draft, addExpense, addActivity, addFinance)
            toast.success("ลงบันทึกสวนแล้ว")
          }}
        />
      )}
    </div>
  )
}

function SummaryTile({ label, value, tone, progress }: { label: string; value: number | string; tone: "danger" | "primary" | "muted"; progress?: number }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border px-3 py-3",
      tone === "danger" ? "border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10" : "border-border bg-card",
    )}>
      <p className={cn("text-2xl font-black leading-none", tone === "danger" ? "text-rose-600 dark:text-rose-300" : tone === "primary" ? "text-primary" : "text-foreground")}>{value}</p>
      <p className="mt-1.5 text-xs font-bold text-muted-foreground">{label}</p>
      {progress !== undefined && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-muted">
          <span className="block h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      )}
    </div>
  )
}

type CardProps = {
  plots: AppDataReturn["data"]["plots"]
  updateTask: (id: string, changes: Partial<Task>) => void
  onDelete: (task: Task) => void
  onComplete?: (task: Task) => void
}

function TaskSection({ title, subtitle, tone, tasks, cardProps, plotName, footer, hideDate }: {
  title: string
  subtitle?: string
  hideDate?: boolean
  tone?: "danger"
  tasks: Task[]
  cardProps: CardProps
  plotName: (id: string) => string
  footer?: React.ReactNode
}) {
  if (!tasks.length) return null
  return (
    <section>
      <h3 className={cn("mb-2 px-1 text-sm font-black", tone === "danger" ? "text-rose-600 dark:text-rose-300" : "text-foreground")}>
        {title}
        {subtitle && <span className="ml-1.5 font-semibold text-muted-foreground">{subtitle}</span>}
        <span className="ml-1.5 font-semibold text-muted-foreground">· {tasks.length}</span>
      </h3>
      <ul className="space-y-2">
        {tasks.map(t => <li key={t.id}><TaskCard task={t} plotName={plotName(t.plotId)} showDate={!hideDate} {...cardProps} /></li>)}
      </ul>
      {footer}
    </section>
  )
}

/**
 * One task row: big tick target on the left, tap anywhere else to open details.
 * Also used by the dashboard, so it owns its own edit sheet.
 */
export function TaskCard({ task, plotName, plots = [], updateTask, deleteTask, onDelete, onComplete, showDate = true }: {
  task: Task
  showDate?: boolean
  plotName: string
  plots?: AppDataReturn["data"]["plots"]
  updateTask: (id: string, changes: Partial<Task>) => void
  deleteTask?: (id: string) => void
  /** Preferred over deleteTask: receives the whole task (enables undo). */
  onDelete?: (task: Task) => void
  onComplete?: (task: Task) => void
}) {
  const [open, setOpen] = useState(false)
  const isDone = task.status === "done"
  const isCancelled = task.status === "cancelled"
  const key = toDateKey(task.date)
  const overdue = task.status === "pending" && key < todayKey()
  const priority = PRIORITY_META[task.priority]

  const toggle = () => {
    if (isCancelled) return
    if (isDone) updateTask(task.id, { status: "pending" })
    else if (onComplete) onComplete(task)
    else { updateTask(task.id, { status: "done" }); toast.success("ทำเสร็จแล้ว") }
  }

  return (
    <>
      <div className={cn(
        "flex items-stretch overflow-hidden rounded-2xl border bg-card shadow-sm transition",
        overdue ? "border-rose-200 dark:border-rose-400/30" : "border-border",
        (isDone || isCancelled) && "opacity-70",
      )}>
        <button
          type="button"
          onClick={toggle}
          disabled={isCancelled}
          aria-label={isDone ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
          className="flex w-14 shrink-0 items-center justify-center"
        >
          <span className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border-2 transition",
            isDone ? "border-primary bg-primary text-primary-foreground" : isCancelled ? "border-border" : "border-muted-foreground/40 hover:border-primary",
          )}>
            {isDone && <Check size={16} strokeWidth={3.5} />}
          </span>
        </button>
        <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 py-3 pr-4 text-left">
          <span className={cn("block font-bold text-foreground", (isDone || isCancelled) && "line-through decoration-2")}>{task.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {showDate && (
              <>
                <span className={cn(overdue && "font-bold text-rose-600 dark:text-rose-300")}>
                  {overdue ? `เลยกำหนด ${daysBetween(key, todayKey())} วัน` : relativeDayLabel(key)}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="truncate">{plotName || "ทั้งสวน"}</span>
            {task.priority === "high" && !isDone && !isCancelled && (
              <span className={cn("rounded-full px-2 text-xs font-bold", priority.chip)}>{priority.label}</span>
            )}
            {isCancelled && <span className="rounded-full bg-muted px-2 text-xs font-bold">ยกเลิก</span>}
          </span>
          {task.description && <span className="mt-1 line-clamp-1 block text-sm text-foreground/70">{task.description}</span>}
        </button>
      </div>
      <TaskFormSheet
        open={open}
        onOpenChange={setOpen}
        plots={plots}
        task={task}
        onUpdate={updateTask}
        onDelete={onDelete ?? (t => deleteTask?.(t.id))}
      />
    </>
  )
}
