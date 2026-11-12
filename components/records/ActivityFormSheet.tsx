"use client"
import { useEffect, useState } from "react"
import { Trash2, Wallet } from "lucide-react"
import { Activity, ActivityType, ACTIVITY_LABELS, Plot } from "@/lib/store"
import { validateNumber, validateText } from "@/lib/form-validation"
import { dateKeyToISO, toDateKey, todayKey } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { ACTIVITY_META, ACTIVITY_TYPES } from "./meta"
import { Chip, ChipRow, ConfirmDialog, DateQuickPicker, Field, FormError, GhostButton, inputClass, PrimaryButton, RecordSheet } from "./ui"

export type ActivityDraft = Omit<Activity, "id" | "createdAt">

export type ActivityDefaults = Partial<Pick<Activity, "plotId" | "treeId" | "activityType" | "description">> & { dateKey?: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plots: Plot[]
  /** Existing record to edit; omit to create. */
  activity?: Activity | null
  defaults?: ActivityDefaults
  /** Lock plot/tree (e.g. when opened from a tree page). */
  lockLocation?: boolean
  onSave: (draft: ActivityDraft, options: { addExpense: boolean }) => void
  onDelete?: (activity: Activity) => void
}

type FormState = {
  dateKey: string
  plotId: string
  treeId: string
  activityType: ActivityType
  description: string
  cost: string
  addExpense: boolean
}

function initialState(plots: Plot[], activity?: Activity | null, defaults?: ActivityDefaults): FormState {
  if (activity) {
    return {
      dateKey: toDateKey(activity.date),
      plotId: activity.plotId,
      treeId: activity.treeId ?? "",
      activityType: activity.activityType,
      description: activity.description,
      cost: activity.cost ? String(activity.cost) : "",
      addExpense: false,
    }
  }
  return {
    dateKey: defaults?.dateKey ?? todayKey(),
    plotId: defaults?.plotId ?? plots[0]?.id ?? "",
    treeId: defaults?.treeId ?? "",
    activityType: defaults?.activityType ?? "fertilize",
    description: defaults?.description ?? "",
    cost: "",
    addExpense: true,
  }
}

export default function ActivityFormSheet({ open, onOpenChange, plots, activity, defaults, lockLocation, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(plots, activity, defaults))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = Boolean(activity)

  // Reset whenever the sheet is (re)opened for a different record.
  useEffect(() => {
    if (open) {
      setForm(initialState(plots, activity, defaults))
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activity?.id])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const plot = plots.find(p => p.id === form.plotId)
  const lockedTree = lockLocation ? plot?.trees.find(t => t.id === form.treeId) : undefined
  const meta = ACTIVITY_META[form.activityType]
  const costNumber = form.cost === "" ? 0 : Number(form.cost)

  const appendSuggestion = (text: string) => {
    setForm(f => {
      if (f.description.includes(text)) return f
      return { ...f, description: f.description ? `${f.description.trim()} · ${text}` : text }
    })
  }

  const handleSave = () => {
    const description = validateText("รายละเอียด", form.description, { maxLength: 500, allowMultiline: true })
    if (!description.ok) return setError(description.message)
    const cost = validateNumber("ค่าใช้จ่าย", costNumber, { min: 0, max: 10_000_000 })
    if (!cost.ok) return setError(cost.message)
    if (!form.dateKey) return setError("กรุณาเลือกวันที่")

    onSave({
      date: dateKeyToISO(form.dateKey),
      plotId: form.plotId,
      treeId: form.treeId || undefined,
      activityType: form.activityType,
      description: description.value,
      cost: cost.value,
    }, { addExpense: !isEdit && form.addExpense && cost.value > 0 })
    onOpenChange(false)
  }

  return (
    <>
      <RecordSheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "แก้ไขบันทึก" : "บันทึกงานในสวน"}
        description={lockedTree ? `ต้น ${lockedTree.treeNumber} · ${plot?.name}` : "บันทึกสิ่งที่ทำไปแล้ว เพื่อดูย้อนหลังและคิดต้นทุน"}
        footer={
          <div className="flex gap-2">
            {isEdit && onDelete && (
              <GhostButton tone="danger" onClick={() => setConfirmDelete(true)} className="px-3.5" >
                <Trash2 size={18} /><span className="sr-only">ลบ</span>
              </GhostButton>
            )}
            <PrimaryButton onClick={handleSave}>{isEdit ? "บันทึกการแก้ไข" : "บันทึก"}</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="ทำอะไร">
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map(type => {
                const m = ACTIVITY_META[type]
                const Icon = m.icon
                const active = form.activityType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set("activityType", type)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-xs font-bold transition active:scale-95",
                      active ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30" : "border-border bg-background text-foreground/75 hover:bg-muted",
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", m.chip)}>
                      <Icon size={17} />
                    </span>
                    {ACTIVITY_LABELS[type]}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="วันที่">
            <DateQuickPicker value={form.dateKey} onChange={key => set("dateKey", key)} direction="past" />
          </Field>

          {!lockLocation && (
            <Field label="ที่ไหน">
              <ChipRow>
                {plots.map(p => (
                  <Chip key={p.id} active={form.plotId === p.id} onClick={() => setForm(f => ({ ...f, plotId: p.id, treeId: "" }))}>
                    {p.name}
                  </Chip>
                ))}
                <Chip active={form.plotId === ""} onClick={() => setForm(f => ({ ...f, plotId: "", treeId: "" }))}>ทั้งสวน</Chip>
              </ChipRow>
              {plot && plot.trees.length > 0 && (
                <select
                  value={form.treeId}
                  onChange={e => set("treeId", e.target.value)}
                  aria-label="เลือกต้น"
                  className={inputClass}
                >
                  <option value="">ทั้งแปลง ({plot.trees.length} ต้น)</option>
                  {plot.trees.map(t => <option key={t.id} value={t.id}>ต้น {t.treeNumber} · {t.variety}</option>)}
                </select>
              )}
            </Field>
          )}

          <Field label="รายละเอียด" hint="ไม่บังคับ">
            <ChipRow>
              {meta.suggestions.map(s => (
                <Chip key={s} onClick={() => appendSuggestion(s)} className="min-h-9 px-3 text-xs">+ {s}</Chip>
              ))}
            </ChipRow>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="เช่น ชื่อปุ๋ย/ยา อัตราที่ใช้ จำนวนต้น"
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          <Field label="ค่าใช้จ่าย" hint="ไม่บังคับ">
            <div className="relative">
              <input
                inputMode="decimal"
                value={form.cost}
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9.]/g, "")
                  const parts = v.split(".")
                  if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`
                  set("cost", v)
                }}
                placeholder="0"
                className={cn(inputClass, "pr-12 text-lg font-bold")}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">บาท</span>
            </div>
            {!isEdit && costNumber > 0 && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-muted px-3.5 py-2.5 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={form.addExpense}
                  onChange={e => set("addExpense", e.target.checked)}
                  className="h-5 w-5 accent-[var(--primary)]"
                />
                <Wallet size={16} className="text-muted-foreground" />
                <span>ลงเป็นรายจ่าย “{meta.financeCategory}” ในการเงินด้วย</span>
              </label>
            )}
          </Field>

          <FormError message={error} />
        </div>
      </RecordSheet>

      {activity && onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="ลบบันทึกนี้?"
          description={`${ACTIVITY_LABELS[activity.activityType]} · ลบแล้วกู้คืนได้จากปุ่ม “เลิกทำ” ชั่วครู่`}
          onConfirm={() => { onDelete(activity); onOpenChange(false) }}
        />
      )}
    </>
  )
}
