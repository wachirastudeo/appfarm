"use client"
import { useEffect, useState } from "react"
import { CalendarPlus, Download, RotateCcw, Trash2, XCircle } from "lucide-react"
import { Plot, Task } from "@/lib/store"
import { validateText } from "@/lib/form-validation"
import { addDaysToKey, dateKeyToISO, formatThaiDate, parseDateKey, dateKeyOf, toDateKey, todayKey } from "@/lib/date-utils"
import { downloadTaskCalendarFile, getGoogleCalendarUrl } from "@/lib/calendar"
import { cn } from "@/lib/utils"
import { PRIORITY_META, TASK_SUGGESTIONS } from "./meta"
import { Chip, ChipRow, ConfirmDialog, DateQuickPicker, Field, FormError, GhostButton, inputClass, PrimaryButton, RecordSheet } from "./ui"

export type TaskDraft = Omit<Task, "id">

const REPEAT_OPTIONS = [
  { days: 0, label: "ครั้งเดียว" },
  { days: 7, label: "ทุกสัปดาห์" },
  { days: 14, label: "ทุก 2 สัปดาห์" },
  { days: 30, label: "ทุกเดือน" },
] as const
const DURATION_OPTIONS = [1, 2, 3, 6] as const
const MAX_OCCURRENCES = 120

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plots: Plot[]
  task?: Task | null
  defaultDateKey?: string
  defaultPlotId?: string
  onCreate?: (drafts: TaskDraft[]) => void
  onUpdate?: (id: string, changes: Partial<Task>) => void
  onDelete?: (task: Task) => void
}

type FormState = {
  title: string
  description: string
  dateKey: string
  plotId: string
  priority: Task["priority"]
  repeatDays: number
  customDays: string
  durationMonths: number
}

function initialState(plots: Plot[], task?: Task | null, defaultDateKey?: string, defaultPlotId?: string): FormState {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    dateKey: task ? toDateKey(task.date) : defaultDateKey ?? todayKey(),
    plotId: task ? task.plotId : defaultPlotId ?? plots[0]?.id ?? "",
    priority: task?.priority ?? "medium",
    repeatDays: 0,
    customDays: "3",
    durationMonths: 3,
  }
}

/** Dates for a repeating plan: from start, every N days, up to `months` later (capped). */
export function buildRepeatDates(startKey: string, everyDays: number, months: number) {
  if (!everyDays) return [startKey]
  const start = parseDateKey(startKey)
  const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate())
  const endKey = dateKeyOf(end)
  const keys: string[] = []
  for (let key = startKey; key <= endKey && keys.length < MAX_OCCURRENCES; key = addDaysToKey(key, everyDays)) keys.push(key)
  return keys
}

