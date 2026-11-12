"use client"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, ClipboardList, Download, MoreHorizontal, Plus, Printer } from "lucide-react"
import { Activity, ActivityType, ACTIVITY_LABELS, useAppData } from "@/lib/store"
import { exportOperationsToCSV } from "@/lib/report-utils"
import { daysBetween, formatThaiDate, MONTHS_TH, parseDateKey, relativeDayLabel, toDateKey, todayKey } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { PrintReportData } from "./PrintReportView"
import ActivityFormSheet, { ActivityDraft } from "./records/ActivityFormSheet"
import { ACTIVITY_META, ACTIVITY_TYPES } from "./records/meta"
import { Chip, Fab } from "./records/ui"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
  updateActivity: AppDataReturn["updateActivity"]
  addFinance?: AppDataReturn["addFinance"]
  onPrint?: (reportData: Omit<PrintReportData, "farmName" | "userName" | "plots">) => void
}

const MONTHS_FULL_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
const baht = (n: number) => `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`

/** Saves an activity and, when asked, mirrors its cost into the finance ledger. */
export function saveActivityWithExpense(
  draft: ActivityDraft,
  addExpense: boolean,
  addActivity: AppDataReturn["addActivity"],
  addFinance?: AppDataReturn["addFinance"],
) {
  addActivity(draft)
  if (addExpense && addFinance && draft.cost > 0) {
    addFinance({
      date: draft.date,
      type: "expense",
      category: ACTIVITY_META[draft.activityType].financeCategory,
      amount: draft.cost,
      description: (draft.description && draft.description !== ACTIVITY_LABELS[draft.activityType]
        ? `${ACTIVITY_LABELS[draft.activityType]} · ${draft.description}`
        : ACTIVITY_LABELS[draft.activityType]).slice(0, 200),
      plotId: draft.plotId || undefined,
    })
  }
}

