"use client"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, CalendarClock, ChevronDown, Minus, MoreHorizontal, NotebookPen, Pencil, Plus, QrCode, RefreshCw, Trash2 } from "lucide-react"
import { Activity, ACTIVITY_LABELS, BatchStage, FlowerBatch, FLOWER_STAGE_LABELS, Plot, Tree, useAppData } from "@/lib/store"
import { addDaysToKey, dateKeyToISO, daysBetween, formatThaiDate, relativeDistance, toDateKey, todayKey } from "@/lib/date-utils"
import { validateNumber, validateText } from "@/lib/form-validation"
import { cn } from "@/lib/utils"
import DurianIcon from "../DurianIcon"
import ActivityFormSheet from "./ActivityFormSheet"
import { saveActivityWithExpense } from "../ActivityLog"
import { ACTIVITY_META, HARVEST_DAYS, HEALTH_META, STAGE_PHASES, stagePhaseIndex } from "./meta"
import { applyStage, StageSheet, TreeEditSheet } from "./TreeSheets"
import { ConfirmDialog, Field, FormError, inputClass, PrimaryButton, RecordSheet } from "./ui"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AppDataReturn = ReturnType<typeof useAppData>

interface Props {
  tree: Tree
  plot: Plot
  activities: Activity[]
  onBack: () => void
  onShowQr: () => void
  updateTree: AppDataReturn["updateTree"]
  deleteTree: AppDataReturn["deleteTree"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
  addActivity: AppDataReturn["addActivity"]
  addFinance?: AppDataReturn["addFinance"]
}

/** Newest-first stages → the bloom date that drives the harvest forecast. */
const bloomDateOf = (stages: BatchStage[]) => stages.find(s => s.stage === "bloom")?.date

export default function TreeDetail({ tree, plot, activities, onBack, onShowQr, updateTree, deleteTree, updateBatch, deleteBatch, addActivity, addFinance }: Props) {
  const [stageOpen, setStageOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [careOpen, setCareOpen] = useState(false)
  const [confirmDeleteTree, setConfirmDeleteTree] = useState(false)
  const [entryEdit, setEntryEdit] = useState<{ batch: FlowerBatch; entry: BatchStage } | null>(null)
  const [batchEdit, setBatchEdit] = useState<FlowerBatch | null>(null)
  const [historyLimit, setHistoryLimit] = useState(6)

  const batches = useMemo(() => [...(tree.batches ?? [])].reverse(), [tree.batches])
  const phase = stagePhaseIndex(tree.stage)
  const sinceUpdate = daysBetween(toDateKey(tree.lastUpdated), todayKey())

  const care = useMemo(() => activities
    .filter(a => a.plotId === plot.id && (!a.treeId || a.treeId === tree.id))
    .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date))),
  [activities, plot.id, tree.id])

  const setHealth = (health: Tree["health"]) => {
    if (health === tree.health) return
    const previous = tree.health
    updateTree(plot.id, tree.id, { health })
    toast.success(`สุขภาพต้น: ${HEALTH_META[health].label}`, {
      action: { label: "เลิกทำ", onClick: () => updateTree(plot.id, tree.id, { health: previous }) },
    })
  }

  const saveEntryEdit = (batch: FlowerBatch, entry: BatchStage, changes: Partial<BatchStage>) => {
    const stages = batch.stages.map(s => s.id === entry.id ? { ...s, ...changes } : s)
      .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date)))
    updateBatch(plot.id, tree.id, batch.id, { stages, bloomDate: bloomDateOf(stages) })
    const isLatestBatch = tree.batches[tree.batches.length - 1]?.id === batch.id
    if (isLatestBatch && stages[0]) updateTree(plot.id, tree.id, { stage: stages[0].stage })
  }

  const removeEntry = (batch: FlowerBatch, entry: BatchStage) => {
    const stages = batch.stages.filter(s => s.id !== entry.id)
    updateBatch(plot.id, tree.id, batch.id, { stages, bloomDate: bloomDateOf(stages) })
    toast("ลบระยะแล้ว", { action: { label: "เลิกทำ", onClick: () => updateBatch(plot.id, tree.id, batch.id, { stages: batch.stages, bloomDate: batch.bloomDate }) } })
  }

  return (
    <div className="space-y-4 p-4 pb-28 sm:p-5 lg:pb-6">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label="กลับไปหน้าแปลง" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-black text-foreground">ต้น {tree.treeNumber}</h2>
          <p className="truncate text-sm text-muted-foreground">{plot.name} · {tree.variety} · {tree.age} ปี</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="ตัวเลือกต้นนี้" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/70 hover:bg-muted">
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setEditOpen(true)} className="gap-2 py-2.5 font-semibold"><Pencil size={16} /> แก้ไขข้อมูลต้น</DropdownMenuItem>
            <DropdownMenuItem onSelect={onShowQr} className="gap-2 py-2.5 font-semibold"><QrCode size={16} /> QR Code ประจำต้น</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setConfirmDeleteTree(true)} className="gap-2 py-2.5 font-semibold text-destructive focus:text-destructive"><Trash2 size={16} /> ลบต้นนี้</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status card */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">ระยะตอนนี้</p>
            <p className="text-2xl font-black leading-tight text-foreground">{FLOWER_STAGE_LABELS[tree.stage]}</p>
            <p className={cn("mt-0.5 text-sm", sinceUpdate > 14 ? "font-bold text-amber-600 dark:text-amber-300" : "text-muted-foreground")}>
              อัปเดต{relativeDistance(tree.lastUpdated) === "วันนี้" ? "วันนี้" : ` ${relativeDistance(tree.lastUpdated)}`}
              {sinceUpdate > 14 && " · ควรเช็กต้นอีกครั้ง"}
            </p>
          </div>
          <button type="button" onClick={() => setStageOpen(true)} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm active:scale-95">
            <RefreshCw size={16} /> อัปเดตระยะ
          </button>
        </div>

        {/* Phase stepper */}
        <ol className="grid grid-cols-5 gap-1.5" aria-label="ช่วงการเจริญเติบโต">
          {STAGE_PHASES.map((p, i) => (
            <li key={p.label} className="space-y-1 text-center">
              <span className={cn("block h-1.5 rounded-full", i < phase ? "bg-primary/60" : i === phase ? "bg-primary" : "bg-muted")} />
              <span className={cn("block truncate text-xs font-bold", i === phase ? "text-primary" : "text-muted-foreground")}>
                <span aria-hidden>{p.emoji}</span> {p.short}
              </span>
            </li>
          ))}
        </ol>

        {/* Health */}
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">สุขภาพต้น</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="สุขภาพต้น">
            {(["good", "fair", "poor"] as const).map(h => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={tree.health === h}
                onClick={() => setHealth(h)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border text-sm font-bold transition active:scale-95",
                  tree.health === h ? HEALTH_META[h].active : "border-border bg-card text-foreground/75 hover:bg-muted",
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", tree.health === h ? "bg-current" : HEALTH_META[h].dot)} />
                {HEALTH_META[h].label}
              </button>
            ))}
          </div>
        </div>

        {tree.notes && (
          <button type="button" onClick={() => setEditOpen(true)} className="block w-full rounded-xl bg-muted/70 px-3.5 py-2.5 text-left text-sm text-foreground/80">
            📝 {tree.notes}
          </button>
        )}
      </section>

      {/* Quick care log */}
      <button
        type="button"
        onClick={() => setCareOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><NotebookPen size={18} /></span>
        <span className="min-w-0">
          <span className="block font-bold text-foreground">บันทึกการดูแลต้นนี้</span>
          <span className="block text-sm text-muted-foreground">ใส่ปุ๋ย พ่นยา ตัดแต่ง หรือรักษาโรคเฉพาะต้น</span>
        </span>
      </button>

      {/* Batches */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-black text-foreground">รุ่นดอก/ผล <span className="font-semibold text-muted-foreground">· {batches.length}</span></h3>
        </div>
        {batches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-6 text-center">
            <p className="font-bold text-foreground">ยังไม่มีรุ่นดอก</p>
            <p className="mt-1 text-sm text-muted-foreground">เมื่อต้นเริ่มแทงช่อดอก กด “อัปเดตระยะ” แล้วเลือกระยะดอก ระบบจะสร้างรุ่นและคำนวณวันเก็บให้อัตโนมัติ</p>
          </div>
        ) : batches.map((batch, idx) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            harvestDays={HARVEST_DAYS[tree.variety] ?? 120}
            defaultOpen={idx === 0}
            onFruitChange={n => updateBatch(plot.id, tree.id, batch.id, { fruitCount: n })}
            onEdit={() => setBatchEdit(batch)}
            onEditEntry={entry => setEntryEdit({ batch, entry })}
            onRemoveEntry={entry => removeEntry(batch, entry)}
          />
        ))}
      </section>

      {/* Care history */}
      <section className="space-y-2">
        <h3 className="px-1 text-base font-black text-foreground">ประวัติการดูแล</h3>
        {care.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">ยังไม่มีบันทึกของต้นนี้หรือแปลงนี้</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {care.slice(0, historyLimit).map(a => {
              const meta = ACTIVITY_META[a.activityType]
              const Icon = meta.icon
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.chip)}><Icon size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold text-foreground">
                      {ACTIVITY_LABELS[a.activityType]}
                      {!a.treeId && <span className="rounded-full bg-muted px-2 text-[11px] font-bold text-muted-foreground">ทั้งแปลง</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatThaiDate(a.date, { weekday: true, year: true })} · {relativeDistance(a.date)}</p>
                    {a.description && a.description !== ACTIVITY_LABELS[a.activityType] && <p className="mt-0.5 line-clamp-2 text-sm text-foreground/80">{a.description}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {care.length > historyLimit && (
          <button type="button" onClick={() => setHistoryLimit(l => l + 10)} className="w-full rounded-xl py-2.5 text-sm font-bold text-primary hover:bg-muted">
            ดูเพิ่ม ({care.length - historyLimit})
          </button>
        )}
      </section>

      {/* Sheets & dialogs */}
      <StageSheet
        open={stageOpen}
        onOpenChange={setStageOpen}
        title={`อัปเดตระยะ ต้น ${tree.treeNumber}`}
        description="เลือกระยะที่เห็นวันนี้ ระยะดอก/ผลจะถูกเก็บเป็นประวัติของรุ่น"
        currentStage={tree.stage}
        hasBatch={batches.length > 0}
        onSave={input => {
          updateTree(plot.id, tree.id, applyStage(tree, input))
          toast.success(`ต้น ${tree.treeNumber}: ${FLOWER_STAGE_LABELS[input.stage]}`)
        }}
      />
      {entryEdit && (
        <StageSheet
          open
          onOpenChange={open => { if (!open) setEntryEdit(null) }}
          title={`แก้ไขระยะใน${entryEdit.batch.name}`}
          currentStage={entryEdit.entry.stage}
          hasBatch
          initial={{ stage: entryEdit.entry.stage, dateKey: toDateKey(entryEdit.entry.date), note: entryEdit.entry.note }}
          submitLabel="บันทึกการแก้ไข"
          onSave={input => saveEntryEdit(entryEdit.batch, entryEdit.entry, { stage: input.stage, date: dateKeyToISO(input.dateKey), note: input.note })}
        />
      )}
      {batchEdit && (
        <BatchEditSheet
          batch={batchEdit}
          onClose={() => setBatchEdit(null)}
          onSave={changes => updateBatch(plot.id, tree.id, batchEdit.id, changes)}
          onDelete={() => {
            const removed = batchEdit
            deleteBatch(plot.id, tree.id, removed.id)
            toast("ลบรุ่นแล้ว", { action: { label: "เลิกทำ", onClick: () => updateTree(plot.id, tree.id, { batches: tree.batches }) } })
          }}
        />
      )}
      <TreeEditSheet open={editOpen} onOpenChange={setEditOpen} tree={tree} onSave={changes => { updateTree(plot.id, tree.id, changes); toast.success("บันทึกข้อมูลต้นแล้ว") }} />
      <ActivityFormSheet
        open={careOpen}
        onOpenChange={setCareOpen}
        plots={[plot]}
        defaults={{ plotId: plot.id, treeId: tree.id }}
        lockLocation
        onSave={(draft, { addExpense }) => {
          saveActivityWithExpense(draft, addExpense, addActivity, addFinance)
          toast.success(`บันทึก${ACTIVITY_LABELS[draft.activityType]}ต้น ${tree.treeNumber} แล้ว`)
        }}
      />
      <ConfirmDialog
        open={confirmDeleteTree}
        onOpenChange={setConfirmDeleteTree}
        title={`ลบต้น ${tree.treeNumber}?`}
        description="ประวัติรุ่นดอก/ผลของต้นนี้จะถูกลบด้วย และกู้คืนไม่ได้"
        confirmLabel="ลบต้น"
        onConfirm={() => { deleteTree(plot.id, tree.id); onBack() }}
      />
    </div>
  )
}