export default function TaskFormSheet({ open, onOpenChange, plots, task, defaultDateKey, defaultPlotId, onCreate, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(plots, task, defaultDateKey, defaultPlotId))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [customRepeat, setCustomRepeat] = useState(false)
  const isEdit = Boolean(task)

  useEffect(() => {
    if (open) {
      setForm(initialState(plots, task, defaultDateKey, defaultPlotId))
      setCustomRepeat(false)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, defaultDateKey])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const everyDays = customRepeat ? Number(form.customDays) || 0 : form.repeatDays
  const repeatDates = !isEdit && everyDays > 0 ? buildRepeatDates(form.dateKey, everyDays, form.durationMonths) : []
  const plotName = (id: string) => plots.find(p => p.id === id)?.name ?? "ทั้งสวน"

  const handleSave = () => {
    const title = validateText("ชื่องาน", form.title, { required: true, maxLength: 160 })
    if (!title.ok) return setError(title.message)
    const description = validateText("รายละเอียด", form.description, { maxLength: 500, allowMultiline: true })
    if (!description.ok) return setError(description.message)
    if (customRepeat && (everyDays < 1 || everyDays > 365)) return setError("จำนวนวันที่ทำซ้ำต้องอยู่ระหว่าง 1–365 วัน")

    const base = { title: title.value, description: description.value, plotId: form.plotId, priority: form.priority }
    if (task) {
      onUpdate?.(task.id, { ...base, date: dateKeyToISO(form.dateKey) })
    } else {
      const keys = everyDays > 0 ? buildRepeatDates(form.dateKey, everyDays, form.durationMonths) : [form.dateKey]
      onCreate?.(keys.map(key => ({ ...base, date: dateKeyToISO(key), status: "pending" as const })))
    }
    onOpenChange(false)
  }

  return (
    <>
      <RecordSheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "รายละเอียดงาน" : "เพิ่มแผนงาน"}
        description={isEdit ? `${plotName(form.plotId)} · ${formatThaiDate(form.dateKey, { weekday: true, year: true })}` : "วางแผนงานล่วงหน้า แล้วติ๊กเมื่อทำเสร็จ"}
        footer={
          <div className="flex gap-2">
            {isEdit && onDelete && (
              <GhostButton tone="danger" onClick={() => setConfirmDelete(true)} className="px-3.5">
                <Trash2 size={18} /><span className="sr-only">ลบงาน</span>
              </GhostButton>
            )}
            <PrimaryButton onClick={handleSave}>
              {isEdit ? "บันทึกการแก้ไข" : repeatDates.length > 1 ? `สร้าง ${repeatDates.length} งาน` : "เพิ่มงาน"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="งานอะไร">
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="เช่น พ่นยาป้องกันเชื้อรา"
              className={cn(inputClass, "text-lg font-bold")}
            />
            {!isEdit && (
              <ChipRow>
                {TASK_SUGGESTIONS.map(s => (
                  <Chip key={s} active={form.title === s} onClick={() => set("title", s)} className="min-h-9 px-3 text-xs">{s}</Chip>
                ))}
              </ChipRow>
            )}
          </Field>

          <Field label="วันที่">
            <DateQuickPicker value={form.dateKey} onChange={key => set("dateKey", key)} direction="future" />
          </Field>

          <Field label="แปลง">
            <ChipRow>
              {plots.map(p => (
                <Chip key={p.id} active={form.plotId === p.id} onClick={() => set("plotId", p.id)}>{p.name}</Chip>
              ))}
              <Chip active={form.plotId === ""} onClick={() => set("plotId", "")}>ทั้งสวน</Chip>
            </ChipRow>
          </Field>

          <Field label="ความเร่งด่วน">
            <div className="grid grid-cols-3 gap-2">
              {(["high", "medium", "low"] as const).map(p => (
                <Chip key={p} active={form.priority === p} activeClass={PRIORITY_META[p].active} onClick={() => set("priority", p)} className="w-full">
                  <span className={cn("h-2.5 w-2.5 rounded-full", form.priority === p ? "bg-current" : PRIORITY_META[p].dot)} />
                  {PRIORITY_META[p].label}
                </Chip>
              ))}
            </div>
          </Field>

          {!isEdit && (
            <Field label="ทำซ้ำ" hint={repeatDates.length > 1 ? `${repeatDates.length} ครั้ง ถึง ${formatThaiDate(repeatDates[repeatDates.length - 1], { year: true })}` : undefined}>
              <ChipRow>
                {REPEAT_OPTIONS.map(o => (
                  <Chip key={o.days} active={!customRepeat && form.repeatDays === o.days} onClick={() => { setCustomRepeat(false); set("repeatDays", o.days) }}>
                    {o.label}
                  </Chip>
                ))}
                <Chip active={customRepeat} onClick={() => setCustomRepeat(true)}>กำหนดเอง</Chip>
              </ChipRow>
              {customRepeat && (
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  ทุก
                  <input
                    inputMode="numeric"
                    value={form.customDays}
                    onChange={e => set("customDays", e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className={cn(inputClass, "w-20 text-center")}
                    aria-label="ทำซ้ำทุกกี่วัน"
                  />
                  วัน
                </div>
              )}
              {everyDays > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">ทำซ้ำไปนานเท่าไร</p>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_OPTIONS.map(m => (
                      <Chip key={m} active={form.durationMonths === m} onClick={() => set("durationMonths", m)} className="min-h-9 w-full px-2">{m} เดือน</Chip>
                    ))}
                  </div>
                </div>
              )}
            </Field>
          )}

          <Field label="รายละเอียด" hint="ไม่บังคับ">
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={2}
              placeholder="เช่น ชื่อยา อัตราผสม ผู้รับผิดชอบ"
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          {task && (
            <div className="space-y-2 rounded-2xl bg-muted/60 p-3">
              <p className="px-1 text-xs font-bold text-muted-foreground">ตัวเลือกอื่น</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getGoogleCalendarUrl(task, plotName(task.plotId))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground/80"
                >
                  <CalendarPlus size={16} /> Google ปฏิทิน
                </a>
                <button
                  type="button"
                  onClick={() => downloadTaskCalendarFile(task, plotName(task.plotId))}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground/80"
                >
                  <Download size={16} /> ไฟล์ปฏิทิน
                </button>
                {task.status === "cancelled" ? (
                  <button type="button" onClick={() => { onUpdate?.(task.id, { status: "pending" }); onOpenChange(false) }} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground/80">
                    <RotateCcw size={16} /> เปิดงานนี้อีกครั้ง
                  </button>
                ) : task.status === "pending" && (
                  <button type="button" onClick={() => { onUpdate?.(task.id, { status: "cancelled" }); onOpenChange(false) }} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground/80">
                    <XCircle size={16} /> ยกเลิกงานนี้ (ไม่ต้องทำแล้ว)
                  </button>
                )}
              </div>
            </div>
          )}

          <FormError message={error} />
        </div>
      </RecordSheet>

      {task && onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="ลบงานนี้?"
          description={task.title}
          onConfirm={() => { onDelete(task); onOpenChange(false) }}
        />
      )}
    </>
  )
}