export default function ActivityLog({ data, addActivity, deleteActivity, updateActivity, addFinance, onPrint }: Props) {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [typeFilter, setTypeFilter] = useState<ActivityType | "all">("all")
  const [plotFilter, setPlotFilter] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)

  useEffect(() => {
    if (localStorage.getItem("open_activity_form") === "1") {
      localStorage.removeItem("open_activity_form")
      setEditing(null)
      setSheetOpen(true)
    }
  }, [])

  const plotName = (id: string) => (id ? data.plots.find(p => p.id === id)?.name ?? "แปลงที่ถูกลบ" : "ทั้งสวน")
  const treeLabel = (a: Activity) => {
    if (!a.treeId) return null
    const tree = data.plots.find(p => p.id === a.plotId)?.trees.find(t => t.id === a.treeId)
    return tree ? `ต้น ${tree.treeNumber}` : null
  }

  // Records in the visible month (plot filter applied, type filter not yet — chips show counts).
  const monthRecords = useMemo(() => data.activities.filter(a => {
    const d = parseDateKey(toDateKey(a.date))
    return d.getFullYear() === cursor.year && d.getMonth() === cursor.month && (plotFilter === "all" || a.plotId === plotFilter)
  }), [data.activities, cursor, plotFilter])

  const typeCounts = useMemo(() => {
    const counts = {} as Record<ActivityType, number>
    monthRecords.forEach(a => { counts[a.activityType] = (counts[a.activityType] ?? 0) + 1 })
    return counts
  }, [monthRecords])

  const visible = useMemo(() => monthRecords
    .filter(a => typeFilter === "all" || a.activityType === typeFilter)
    .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date)) || (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
  [monthRecords, typeFilter])

  const groups = useMemo(() => {
    const map = new Map<string, Activity[]>()
    visible.forEach(a => {
      const key = toDateKey(a.date)
      map.set(key, [...(map.get(key) ?? []), a])
    })
    return [...map.entries()]
  }, [visible])

  const totalCost = visible.reduce((sum, a) => sum + (a.cost || 0), 0)
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth()
  const monthLabel = `${MONTHS_FULL_TH[cursor.month]} ${cursor.year + 543}`

  const moveMonth = (delta: number) => setCursor(c => {
    const d = new Date(c.year, c.month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const openNew = () => { setEditing(null); setSheetOpen(true) }
  const openEdit = (a: Activity) => { setEditing(a); setSheetOpen(true) }

  const handleSave = (draft: ActivityDraft, { addExpense }: { addExpense: boolean }) => {
    if (editing) {
      updateActivity(editing.id, draft)
      toast.success("แก้ไขบันทึกแล้ว")
      return
    }
    saveActivityWithExpense(draft, addExpense, addActivity, addFinance)
    // Jump to the month of the new record so it is visible.
    const d = parseDateKey(toDateKey(draft.date))
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    toast.success(`บันทึก${ACTIVITY_LABELS[draft.activityType]}แล้ว`, {
      description: addExpense ? `ลงรายจ่าย ${baht(draft.cost)} ในการเงินแล้ว` : undefined,
    })
  }

  const handleDelete = (a: Activity) => {
    deleteActivity(a.id)
    toast("ลบบันทึกแล้ว", {
      action: { label: "เลิกทำ", onClick: () => addActivity({ date: a.date, plotId: a.plotId, treeId: a.treeId, activityType: a.activityType, description: a.description, cost: a.cost }) },
    })
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Month summary + actions */}
      <section className="flex items-center gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <button type="button" onClick={() => moveMonth(-1)} aria-label="เดือนก่อน" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-black text-foreground"><span className="min-[400px]:hidden">{MONTHS_TH[cursor.month]} {cursor.year + 543}</span><span className="hidden min-[400px]:inline">{monthLabel}</span></p>
          <p className="truncate text-sm text-muted-foreground">
            {visible.length} ครั้ง{totalCost > 0 && <> · <span className="font-bold text-foreground">{baht(totalCost)}</span></>}
          </p>
          {!isCurrentMonth && (
            <button type="button" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })} className="text-xs font-bold text-primary">
              กลับไปเดือนนี้
            </button>
          )}
        </div>
        <button type="button" onClick={() => moveMonth(1)} aria-label="เดือนถัดไป" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted">
          <ChevronRight size={20} />
        </button>
        <div className="flex shrink-0 items-center gap-2 border-l border-border pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="ตัวเลือกเพิ่มเติม" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 hover:bg-muted">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                disabled={visible.length === 0}
                onSelect={() => exportOperationsToCSV([], visible, id => plotName(id ?? ""))}
                className="gap-2 py-2.5 font-semibold"
              >
                <Download size={16} /> ส่งออก Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={visible.length === 0}
                onSelect={() => onPrint?.({ type: "operations", title: `รายงานบันทึกสวน (${monthLabel})`, dateRange: monthLabel, activities: visible, tasks: [] })}
                className="gap-2 py-2.5 font-semibold"
              >
                <Printer size={16} /> พิมพ์รายงาน (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={openNew}
            className="hidden h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary/90 lg:inline-flex"
          >
            <Plus size={18} /> บันทึกงาน
          </button>
        </div>
      </section>

      {/* Filters */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {data.plots.length > 1 && (
          <select
            value={plotFilter}
            onChange={e => setPlotFilter(e.target.value)}
            aria-label="กรองตามแปลง"
            className="min-h-10 shrink-0 rounded-full border border-border bg-card px-3.5 text-sm font-bold text-foreground"
          >
            <option value="all">ทุกแปลง</option>
            {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>ทั้งหมด</Chip>
        {ACTIVITY_TYPES.filter(t => typeCounts[t] || typeFilter === t).map(t => {
          const Icon = ACTIVITY_META[t].icon
          return (
            <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}>
              <Icon size={15} /> {ACTIVITY_LABELS[t]}
              <span className={cn("rounded-full px-1.5 text-xs", typeFilter === t ? "bg-white/20" : "bg-muted")}>{typeCounts[t] ?? 0}</span>
            </Chip>
          )
        })}
      </div>

      {/* Day-grouped timeline */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
            <ClipboardList size={26} />
          </div>
          <p className="font-bold text-foreground">{monthRecords.length ? "ไม่มีบันทึกประเภทนี้" : `ยังไม่มีบันทึกใน${MONTHS_TH[cursor.month]}`}</p>
          <p className="mt-1 text-sm text-muted-foreground">ใส่ปุ๋ย พ่นยา ให้น้ำ — จดไว้ทุกครั้ง จะได้รู้ต้นทุนและดูย้อนหลังได้</p>
          <button type="button" onClick={openNew} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground">
            <Plus size={16} /> บันทึกงานแรก
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([key, items]) => {
            const dayCost = items.reduce((s, a) => s + (a.cost || 0), 0)
            const isFuture = daysBetween(todayKey(), key) > 0
            return (
              <section key={key}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h3 className="text-sm font-black text-foreground">
                    {relativeDayLabel(key)}
                    {["วันนี้", "เมื่อวาน", "พรุ่งนี้"].includes(relativeDayLabel(key)) && (
                      <span className="ml-1.5 font-semibold text-muted-foreground">{formatThaiDate(key, { weekday: true })}</span>
                    )}
                    {isFuture && <span className="ml-1.5 text-xs font-bold text-amber-600">(วันข้างหน้า)</span>}
                  </h3>
                  {dayCost > 0 && <span className="text-xs font-bold text-muted-foreground">{baht(dayCost)}</span>}
                </div>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {items.map(a => {
                    const meta = ACTIVITY_META[a.activityType]
                    const Icon = meta.icon
                    const tree = treeLabel(a)
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-muted/60 active:bg-muted"
                        >
                          <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.chip)}>
                            <Icon size={19} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-bold text-foreground">{ACTIVITY_LABELS[a.activityType]}</span>
                              {a.cost > 0 && <span className="shrink-0 text-sm font-bold text-foreground">{baht(a.cost)}</span>}
                            </span>
                            <span className="block text-sm text-muted-foreground">
                              {plotName(a.plotId)}{tree && ` · ${tree}`}
                            </span>
                            {a.description && (
                              <span className="mt-1 line-clamp-2 block whitespace-pre-wrap break-words text-sm text-foreground/80">{a.description}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <Fab onClick={openNew} label="บันทึกงาน" icon={<Plus size={20} strokeWidth={2.75} />} />

      <ActivityFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plots={data.plots}
        activity={editing}
        defaults={plotFilter !== "all" ? { plotId: plotFilter } : undefined}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