function BatchCard({ batch, harvestDays, defaultOpen, onFruitChange, onEdit, onEditEntry, onRemoveEntry }: {
  batch: FlowerBatch
  harvestDays: number
  defaultOpen: boolean
  onFruitChange: (n: number) => void
  onEdit: () => void
  onEditEntry: (entry: BatchStage) => void
  onRemoveEntry: (entry: BatchStage) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirmEntry, setConfirmEntry] = useState<BatchStage | null>(null)
  const latest = batch.stages[0]
  const bloomKey = batch.bloomDate ? toDateKey(batch.bloomDate) : null
  const harvestKey = bloomKey ? addDaysToKey(bloomKey, harvestDays) : null
  const elapsed = bloomKey ? daysBetween(bloomKey, todayKey()) : 0
  const remaining = harvestKey ? daysBetween(todayKey(), harvestKey) : 0
  const progress = bloomKey ? Math.min(1, Math.max(0, elapsed / harvestDays)) : 0

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><DurianIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-foreground">{batch.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {latest ? `${FLOWER_STAGE_LABELS[latest.stage]} · ${formatThaiDate(latest.date)}` : "ยังไม่มีระยะ"}
          </p>
        </div>
        <button type="button" onClick={onEdit} aria-label={`แก้ไข${batch.name}`} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
          <Pencil size={16} />
        </button>
      </div>

      {/* Harvest forecast */}
      <div className="px-4 pt-3">
        {harvestKey ? (
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-400/10">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200"><CalendarClock size={16} /> คาดเก็บเกี่ยว {formatThaiDate(harvestKey, { year: true })}</span>
              <span className="shrink-0 font-black text-amber-800 dark:text-amber-200">{remaining > 0 ? `อีก ${remaining} วัน` : "ถึงกำหนดแล้ว"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-400/20">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-amber-800/80 dark:text-amber-200/80">ดอกบาน {formatThaiDate(bloomKey!)} · ผ่านมา {Math.max(0, elapsed)} จาก ~{harvestDays} วัน (ค่าประมาณตามพันธุ์)</p>
          </div>
        ) : (
          <p className="rounded-xl bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">บันทึกระยะ “ดอกบาน” เพื่อให้ระบบคาดวันเก็บเกี่ยว</p>
        )}
      </div>

      {/* Fruit count */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-bold text-foreground">จำนวนผล</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onFruitChange(Math.max(0, batch.fruitCount - 1))} aria-label="ลดจำนวนผล" className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"><Minus size={16} /></button>
          <span className="min-w-14 text-center text-lg font-black tabular-nums text-foreground">{batch.fruitCount}</span>
          <button type="button" onClick={() => onFruitChange(batch.fruitCount + 1)} aria-label="เพิ่มจำนวนผล" className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"><Plus size={16} /></button>
          <span className="ml-1 text-sm text-muted-foreground">ลูก</span>
        </div>
      </div>

      {/* Timeline */}
      <button type="button" onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50">
        ประวัติระยะ ({batch.stages.length})
        <ChevronDown size={18} className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="space-y-0 px-4 pb-3">
          {batch.stages.map((entry, i) => (
            <li key={entry.id} className="relative flex gap-3 pl-1">
              <span className="flex flex-col items-center">
                <span className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                {i < batch.stages.length - 1 && <span className="w-0.5 flex-1 bg-border" />}
              </span>
              <button type="button" onClick={() => onEditEntry(entry)} className="min-w-0 flex-1 pb-3 text-left">
                <span className="block font-bold text-foreground">{FLOWER_STAGE_LABELS[entry.stage]}</span>
                <span className="block text-xs text-muted-foreground">{formatThaiDate(entry.date, { weekday: true, year: true })}</span>
                {entry.note && <span className="mt-0.5 block text-sm text-foreground/80">{entry.note}</span>}
              </button>
              <button type="button" onClick={() => setConfirmEntry(entry)} aria-label="ลบระยะนี้" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        open={confirmEntry !== null}
        onOpenChange={o => { if (!o) setConfirmEntry(null) }}
        title="ลบระยะนี้?"
        description={confirmEntry ? `${FLOWER_STAGE_LABELS[confirmEntry.stage]} · ${formatThaiDate(confirmEntry.date, { year: true })}` : undefined}
        onConfirm={() => { if (confirmEntry) onRemoveEntry(confirmEntry); setConfirmEntry(null) }}
      />
    </article>
  )
}

function BatchEditSheet({ batch, onClose, onSave, onDelete }: {
  batch: FlowerBatch
  onClose: () => void
  onSave: (changes: Partial<FlowerBatch>) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(batch.name)
  const [fruit, setFruit] = useState(String(batch.fruitCount))
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const save = () => {
    const n = validateText("ชื่อรุ่น", name, { required: true, maxLength: 120 })
    if (!n.ok) return setError(n.message)
    const f = validateNumber("จำนวนผล", Number(fruit || 0), { min: 0, max: 100000, integer: true })
    if (!f.ok) return setError(f.message)
    onSave({ name: n.value, fruitCount: f.value })
    onClose()
  }

  return (
    <>
      <RecordSheet
        open
        onOpenChange={o => { if (!o) onClose() }}
        title="แก้ไขรุ่น"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirm(true)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-destructive/30 px-3.5 text-destructive hover:bg-destructive/10" aria-label="ลบรุ่นนี้">
              <Trash2 size={18} />
            </button>
            <PrimaryButton onClick={save}>บันทึก</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="ชื่อรุ่น"><input value={name} onChange={e => setName(e.target.value)} className={inputClass} /></Field>
          <Field label="จำนวนผล (ลูก)"><input inputMode="numeric" value={fruit} onChange={e => setFruit(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass} /></Field>
          <FormError message={error} />
        </div>
      </RecordSheet>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`ลบ${batch.name}?`} description="ประวัติระยะทั้งหมดของรุ่นนี้จะถูกลบ" onConfirm={() => { onDelete(); onClose() }} />
    </>
  )
}
