"use client"
import { useEffect, useState } from "react"
import { FlowerBatch, FlowerStage, FLOWER_STAGE_LABELS, FLOWER_STAGES, Tree, VARIETIES, DurianVariety } from "@/lib/store"
import { validateNumber, validateText } from "@/lib/form-validation"
import { dateKeyToISO, todayKey } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HEALTH_META, isCropStage, STAGE_PHASES } from "./meta"
import { Chip, ChipRow, DateQuickPicker, Field, FormError, inputClass, PrimaryButton, RecordSheet } from "./ui"

export type StageInput = {
  stage: FlowerStage
  dateKey: string
  note: string
  startNewBatch: boolean
}

const uid = (prefix: string) => `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

/**
 * One rule for "the tree is now at stage X":
 * leaf/rest stages only change the tree; flower/fruit stages are also appended to the
 * current batch (or a new batch when asked / when none exists) so the timeline and
 * harvest forecast stay in sync.
 */
export function applyStage(tree: Tree, input: StageInput): Partial<Tree> {
  if (!isCropStage(input.stage)) return { stage: input.stage }
  const date = dateKeyToISO(input.dateKey)
  const entry = { id: uid("s"), stage: input.stage, date, note: input.note }
  const batches = tree.batches ?? []
  const current = batches[batches.length - 1]

  // Going back to an earlier flower stage means a new flowering round, not a correction.
  const latestInBatch = current?.stages[0]?.stage
  const goesBackwards = latestInBatch ? FLOWER_STAGES.indexOf(input.stage) < FLOWER_STAGES.indexOf(latestInBatch) : false

  if (!current || input.startNewBatch || goesBackwards) {
    const batch: FlowerBatch = {
      id: uid("b"),
      name: `รุ่นที่ ${batches.length + 1}`,
      fruitCount: 0,
      bloomDate: input.stage === "bloom" ? date : undefined,
      stages: [entry],
    }
    return { stage: input.stage, batches: [...batches, batch] }
  }
  return {
    stage: input.stage,
    batches: batches.map(b => b.id === current.id
      ? { ...b, stages: [entry, ...b.stages], bloomDate: input.stage === "bloom" ? date : b.bloomDate }
      : b),
  }
}

/** Pick a stage (grouped by phase), date and note. Used for one tree or many. */
export function StageSheet({ open, onOpenChange, title, description, currentStage, hasBatch, initial, showHealth, submitLabel, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  currentStage: FlowerStage
  /** Whether "continue current batch" is meaningful. */
  hasBatch: boolean
  /** Pre-fill when editing an existing timeline entry. */
  initial?: Partial<StageInput>
  showHealth?: boolean
  submitLabel?: string
  onSave: (input: StageInput & { health?: Tree["health"] }) => void
}) {
  const [stage, setStage] = useState<FlowerStage>(currentStage)
  const [dateKey, setDateKey] = useState(todayKey())
  const [note, setNote] = useState("")
  const [startNewBatch, setStartNewBatch] = useState(false)
  const [health, setHealth] = useState<Tree["health"] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const isEditEntry = Boolean(initial?.stage)

  useEffect(() => {
    if (!open) return
    setStage(initial?.stage ?? currentStage)
    setDateKey(initial?.dateKey ?? todayKey())
    setNote(initial?.note ?? "")
    setStartNewBatch(false)
    setHealth(undefined)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = () => {
    const checked = validateText("บันทึก", note, { maxLength: 300 })
    if (!checked.ok) return setError(checked.message)
    onSave({ stage, dateKey, note: checked.value, startNewBatch, health })
    onOpenChange(false)
  }

  return (
    <RecordSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={<PrimaryButton onClick={save}>{submitLabel ?? `บันทึก: ${FLOWER_STAGE_LABELS[stage]}`}</PrimaryButton>}
    >
      <div className="space-y-5">
        <div className="space-y-4">
          {STAGE_PHASES.map(phase => (
            <div key={phase.label}>
              <p className="mb-2 text-xs font-bold text-muted-foreground">{phase.emoji} {phase.label}</p>
              <div className="flex flex-wrap gap-2">
                {phase.stages.map(s => (
                  <Chip key={s} active={stage === s} onClick={() => setStage(s)}>
                    {FLOWER_STAGE_LABELS[s]}
                    {s === currentStage && stage !== s && <span className="text-[10px] font-semibold text-muted-foreground">(ปัจจุบัน)</span>}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isEditEntry && isCropStage(stage) && hasBatch && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            {[false, true].map(v => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setStartNewBatch(v)}
                className={cn("min-h-11 rounded-xl text-sm font-bold transition", startNewBatch === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
              >
                {v ? "เริ่มรุ่นดอกใหม่" : "รุ่นเดิมต่อ"}
              </button>
            ))}
          </div>
        )}

        <Field label="วันที่">
          <DateQuickPicker value={dateKey} onChange={setDateKey} direction="past" />
        </Field>

        {showHealth && (
          <Field label="สุขภาพต้น" hint="ไม่เปลี่ยนก็ได้">
            <div className="grid grid-cols-3 gap-2">
              {(["good", "fair", "poor"] as const).map(h => (
                <Chip key={h} active={health === h} activeClass={HEALTH_META[h].active} onClick={() => setHealth(health === h ? undefined : h)} className="w-full">
                  {HEALTH_META[h].label}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        <Field label="บันทึกสั้นๆ" hint="ไม่บังคับ">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น ออกดอก 70% ของทรงพุ่ม" className={inputClass} />
        </Field>
        <FormError message={error} />
      </div>
    </RecordSheet>
  )
}

/** Edit the identity fields of a tree. Stage/health have their own faster controls. */
export function TreeEditSheet({ open, onOpenChange, tree, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: Tree
  onSave: (changes: Partial<Tree>) => void
}) {
  const [form, setForm] = useState({ treeNumber: tree.treeNumber, variety: tree.variety, age: String(tree.age), notes: tree.notes })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ treeNumber: tree.treeNumber, variety: tree.variety, age: String(tree.age), notes: tree.notes })
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = () => {
    const treeNumber = validateText("หมายเลขต้น", form.treeNumber, { required: true, maxLength: 80 })
    if (!treeNumber.ok) return setError(treeNumber.message)
    const age = validateNumber("อายุ", Number(form.age || 0), { min: 0, max: 200, integer: true })
    if (!age.ok) return setError(age.message)
    const notes = validateText("หมายเหตุ", form.notes, { maxLength: 500, allowMultiline: true })
    if (!notes.ok) return setError(notes.message)
    onSave({ treeNumber: treeNumber.value, variety: form.variety, age: age.value, notes: notes.value })
    onOpenChange(false)
  }

  return (
    <RecordSheet open={open} onOpenChange={onOpenChange} title="แก้ไขข้อมูลต้น" footer={<PrimaryButton onClick={save}>บันทึก</PrimaryButton>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="หมายเลขต้น">
            <input value={form.treeNumber} onChange={e => setForm(f => ({ ...f, treeNumber: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="อายุ (ปี)">
            <input inputMode="numeric" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))} className={inputClass} />
          </Field>
        </div>
        <Field label="พันธุ์">
          <ChipRow>
            {VARIETIES.map(v => (
              <Chip key={v} active={form.variety === v} onClick={() => setForm(f => ({ ...f, variety: v as DurianVariety }))}>{v}</Chip>
            ))}
          </ChipRow>
        </Field>
        <Field label="หมายเหตุประจำต้น" hint="ไม่บังคับ">
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="เช่น เคยเป็นโรครากเน่า ฝั่งตะวันออก" className={cn(inputClass, "resize-none")} />
        </Field>
        <FormError message={error} />
      </div>
    </RecordSheet>
  )
}
