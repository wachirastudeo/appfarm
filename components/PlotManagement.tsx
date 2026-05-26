"use client"
import { useRef, useState } from "react"
import {
  Plot, Tree, FlowerStage, DurianVariety,
  FLOWER_STAGE_LABELS, FLOWER_STAGES, VARIETIES,
  useAppData
} from "@/lib/store"
import { validateDate, validateNumber, validateText } from "@/lib/form-validation"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import {
  Plus, Pencil, Trash2, QrCode, RefreshCw, X, Check,
  ChevronRight, ArrowLeft,
  History, CalendarDays, Printer
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import DurianIcon from "./DurianIcon"

type AppDataReturn = ReturnType<typeof useAppData>

interface Props {
  data: AppDataReturn["data"]
  addPlot: AppDataReturn["addPlot"]
  updatePlot: AppDataReturn["updatePlot"]
  deletePlot: AppDataReturn["deletePlot"]
  addTree: AppDataReturn["addTree"]
  updateTree: AppDataReturn["updateTree"]
  deleteTree: AppDataReturn["deleteTree"]
  bulkUpdateTrees: AppDataReturn["bulkUpdateTrees"]
  addActivity: AppDataReturn["addActivity"]
  addBatch: AppDataReturn["addBatch"]
  addBatchStage: AppDataReturn["addBatchStage"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
}

const HEALTH_LABELS = { good: "ดี", fair: "พอใช้", poor: "ไม่ดี" }
const HEALTH_BG = { good: "bg-emerald-50 text-emerald-700", fair: "bg-amber-50 text-amber-700", poor: "bg-red-50 text-red-700" }
const STAGE_BADGE: Record<string, string> = {
  vegetative: "bg-green-100 text-green-700",
  egg_fish: "bg-yellow-100 text-yellow-700",
  nail: "bg-amber-100 text-amber-700",
  mouse_foot: "bg-orange-100 text-orange-700",
  eggplant: "bg-lime-100 text-lime-700",
  bracelet: "bg-emerald-100 text-emerald-700",
  white_flower: "bg-teal-100 text-teal-700",
  bloom: "bg-blue-100 text-blue-700",
  rat_tail: "bg-indigo-100 text-indigo-700",
  chicken_egg: "bg-violet-100 text-violet-700",
  expanding: "bg-purple-100 text-purple-700",
  harvest: "bg-primary/15 text-primary",
  dormant: "bg-muted text-muted-foreground",
}

function getNextTreeNumber(trees: Tree[], offset = 0) {
  const parsed = trees
    .map(tree => {
      const match = tree.treeNumber.match(/^(.*?)(\d+)$/)
      return match ? { prefix: match[1], number: Number(match[2]), width: match[2].length } : null
    })
    .filter((item): item is { prefix: string; number: number; width: number } => Boolean(item))
    .sort((a, b) => b.number - a.number)[0]

  if (!parsed) return `T-${String(offset + 1).padStart(3, "0")}`
  const nextNumber = parsed.number + offset + 1
  return `${parsed.prefix}${String(nextNumber).padStart(parsed.width, "0")}`
}

function getTreeNumberFromBase(base: string, offset: number) {
  if (offset === 0) return base
  const match = base.match(/^(.*?)(\d+)$/)
  if (!match) return `${base}-${offset + 1}`
  return `${match[1]}${String(Number(match[2]) + offset).padStart(match[2].length, "0")}`
}

// ---- Modals ----
function SelectionUpdateModal({ plot, selectedIds, onClose, onUpdate }: {
  plot: Plot; selectedIds: Set<string>; onClose: () => void; onUpdate: (changes: Partial<Tree>, batchData?: { name: string; stage: FlowerStage; date: string; note: string } | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<FlowerStage>(plot.trees[0]?.stage ?? "vegetative")
  const [health, setHealth] = useState<Tree["health"]>(plot.trees[0]?.health ?? "good")
  const [variety, setVariety] = useState<DurianVariety>(plot.trees[0]?.variety ?? "หมอนทอง")
  const [notes, setNotes] = useState("")
  const [updateStage, setUpdateStage] = useState(true)
  const [updateHealth, setUpdateHealth] = useState(false)
  const [updateVariety, setUpdateVariety] = useState(false)
  const [updateNotes, setUpdateNotes] = useState(false)
  const [addBatchToo, setAddBatchToo] = useState(false)
  const [batchName, setBatchName] = useState(`รุ่นที่ 1`)
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0])
  const [batchNote, setBatchNote] = useState("")
  const count = selectedIds.size

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  const handleUpdate = () => {
    const checkedNotes = validateText("หมายเหตุ", notes, { maxLength: 500, allowMultiline: true })
    const checkedBatchName = validateText("ชื่อรุ่น", batchName, { required: addBatchToo, maxLength: 120 })
    const checkedBatchDate = validateDate("วันที่บันทึกรุ่น", batchDate)
    const checkedBatchNote = validateText("บันทึกรุ่น", batchNote, { maxLength: 500 })
    if ((updateNotes && !checkedNotes.ok) || (addBatchToo && (!checkedBatchName.ok || !checkedBatchDate.ok || !checkedBatchNote.ok))) {
      const invalid = !checkedNotes.ok ? checkedNotes : !checkedBatchName.ok ? checkedBatchName : !checkedBatchDate.ok ? checkedBatchDate : checkedBatchNote
      alert(invalid.message)
      return
    }
    const changes: Partial<Tree> = {}
    if (updateStage) changes.stage = stage
    if (updateHealth) changes.health = health
    if (updateVariety) changes.variety = variety
    if (updateNotes) changes.notes = checkedNotes.value
    if (Object.keys(changes).length > 0 || addBatchToo) {
      onUpdate(changes, addBatchToo ? { name: checkedBatchName.value, stage, date: checkedBatchDate.value, note: checkedBatchNote.value } : null)
    }
    onClose()
  }

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-[95%] sm:max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] dark:bg-[#1D3A29]/40 flex items-center justify-center">
              <RefreshCw size={20} className="text-[#146B3E] dark:text-[#72C08A]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground leading-tight">อัปเดตต้นที่เลือก</h3>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-wider">{count} ต้นที่เลือก</p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="p-2 hover:bg-muted dark:hover:bg-[#1D3A29] rounded-full transition-colors"><X size={16} className="text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          {/* Stage */}
          <div className={`rounded-2xl p-4 border transition-colors ${updateStage ? "bg-[#F7FAF8] dark:bg-[#0B140F] border-[#B9DCC8] dark:border-[#31533D]" : "bg-muted/10 border-border/20 opacity-60"}`}>
            <label className="flex items-center gap-2 cursor-pointer mb-3 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
              <input type="checkbox" checked={updateStage} onChange={e => setUpdateStage(e.target.checked)} className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded" />
              <span>ระยะดอก/ผล</span>
            </label>
            <select value={stage} onChange={e => setStage(e.target.value as FlowerStage)} disabled={!updateStage}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400 disabled:opacity-50">
              {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          {/* Health */}
          <div className={`rounded-2xl p-4 border transition-colors ${updateHealth ? "bg-[#F7FAF8] dark:bg-[#0B140F] border-[#B9DCC8] dark:border-[#31533D]" : "bg-muted/10 border-border/20 opacity-60"}`}>
            <label className="flex items-center gap-2 cursor-pointer mb-3 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
              <input type="checkbox" checked={updateHealth} onChange={e => setUpdateHealth(e.target.checked)} className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded" />
              <span>สุขภาพต้น</span>
            </label>
            <div className="flex gap-2">
              {(["good", "fair", "poor"] as Tree["health"][]).map(h => (
                <button key={h} type="button" disabled={!updateHealth} onClick={() => setHealth(h)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${health === h && updateHealth ? "bg-primary text-primary-foreground border-primary dark:bg-[#72C08A] dark:text-[#0B1B12] dark:border-[#72C08A] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10" : "border-[#B9DCC8] dark:border-[#31533D] text-[#527060] dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]"}`}>
                  {HEALTH_LABELS[h]}
                </button>
              ))}
            </div>
          </div>
          {/* Variety */}
          <div className={`rounded-2xl p-4 border transition-colors ${updateVariety ? "bg-[#F7FAF8] dark:bg-[#0B140F] border-[#B9DCC8] dark:border-[#31533D]" : "bg-muted/10 border-border/20 opacity-60"}`}>
            <label className="flex items-center gap-2 cursor-pointer mb-3 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
              <input type="checkbox" checked={updateVariety} onChange={e => setUpdateVariety(e.target.checked)} className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded" />
              <span>พันธุ์</span>
            </label>
            <select value={variety} onChange={e => setVariety(e.target.value as DurianVariety)} disabled={!updateVariety}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400 disabled:opacity-50">
              {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {/* Notes */}
          <div className={`rounded-2xl p-4 border transition-colors ${updateNotes ? "bg-[#F7FAF8] dark:bg-[#0B140F] border-[#B9DCC8] dark:border-[#31533D]" : "bg-muted/10 border-border/20 opacity-60"}`}>
            <label className="flex items-center gap-2 cursor-pointer mb-3 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
              <input type="checkbox" checked={updateNotes} onChange={e => setUpdateNotes(e.target.checked)} className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded" />
              <span>หมายเหตุ</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={!updateNotes} rows={2}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400 disabled:opacity-50"
              placeholder="บันทึกเพิ่มเติม..." />
          </div>
          {/* Batch */}
          <div className={`rounded-2xl p-4 border transition-colors ${addBatchToo ? "bg-[#E7F3EC]/40 dark:bg-[#1D3A29]/20 border-[#B9DCC8] dark:border-[#31533D]" : "bg-muted/10 border-border/20 opacity-60"}`}>
            <label className="flex items-center gap-2 cursor-pointer mb-3 text-xs font-black text-[#146B3E] dark:text-[#72C08A]">
              <input type="checkbox" checked={addBatchToo} onChange={e => setAddBatchToo(e.target.checked)} className="h-4 w-4 accent-[#146B3E] dark:accent-[#72C08A] rounded" />
              <span>บันทึกรุ่นดอก/ผลด้วย</span>
            </label>
            {addBatchToo && (
              <div className="space-y-2">
                <input value={batchName} onChange={e => setBatchName(e.target.value)}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  placeholder="ชื่อรุ่น เช่น รุ่นที่ 1" />
                <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" />
                <input value={batchNote} onChange={e => setBatchNote(e.target.value)}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)" />
                <p className="text-[10px] text-muted-foreground font-semibold">ระยะจะใช้ค่าเดียวกับ &quot;ระยะดอก/ผล&quot; ด้านบน</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} type="button" className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]">ยกเลิก</button>
          <button onClick={handleUpdate} type="button" disabled={!updateStage && !updateHealth && !updateVariety && !updateNotes && !addBatchToo}
            className="flex-2 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10 flex items-center justify-center gap-2 disabled:opacity-40">
            <Check size={14} strokeWidth={3} />อัปเดต {count} ต้น
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkUpdateModal({ plot, onClose, onUpdate }: {
  plot: Plot; onClose: () => void; onUpdate: (stage: FlowerStage) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<FlowerStage>(plot.trees[0]?.stage ?? "vegetative")

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-[95%] sm:max-w-md shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] dark:bg-[#1D3A29]/40 flex items-center justify-center">
              <RefreshCw size={20} className="text-[#146B3E] dark:text-[#72C08A]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground leading-tight">อัปเดตทั้งแปลง</h3>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-wider">{plot.name} • {plot.trees.length} ต้น</p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="p-2 hover:bg-muted dark:hover:bg-[#1D3A29] rounded-full transition-colors"><X size={16} className="text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">
          <div className="bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-2xl p-4">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">เลือกระยะที่ต้องการเปลี่ยน</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value as FlowerStage)}
              className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
            >
              {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
            </select>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-sm">!</div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
              การอัปเดตนี้นี้จะเปลี่ยนระยะของทุเรียน **ทุกต้น** ในแปลงนี้ให้เป็นระยะเดียวกัน
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} type="button" className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]">ยกเลิก</button>
          <button
            onClick={() => { onUpdate(stage); onClose() }}
            type="button"
            className="flex-2 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10 flex items-center justify-center gap-2"
          >
            <Check size={14} strokeWidth={3} />อัปเดตเลย
          </button>
        </div>
      </div>
    </div>
  )
}

function QRModal({ tree, plot, onClose }: { tree: Tree; plot: Plot; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrData = JSON.stringify({ plotId: plot.id, plotName: plot.name, treeId: tree.id, treeNumber: tree.treeNumber, variety: tree.variety })

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl orchard-card" onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-base text-foreground mb-1">QR Code ต้นทุเรียน</h3>
        <p className="text-muted-foreground text-xs font-bold mb-4">{plot.name} · {tree.treeNumber}</p>
        <div className="bg-white p-4 rounded-2xl inline-block mb-4 border border-[#B9DCC8] dark:border-[#31533D]/60 shadow-inner">
          <QRCodeSVG value={qrData} size={180} />
        </div>
        <p className="text-xs text-muted-foreground font-black">{tree.variety} · อายุ {tree.age} ปี</p>
        <button onClick={onClose} type="button" className="mt-5 w-full border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-muted-foreground dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 hover:text-foreground font-black transition-all">ปิด</button>
      </div>
    </div>
  )
}

function AllQRModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-print-root, #qr-print-root * {
            visibility: visible;
          }
          #qr-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
            padding: 20px !important;
            background: white !important;
          }
          .print-hide {
            display: none !important;
          }
          html, body, main, div {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          .fixed, .absolute, .sticky {
            position: static !important;
            transform: none !important;
          }
          .qr-print-item {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px dashed #e2e8f0 !important;
            padding: 16px !important;
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 print-hide" onClick={onClose}>
        <div className="bg-card border border-border dark:border-[#31533D]/60 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl orchard-card" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-[#B9DCC8] dark:border-[#31533D]/60 flex justify-between items-center bg-muted/20 dark:bg-[#14291E]/30 rounded-t-[2.5rem] shrink-0 print-hide">
            <div>
              <h3 className="font-black text-lg text-foreground flex items-center gap-2"><QrCode size={20} className="text-primary dark:text-[#72C08A]" /> พิมพ์ QR Code ทั้งแปลง</h3>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">{plot.name} · มีทั้งหมด {plot.trees.length} ต้น</p>
            </div>
            <button onClick={onClose} type="button" className="p-2 bg-background border border-[#B9DCC8] dark:border-[#31533D] rounded-full text-muted-foreground hover:text-foreground transition-all">
              <X size={18} />
            </button>
          </div>
          <div id="qr-print-root" className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 bg-white dark:bg-[#102018]">
            {plot.trees.map(tree => {
              const qrData = JSON.stringify({ plotId: plot.id, plotName: plot.name, treeId: tree.id, treeNumber: tree.treeNumber, variety: tree.variety })
              return (
                <div key={tree.id} className="qr-print-item p-4 flex flex-col items-center justify-center text-center border border-[#B9DCC8]/40 dark:border-[#31533D]/40 rounded-2xl bg-muted/10 dark:bg-muted/5">
                  <h4 className="font-bold text-[10px] text-muted-foreground uppercase mb-1">QR Code ต้นทุเรียน</h4>
                  <p className="font-black text-lg mb-3 text-foreground">{tree.treeNumber}</p>
                  <div className="bg-white p-2 rounded-xl mb-3 inline-block shadow-sm">
                    <QRCodeSVG value={qrData} size={120} />
                  </div>
                  <p className="text-xs font-black text-muted-foreground">{plot.name} · {tree.variety}</p>
                </div>
              )
            })}
          </div>
          <div className="p-6 border-t border-[#B9DCC8] dark:border-[#31533D]/60 bg-muted/20 dark:bg-[#14291E]/30 rounded-b-[2.5rem] shrink-0 print-hide">
            <button onClick={() => window.print()} type="button" className="w-full bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]">
              <Printer size={18} /> สั่งพิมพ์ QR Code
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function TreeForm({ tree, existingTrees = [], onSave, onSaveMany, onCancel }: {
  plotId: string; tree?: Tree
  existingTrees?: Tree[]
  onSave: (data: Omit<Tree, "id" | "lastUpdated">) => void
  onSaveMany?: (items: Omit<Tree, "id" | "lastUpdated">[]) => void
  onCancel: () => void
}) {
  const isAdding = !tree
  const [form, setForm] = useState({
    treeNumber: tree?.treeNumber ?? "",
    variety: (tree?.variety ?? "หมอนทอง") as DurianVariety,
    age: String(tree?.age ?? 5),
    stage: (tree?.stage ?? "vegetative") as FlowerStage,
    health: (tree?.health ?? "good") as Tree["health"],
    notes: tree?.notes ?? "",
    batches: tree?.batches ?? [],
  })
  const [addCount, setAddCount] = useState("1")
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = () => {
    const treeNumber = validateText("หมายเลขต้น", form.treeNumber, { required: !isAdding, maxLength: 80 })
    const ageVal = form.age === "" ? 0 : Number(form.age)
    const age = validateNumber("อายุ", ageVal, { min: 1, max: 200, integer: true })
    const countVal = addCount === "" ? 0 : Number(addCount)
    const count = validateNumber("จำนวนต้นที่เพิ่ม", countVal, { min: 1, max: 200, integer: true })
    const notes = validateText("บันทึก", form.notes, { maxLength: 500, allowMultiline: true })
    if (!treeNumber.ok || !age.ok || !count.ok || !notes.ok) {
      const invalid = !treeNumber.ok ? treeNumber : !age.ok ? age : !count.ok ? count : notes
      alert(invalid.message)
      return
    }
    const checkedForm = { ...form, treeNumber: treeNumber.value, age: age.value, notes: notes.value }
    if (!isAdding) {
      onSave(checkedForm)
      return
    }

    const baseTree = checkedForm
    const items = Array.from({ length: count.value }, (_, index) => ({
      ...baseTree,
      treeNumber: baseTree.treeNumber ? getTreeNumberFromBase(baseTree.treeNumber, index) : getNextTreeNumber(existingTrees, index),
      batches: [],
    }))

    if (onSaveMany) {
      onSaveMany(items)
    } else {
      items.forEach(onSave)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">หมายเลขต้น</label>
          <input value={form.treeNumber} onChange={e => set("treeNumber", e.target.value)}
            className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" placeholder={isAdding ? getNextTreeNumber(existingTrees) : "A-001"} />
          {isAdding && <p className="mt-1 text-[9px] font-semibold text-muted-foreground">เว้นว่างเพื่อรันเลขต่ออัตโนมัติ</p>}
        </div>
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">อายุ (ปี)</label>
          <input
            type="text"
            value={form.age === "0" ? "" : form.age}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, "")
              set("age", val)
            }}
            className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
            placeholder="เช่น 5"
          />
        </div>
      </div>
      {isAdding && (
        <div>
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">จำนวนต้นที่เพิ่ม</label>
          <input
            type="text"
            value={addCount === "0" ? "" : addCount}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, "")
              setAddCount(val)
            }}
            className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
            placeholder="เช่น 1"
          />
        </div>
      )}
      <div>
        <label className="text-[10px] font-black text-muted-foreground mb-1 block font-bold">พันธุ์</label>
        <select value={form.variety} onChange={e => set("variety", e.target.value)}
          className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400">
          {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black text-muted-foreground mb-1 block font-bold">ระยะปัจจุบัน</label>
        <select value={form.stage} onChange={e => set("stage", e.target.value)}
          className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400">
          {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black text-muted-foreground mb-1 block font-bold">สุขภาพต้น</label>
        <div className="flex gap-2">
          {(["good", "fair", "poor"] as Tree["health"][]).map(h => (
            <button key={h} type="button" onClick={() => set("health", h)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${form.health === h ? "bg-primary text-primary-foreground border-primary dark:bg-[#72C08A] dark:text-[#0B1B12] dark:border-[#72C08A] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10" : "border-[#B9DCC8] dark:border-[#31533D] text-[#527060] dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]"}`}>
              {HEALTH_LABELS[h]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black text-muted-foreground mb-1 block font-bold">บันทึก</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
          className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" placeholder="บันทึกเพิ่มเติม..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} type="button" className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]">ยกเลิก</button>
        <button onClick={handleSave} type="button"
          className="flex-1 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] transition-all active:scale-[0.98] shadow-md shadow-primary/10 dark:shadow-[#72C08A]/10">บันทึก</button>
      </div>
    </div>
  )
}

// ---- Tree Detail View ----
function TreeDetailView({
  tree, plot, activities, onBack, updateTree, addActivity,
  addBatch, addBatchStage, updateBatch, deleteBatch
}: {
  tree: Tree; plot: Plot; activities: any[]; onBack: () => void;
  updateTree: (pId: string, tId: string, changes: Partial<Tree>) => void
  addActivity: (act: any) => void
  addBatch: AppDataReturn["addBatch"]
  addBatchStage: AppDataReturn["addBatchStage"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [activeBatchIdForStage, setActiveBatchIdForStage] = useState<string | null>(null)
  const [activeBatchIdForEdit, setActiveBatchIdForEdit] = useState<string | null>(null)
  const [activeStageIdForEdit, setActiveStageIdForEdit] = useState<string | null>(null)
  const [collapsedBatches, setCollapsedBatches] = useState<Record<string, boolean>>({})
  const [stageForm, setStageForm] = useState<{ stage: FlowerStage, date: string, note: string }>({ stage: 'vegetative', date: new Date().toISOString().split('T')[0], note: '' })
  const [batchForm, setBatchForm] = useState({ name: '', fruitCount: '' })
  const [showAddBatchForm, setShowAddBatchForm] = useState(false)
  const [quickBatchForm, setQuickBatchForm] = useState({
    name: `รุ่นที่ 1`,
    stage: 'egg_fish' as FlowerStage,
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const treeActivities = activities.filter(a => a.treeId === tree.id)

  const handleQuickAddBatch = () => {
    const name = validateText("ชื่อรุ่น", quickBatchForm.name, { maxLength: 120 })
    const date = validateDate("วันที่บันทึก", quickBatchForm.date)
    const note = validateText("บันทึกเพิ่มเติม", quickBatchForm.note, { maxLength: 500 })
    if (!name.ok || !date.ok || !note.ok) {
      const invalid = !name.ok ? name : !date.ok ? date : note
      alert(invalid.message)
      return
    }
    const batchName = name.value || `รุ่นที่ ${(tree.batches?.length || 0) + 1}`
    const batchId = `b${Date.now()}`
    const stageId = `s${Date.now() + 1}`
    const stageDate = new Date(date.value).toISOString()
    const newBatch = {
      id: batchId,
      name: batchName,
      fruitCount: 0,
      bloomDate: quickBatchForm.stage === 'bloom' ? stageDate : undefined,
      stages: [{ id: stageId, stage: quickBatchForm.stage, date: stageDate, note: note.value }],
    }
    updateTree(plot.id, tree.id, {
      stage: quickBatchForm.stage,
      batches: [...(tree.batches || []), newBatch],
    })
    setShowAddBatchForm(false)
    setQuickBatchForm({ name: `รุ่นที่ ${(tree.batches?.length || 0) + 2}`, stage: 'egg_fish', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const handleSaveBatch = (batchId: string) => {
    const name = validateText("ชื่อรุ่น", batchForm.name, { required: true, maxLength: 120 })
    const fruitCountVal = batchForm.fruitCount === "" ? 0 : Number(batchForm.fruitCount)
    const fruitCount = validateNumber("จำนวนผลผลิต", fruitCountVal, { min: 0, max: 100000, integer: true })
    if (!name.ok || !fruitCount.ok) {
      alert(!name.ok ? name.message : fruitCount.message)
      return
    }
    updateBatch(plot.id, tree.id, batchId, { name: name.value, fruitCount: fruitCount.value })
    setActiveBatchIdForEdit(null)
  }

  const handleSaveStage = (batchId: string, stageId?: string) => {
    const date = validateDate("วันที่บันทึกระยะ", stageForm.date)
    const note = validateText("บันทึกเพิ่มเติม", stageForm.note, { maxLength: 500 })
    if (!date.ok || !note.ok) {
      alert(!date.ok ? date.message : note.message)
      return
    }
    const nextStage = { stage: stageForm.stage, date: new Date(date.value).toISOString(), note: note.value }
    if (!stageId) {
      addBatchStage(plot.id, tree.id, batchId, nextStage)
      setActiveBatchIdForStage(null)
      return
    }
    const batch = tree.batches.find(item => item.id === batchId)
    if (!batch) return
    updateBatch(plot.id, tree.id, batchId, {
      stages: batch.stages.map(stage => stage.id === stageId ? { ...stage, ...nextStage } : stage)
    })
    setActiveStageIdForEdit(null)
  }

  const updateStageAndLog = (stage: FlowerStage) => {
    if (tree.stage === stage) return;
    updateTree(plot.id, tree.id, { stage });
    addActivity({
      date: new Date().toISOString(),
      plotId: plot.id,
      treeId: tree.id,
      activityType: "inspect",
      description: `เปลี่ยนระยะเป็น: ${FLOWER_STAGE_LABELS[stage]}`,
      cost: 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Tree Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onBack} type="button" className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-[#72C08A]/10 dark:hover:text-[#72C08A] transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-[#72C08A]/10 flex items-center justify-center shrink-0">
            <DurianIcon className="h-7 w-7 text-primary dark:text-[#72C08A]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground leading-tight">ต้น {tree.treeNumber}</h2>
            <p className="text-muted-foreground text-xs font-bold mt-0.5">{plot.name} · {tree.variety} · อายุ {tree.age} ปี</p>
          </div>
        </div>
        <button onClick={() => setShowEdit(!showEdit)} type="button" className={`p-2.5 rounded-xl transition-colors ${showEdit ? 'bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12]' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-[#72C08A]/10 dark:hover:text-[#72C08A]'}`}>
          <Pencil size={16} />
        </button>
      </div>

      {/* Stats row */}
      {!showEdit && (
        <div className="flex gap-4 w-full">
          <div className="flex-1 rounded-2xl p-4 flex items-center justify-between orchard-card">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-black">สุขภาพ</span>
            <span className="font-black text-sm text-foreground">{HEALTH_LABELS[tree.health]}</span>
          </div>
          <div className="flex-1 rounded-2xl p-4 flex items-center justify-between orchard-card">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-black">ระยะดอก</span>
            <span className="font-black text-sm text-foreground">{tree.stage === 'vegetative' ? 'ไม่มี' : FLOWER_STAGE_LABELS[tree.stage]}</span>
          </div>
        </div>
      )}

      {showEdit ? (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <TreeForm
            plotId={plot.id}
            tree={tree}
            onSave={d => { updateTree(plot.id, tree.id, d); setShowEdit(false) }}
            onCancel={() => setShowEdit(false)}
          />
        </div>
      ) : (
        <>
          {/* Batch Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-foreground text-base flex items-center gap-2">
                รุ่นดอก/ผล ({tree.batches?.length || 0})
              </h4>
              {!showAddBatchForm && (
                <button
                  onClick={() => { setShowAddBatchForm(true); setQuickBatchForm(f => ({ ...f, name: `รุ่นที่ ${(tree.batches?.length || 0) + 1}` })) }}
                  type="button"
                  className="flex items-center gap-2 bg-[#E7F3EC] dark:bg-[#1D3A29] text-[#146B3E] dark:text-[#72C08A] px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} /> เพิ่มรุ่น
                </button>
              )}
            </div>

            {/* Quick Add Batch Form */}
            {showAddBatchForm && (
              <div className="bg-[#E7F3EC] dark:bg-[#1D3A29]/30 border border-[#B9DCC8] dark:border-[#31533D]/60 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider">บันทึกรุ่นใหม่</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#527060] dark:text-[#B8D1C0] mb-1 block uppercase">ชื่อรุ่น</label>
                    <input
                      value={quickBatchForm.name}
                      onChange={e => setQuickBatchForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-white dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                      placeholder="เช่น รุ่นที่ 1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#527060] dark:text-[#B8D1C0] mb-1 block uppercase">วันที่บันทึก</label>
                    <input
                      type="date"
                      value={quickBatchForm.date}
                      onChange={e => setQuickBatchForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full bg-white dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#527060] dark:text-[#B8D1C0] mb-1 block uppercase">ระยะปัจจุบัน</label>
                  <select
                    value={quickBatchForm.stage}
                    onChange={e => setQuickBatchForm(f => ({ ...f, stage: e.target.value as FlowerStage }))}
                    className="w-full bg-white dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  >
                    {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#527060] dark:text-[#B8D1C0] mb-1 block uppercase">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
                  <input
                    value={quickBatchForm.note}
                    onChange={e => setQuickBatchForm(f => ({ ...f, note: e.target.value }))}
                    className="w-full bg-white dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                    placeholder="เช่น ออกดอก 80%"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowAddBatchForm(false)} type="button" className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] bg-white dark:bg-[#14291E] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-bold hover:bg-muted transition-colors">ยกเลิก</button>
                  <button onClick={handleQuickAddBatch} type="button" className="flex-1 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Plus size={14} /> บันทึกรุ่น
                  </button>
                </div>
              </div>
            )}

            {(!tree.batches || tree.batches.length === 0) && !showAddBatchForm ? (
              <button
                onClick={() => { setShowAddBatchForm(true); setQuickBatchForm(f => ({ ...f, name: 'รุ่นที่ 1' })) }}
                type="button"
                className="w-full bg-card border-2 border-dashed border-[#B9DCC8] dark:border-[#31533D]/60 rounded-xl p-6 text-center hover:border-primary/50 dark:hover:border-[#72C08A]/50 hover:bg-[#E7F3EC]/40 dark:hover:bg-[#1D3A29]/20 transition-all group"
              >
                <Plus size={24} className="mx-auto mb-2 text-[#B9DCC8] dark:text-[#31533D]/80 group-hover:text-primary dark:group-hover:text-[#72C08A] transition-colors" />
                <p className="text-xs font-black text-muted-foreground group-hover:text-primary dark:group-hover:text-[#72C08A] transition-colors">แตะเพื่อบันทึกรุ่นดอก/ผลแรก</p>
              </button>
            ) : (
              <div className="space-y-4">
                {tree.batches.map(batch => {
                  const latestStage = batch.stages[0]
                  const bloomDate = batch.bloomDate ? new Date(batch.bloomDate) : null
                  const harvestDate = bloomDate ? new Date(bloomDate.getTime() + 120 * 86400000) : null

                  return (
                    <div key={batch.id} className="bg-card border border-border dark:border-[#31533D]/50 border-l-4 border-l-[#146B3E] dark:border-l-[#72C08A] rounded-2xl p-4 shadow-sm relative orchard-card">
                      {activeBatchIdForEdit === batch.id ? (
                        <div className="bg-[#F7FAF8] dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-2xl p-4 mb-4">
                          <p className="text-xs font-black text-foreground mb-2 uppercase">แก้ไขข้อมูลรุ่น</p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase">ชื่อรุ่น</label>
                              <input value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })} className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" placeholder="เช่น รุ่นที่ 1" />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase">จำนวนผลผลิต</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={batchForm.fruitCount}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, "")
                                    setBatchForm({ ...batchForm, fruitCount: val })
                                  }}
                                  className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400 pr-10"
                                  placeholder="0"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">ลูก</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => setActiveBatchIdForEdit(null)} type="button" className="flex-1 text-xs py-2.5 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl text-muted-foreground dark:text-[#B8D1C0] hover:bg-muted font-bold transition-all">ยกเลิก</button>
                            <button onClick={() => handleSaveBatch(batch.id)} type="button" className="flex-1 text-xs py-2.5 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl font-black transition-all">บันทึก</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-sm text-foreground">{batch.name}</h5>
                            <button onClick={() => { setBatchForm({ name: batch.name, fruitCount: String(batch.fruitCount) }); setActiveBatchIdForEdit(batch.id) }} type="button" className="text-muted-foreground p-1 hover:text-[#146B3E] dark:hover:text-[#72C08A] transition-colors"><Pencil size={12} /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => deleteBatch(plot.id, tree.id, batch.id)} type="button" className="p-2 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                            <button onClick={() => setCollapsedBatches(prev => ({ ...prev, [batch.id]: !prev[batch.id] }))} type="button" className="p-2 rounded-xl text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] hover:text-[#146B3E] dark:hover:text-[#72C08A] transition-colors">
                              <ChevronRight size={18} className={`transition-transform duration-200 ${collapsedBatches[batch.id] ? '' : 'rotate-90'}`} />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={`transition-all duration-300 overflow-hidden ${collapsedBatches[batch.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>

                        <div className="flex items-center gap-3 mb-4">
                          {latestStage && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black leading-tight ${STAGE_BADGE[latestStage.stage]} shadow-sm`}>
                              {FLOWER_STAGE_LABELS[latestStage.stage]}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold">
                            <CalendarDays size={12} /> {latestStage ? new Date(latestStage.date).toLocaleDateString("th-TH") : '-'}
                          </span>
                          <span className="text-xs text-[#146B3E] dark:text-[#72C08A] font-black flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#146B3E] dark:bg-[#72C08A]" /> {batch.fruitCount} ลูก
                          </span>
                        </div>

                        {harvestDate && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs mb-4">
                            <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-[10px] shrink-0 font-black">!</div>
                            เก็บเกี่ยว: {harvestDate.toLocaleDateString("th-TH")}
                          </div>
                        )}

                        {/* Prediction Box */}
                        {bloomDate && (
                          <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 flex items-center gap-4 mb-4 backdrop-blur-sm">
                            <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                              <CalendarDays size={22} />
                            </div>
                            <div>
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">พยากรณ์วันเก็บเกี่ยว (120 วันหลังดอกบาน)</p>
                              <p className="text-base font-black text-amber-900 dark:text-amber-200 mt-0.5">{harvestDate?.toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                        )}

                        {/* Add next stage form */}
                        {activeBatchIdForStage === batch.id ? (
                          <div className="bg-[#F7FAF8] dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-2xl p-4 mb-6 space-y-3">
                            <p className="font-black text-xs text-foreground">บันทึกระยะใหม่</p>
                            <select value={stageForm.stage} onChange={e => setStageForm({ ...stageForm, stage: e.target.value as FlowerStage })} className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400">
                              {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                            </select>
                            <input type="date" value={stageForm.date} onChange={e => setStageForm({ ...stageForm, date: e.target.value })} className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" />
                            <input type="text" value={stageForm.note} onChange={e => setStageForm({ ...stageForm, note: e.target.value })} placeholder="บันทึกเพิ่มเติม (ตัวเลือก)" className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400" />
                            <div className="flex gap-2 pt-2">
                              <button onClick={() => setActiveBatchIdForStage(null)} type="button" className="flex-1 py-2 text-xs border border-[#B9DCC8] dark:border-[#31533D] rounded-xl text-muted-foreground dark:text-[#B8D1C0] hover:bg-muted font-bold transition-all">ยกเลิก</button>
                              <button onClick={() => handleSaveStage(batch.id)} type="button" className="flex-1 py-2 text-xs bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl font-black transition-all">บันทึก</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const nextIdx = FLOWER_STAGES.indexOf(latestStage?.stage || 'vegetative') + 1
                              const nextStage = FLOWER_STAGES[nextIdx] || 'harvest'
                              setStageForm({ stage: nextStage, date: new Date().toISOString().split('T')[0], note: '' })
                              setActiveBatchIdForStage(batch.id)
                            }}
                            type="button"
                            className="w-full border-2 border-dashed border-[#146B3E]/35 dark:border-[#72C08A]/30 rounded-2xl py-3 text-[#146B3E] dark:text-[#72C08A] font-black flex items-center justify-center gap-2 hover:bg-[#E7F3EC]/50 dark:hover:bg-[#1D3A29]/30 transition-all mb-6 text-xs"
                          >
                            <Plus size={16} /> บันทึกระยะถัดไป
                          </button>
                        )}

                        {/* Timeline History */}
                        <div className="space-y-4">
                          <p className="text-xs font-black text-foreground flex items-center gap-2">
                            <History size={14} className="text-muted-foreground" /> ประวัติระยะทั้งหมด
                          </p>
                          <div className="relative pl-6 space-y-4 border-l-2 border-l-[#B9DCC8] dark:border-l-[#31533D]/50 ml-2">
                            {batch.stages.map((st, idx) => (
                              <div key={st.id} className="relative">
                                <div className={`absolute -left-[1.65rem] top-1.5 w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#146B3E] dark:bg-[#72C08A]' : 'bg-[#54745f] dark:bg-[#B8D1C0]/60'}`} />
                                {activeStageIdForEdit === st.id ? (
                                  <div className="bg-[#F7FAF8] dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-2xl p-4 space-y-3">
                                    <select value={stageForm.stage} onChange={e => setStageForm({ ...stageForm, stage: e.target.value as FlowerStage })} className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground">
                                      {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                                    </select>
                                    <input type="date" value={stageForm.date} onChange={e => setStageForm({ ...stageForm, date: e.target.value })} className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground" />
                                    <input type="text" value={stageForm.note} onChange={e => setStageForm({ ...stageForm, note: e.target.value })} placeholder="บันทึกเพิ่มเติม" className="w-full bg-background dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground" />
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={() => setActiveStageIdForEdit(null)} type="button" className="flex-1 py-2 text-xs border border-[#B9DCC8] dark:border-[#31533D] rounded-xl text-muted-foreground dark:text-[#B8D1C0] font-bold">ยกเลิก</button>
                                      <button onClick={() => handleSaveStage(batch.id, st.id)} type="button" className="flex-1 py-2 text-xs bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl font-bold">บันทึก</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white/40 dark:bg-[#1D3A29]/10 border border-[#B9DCC8]/50 dark:border-[#31533D]/50 hover:bg-white/80 dark:hover:bg-[#1D3A29]/30 rounded-2xl p-3.5 flex items-center justify-between transition-all">
                                    <div>
                                      <p className="text-xs font-black text-foreground">{FLOWER_STAGE_LABELS[st.stage]}</p>
                                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{new Date(st.date).toLocaleDateString("th-TH")}</p>
                                      {st.note && <p className="text-xs font-medium text-muted-foreground mt-1.5">📝 {st.note}</p>}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <button onClick={() => {
                                        setStageForm({ stage: st.stage, date: st.date.split('T')[0], note: st.note || '' });
                                        setActiveStageIdForEdit(st.id);
                                      }} type="button" className="p-2 rounded-xl text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] hover:text-[#146B3E] dark:hover:text-[#72C08A] transition-colors"><Pencil size={14} /></button>
                                      <button onClick={() => {
                                        if (confirm("ลบระยะนี้?")) {
                                          updateBatch(plot.id, tree.id, batch.id, { stages: batch.stages.filter(s => s.id !== st.id) });
                                        }
                                      }} type="button" className="p-2 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button onClick={onBack} type="button" className="w-full bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-[2rem] py-4.5 font-black text-base shadow-xl shadow-primary/20 dark:shadow-[#72C08A]/10 flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98]">
              <Check size={20} strokeWidth={3} /> บันทึกข้อมูล
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function PlotDetailView({
  plot, activities, onBack, addTree, updateTree, deleteTree, bulkUpdateTrees, updatePlot, deletePlot,
  addActivity, addBatch, addBatchStage, updateBatch, deleteBatch
}: {
  plot: Plot; activities: any[]; onBack: () => void
  addTree: (plotId: string, tree: Omit<Tree, "id" | "lastUpdated">) => void
  updateTree: (plotId: string, treeId: string, changes: Partial<Tree>) => void
  deleteTree: (plotId: string, treeId: string) => void
  bulkUpdateTrees: (plotId: string, stage: FlowerStage) => void
  updatePlot: (plotId: string, changes: Partial<Plot>) => void
  deletePlot: (plotId: string) => void
  addActivity: (act: any) => void
  addBatch: AppDataReturn["addBatch"]
  addBatchStage: AppDataReturn["addBatchStage"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
}) {
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [addingTree, setAddingTree] = useState(false)
  const [editingTree, setEditingTree] = useState<string | null>(null)
  const [qrTree, setQrTree] = useState<Tree | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showAllQR, setShowAllQR] = useState(false)
  const [editingPlot, setEditingPlot] = useState(false)
  const [plotForm, setPlotForm] = useState({ name: plot.name, area: String(plot.area), notes: plot.notes ?? "" })
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSelectionUpdate, setShowSelectionUpdate] = useState(false)

  const toggleSelectTree = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === plot.trees.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(plot.trees.map(t => t.id)))
    }
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleSavePlot = () => {
    const name = validateText("ชื่อแปลง", plotForm.name, { required: true, maxLength: 120 })
    const areaVal = plotForm.area === "" ? 0 : Number(plotForm.area)
    const area = validateNumber("พื้นที่", areaVal, { min: 0.5, max: 100000 })
    const notes = validateText("บันทึก", plotForm.notes, { maxLength: 500 })
    if (!name.ok || !area.ok || !notes.ok) {
      const invalid = !name.ok ? name : !area.ok ? area : notes
      alert(invalid.message)
      return
    }
    updatePlot(plot.id, { name: name.value, area: area.value, notes: notes.value })
    setEditingPlot(false)
  }

  const selectedTree = plot.trees.find(t => t.id === selectedTreeId)

  if (selectedTree) {
    return (
      <TreeDetailView
        tree={selectedTree}
        plot={plot}
        activities={activities}
        onBack={() => setSelectedTreeId(null)}
        updateTree={updateTree}
        addActivity={addActivity}
        addBatch={addBatch}
        addBatchStage={addBatchStage}
        updateBatch={updateBatch}
        deleteBatch={deleteBatch}
      />
    )
  }

  const goodCount = plot.trees.filter(t => t.health === "good").length
  const fairCount = plot.trees.filter(t => t.health === "fair").length
  const poorCount = plot.trees.filter(t => t.health === "poor").length

  return (
    <div className="space-y-4">
      {showBulk && <BulkUpdateModal plot={plot} onClose={() => setShowBulk(false)} onUpdate={s => bulkUpdateTrees(plot.id, s)} />}
      {qrTree && <QRModal tree={qrTree} plot={plot} onClose={() => setQrTree(null)} />}
      {showAllQR && <AllQRModal plot={plot} onClose={() => setShowAllQR(false)} />}
      {showSelectionUpdate && (
        <SelectionUpdateModal
          plot={plot}
          selectedIds={selectedIds}
          onClose={() => setShowSelectionUpdate(false)}
          onUpdate={(changes, batchData) => {
            selectedIds.forEach(treeId => {
              if (Object.keys(changes).length > 0) updateTree(plot.id, treeId, changes)
              if (batchData) {
                const tree = plot.trees.find(t => t.id === treeId)
                if (!tree) return
                const batchId = `b${Date.now()}-${treeId.slice(-4)}`
                const stageId = `s${Date.now()}-${treeId.slice(-4)}`
                const stageDate = new Date(batchData.date).toISOString()
                const newBatch = {
                  id: batchId,
                  name: batchData.name,
                  fruitCount: 0,
                  bloomDate: batchData.stage === 'bloom' ? stageDate : undefined,
                  stages: [{ id: stageId, stage: batchData.stage, date: stageDate, note: batchData.note }],
                }
                updateTree(plot.id, treeId, { batches: [...(tree.batches || []), newBatch] })
              }
            })
            exitSelectMode()
          }}
        />
      )}

      {/* Plot Header */}
      <div className="pb-4 border-b border-border space-y-3">
        {/* Row 1: back + title + edit/delete */}
        <div className="flex items-start gap-2">
          <button onClick={onBack} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors mt-0.5 lg:hidden shrink-0">
            <ArrowLeft size={18} />
          </button>
          {editingPlot ? (
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={plotForm.name} onChange={e => setPlotForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="ชื่อแปลง" />
                <input
                  type="text"
                  value={plotForm.area}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9.]/g, "")
                    const parts = val.split(".")
                    if (parts.length > 2) {
                      val = parts[0] + "." + parts.slice(1).join("")
                    }
                    setPlotForm(f => ({ ...f, area: val }))
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="พื้นที่ (ไร่)"
                />
              </div>
              <input value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="บันทึกเพิ่มเติม" />
              <div className="flex gap-2">
                <button onClick={() => setEditingPlot(false)} className="flex-1 border border-border rounded-xl py-2.5 text-muted-foreground font-bold hover:bg-muted/50">ยกเลิก</button>
                <button onClick={handleSavePlot} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 font-bold hover:opacity-90">บันทึก</button>
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-foreground">{plot.name}</h2>
                <p className="text-sm text-muted-foreground font-medium mt-0.5 leading-relaxed">{plot.area} ไร่{plot.notes ? ` · ${plot.notes}` : ""}</p>
              </div>
              <button onClick={() => { setPlotForm({ name: plot.name, area: String(plot.area), notes: plot.notes ?? "" }); setEditingPlot(true) }} className="p-2.5 bg-muted text-primary rounded-2xl hover:bg-primary/10 transition-colors shrink-0">
                <Pencil size={18} />
              </button>
              <button onClick={() => { if (confirm(`ลบแปลง ${plot.name}? ต้นทุเรียนในแปลงนี้จะถูกลบด้วย`)) deletePlot(plot.id) }} className="p-2.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shrink-0">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
        {/* Row 2: action buttons (only when not editing) */}
        {!editingPlot && (
          <div className="flex flex-wrap gap-2 min-[430px]:flex-nowrap">
            {selectMode ? (
              <>
                <button onClick={toggleSelectAll} className="flex-1 min-h-10 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border-2 border-[#146B3E] text-[#146B3E] rounded-2xl text-sm font-black hover:bg-[#E7F3EC] transition-all">
                  {selectedIds.size === plot.trees.length ? "ยกเลิกทั้งหมด" : `เลือกทั้งหมด (${plot.trees.length})`}
                </button>
                <button onClick={() => selectedIds.size > 0 && setShowSelectionUpdate(true)} disabled={selectedIds.size === 0} className="flex-1 min-h-10 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#146B3E] text-white rounded-2xl text-sm font-black hover:bg-[#0F5A34] transition-all shadow-[0_8px_18px_rgba(47,170,98,0.28)] active:scale-95 disabled:opacity-40">
                  <RefreshCw size={16} strokeWidth={2.8} />{selectedIds.size > 0 ? `อัปเดต ${selectedIds.size} ต้น` : "อัปเดตที่เลือก"}
                </button>
                <button onClick={exitSelectMode} className="p-2.5 bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 transition-colors shrink-0"><X size={18} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setSelectMode(true)} className="flex-1 min-h-10 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#146B3E]/40 text-[#146B3E] rounded-2xl text-sm font-black hover:bg-[#E7F3EC] transition-all">
                  <Check size={15} strokeWidth={3} />เลือกต้น
                </button>
                <button onClick={() => setShowBulk(true)} className="flex-1 min-h-10 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#146B3E] text-white rounded-2xl text-sm font-black hover:bg-[#0F5A34] transition-all shadow-[0_8px_18px_rgba(47,170,98,0.28)] active:scale-95">
                  <RefreshCw size={16} strokeWidth={2.8} />อัปเดตทั้งแปลง
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/50 dark:bg-[#14291E]/30 rounded-2xl p-3 text-center border border-[#B9DCC8]/40 dark:border-[#31533D]/40 shadow-sm">
          <p className="text-lg sm:text-xl font-black text-foreground leading-none">{plot.trees.length}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-black mt-1 leading-tight uppercase tracking-wider">ต้นทั้งหมด</p>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-3 text-center border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm">
          <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-[#72C08A] leading-none">{goodCount}</p>
          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-[#72C08A]/80 font-black mt-1 leading-tight uppercase tracking-wider">สุขภาพดี</p>
        </div>
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-3 text-center border border-amber-100/50 dark:border-[#31533D]/20 shadow-sm">
          <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 leading-none">{fairCount + poorCount}</p>
          <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400/80 font-black mt-1 leading-tight uppercase tracking-wider">ต้องดูแล</p>
        </div>
      </div>

      {/* Add Tree Button */}
      <div className="mb-2 flex gap-2 sm:px-2">
        {addingTree ? (
          <div className="w-full bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-5 shadow-md">
            <p className="text-sm font-black text-foreground mb-3">เพิ่มต้นทุเรียน</p>
            <TreeForm plotId={plot.id} existingTrees={plot.trees} onSave={d => { addTree(plot.id, d); setAddingTree(false) }} onSaveMany={items => { items.forEach(item => addTree(plot.id, item)); setAddingTree(false) }} onCancel={() => setAddingTree(false)} />
          </div>
        ) : (
          <>
            <button onClick={() => setAddingTree(true)} type="button" className="flex-1 bg-[#E7F3EC] dark:bg-[#72C08A]/10 text-[#146B3E] dark:text-[#72C08A] font-black rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-xs sm:text-sm hover:bg-[#D8EEE2] dark:hover:bg-[#72C08A]/20 transition-all border border-[#146B3E]/20 dark:border-[#72C08A]/20 shadow-sm">
              <Plus size={18} strokeWidth={2.5} /> เพิ่มต้นทุเรียน
            </button>
            <button onClick={() => setShowAllQR(true)} type="button" className="min-w-20 px-3 sm:px-5 bg-white dark:bg-[#14291E] text-foreground rounded-2xl flex flex-col items-center justify-center border border-[#B9DCC8] dark:border-[#31533D] shadow-sm hover:bg-[#E7F3EC]/50 dark:hover:bg-[#1D3A29]/50 transition-colors">
              <QrCode size={18} className="mb-0.5 text-[#146B3E] dark:text-[#72C08A]" />
              <span className="text-[10px] font-black leading-none">พิมพ์ QR</span>
            </button>
          </>
        )}
      </div>

      {/* Tree list */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {plot.trees.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-6 text-center shadow-sm">
            <DurianIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">ยังไม่มีต้นทุเรียนในแปลงนี้</p>
          </div>
        ) : plot.trees.map(tree => (
          <div key={tree.id} className={editingTree === tree.id ? "col-span-2" : ""}>
            {editingTree === tree.id ? (
              <div className="bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-5 shadow-md">
                <p className="text-sm font-black text-foreground mb-3">แก้ไขข้อมูลต้น {tree.treeNumber}</p>
                <TreeForm plotId={plot.id} tree={tree} onSave={d => { updateTree(plot.id, tree.id, d); setEditingTree(null) }} onCancel={() => setEditingTree(null)} />
              </div>
            ) : (
              <div
                onClick={() => selectMode ? toggleSelectTree(tree.id) : setSelectedTreeId(tree.id)}
                className={`p-3 flex flex-col gap-2 group cursor-pointer transition-all h-full relative orchard-card rounded-2xl ${selectMode && selectedIds.has(tree.id) ? "border-[#146B3E] dark:border-[#72C08A] border-2 bg-[#E7F3EC]/20 dark:bg-[#1D3A29]/20 shadow-md" : "orchard-card-hover"}`}
              >
                <div className="flex items-start justify-between">
                  {selectMode ? (
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors ${selectedIds.has(tree.id) ? "bg-[#146B3E] border-[#146B3E] dark:bg-[#72C08A] dark:border-[#72C08A]" : "bg-white border-[#B9DCC8] dark:bg-[#0B140F] dark:border-[#31533D]"}`}>
                      {selectedIds.has(tree.id) && <Check size={16} className="text-white dark:text-[#0B1B12]" strokeWidth={3} />}
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E7F3EC] dark:bg-[#1D3A29]/40 flex items-center justify-center shrink-0">
                      <DurianIcon className="h-4 w-4 text-[#146B3E] dark:text-[#72C08A]" />
                    </div>
                  )}
                  {!selectMode && (
                    <div className="flex gap-0.5 sm:gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setQrTree(tree)} className="p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-[#146B3E] dark:hover:text-[#72C08A] rounded-md hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors" title="QR Code"><QrCode size={14} /></button>
                      <button onClick={() => setEditingTree(tree.id)} className="p-1.5 text-[#527060] dark:text-[#B8D1C0] hover:text-[#146B3E] dark:hover:text-[#72C08A] rounded-md hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] transition-colors" title="แก้ไข"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm(`ลบต้น ${tree.treeNumber}?`)) deleteTree(plot.id, tree.id) }} className="p-1.5 text-muted-foreground hover:text-destructive dark:hover:text-red-400 rounded-md hover:bg-muted dark:hover:bg-red-950/20 transition-colors" title="ลบ"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-0.5 mb-2">
                    <span className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">{tree.treeNumber}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">{tree.variety} · {tree.age} ปี</span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black leading-tight ${STAGE_BADGE[tree.stage] || "bg-muted text-muted-foreground"}`}>{FLOWER_STAGE_LABELS[tree.stage]}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black leading-tight ${HEALTH_BG[tree.health]}`}>{HEALTH_LABELS[tree.health]}</span>
                  </div>
                  {tree.notes && <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 italic line-clamp-2">{tree.notes}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Main Component ----
export default function PlotManagement({
  data, addPlot, updatePlot, deletePlot,
  addTree, updateTree, deleteTree, bulkUpdateTrees,
  addActivity, addBatch, addBatchStage, updateBatch, deleteBatch
}: Props) {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [showAddPlot, setShowAddPlot] = useState(false)
  const [plotForm, setPlotForm] = useState({ name: "", area: "1", notes: "" })

  const handleAddPlot = () => {
    const name = validateText("ชื่อแปลง", plotForm.name, { required: true, maxLength: 120 })
    const areaVal = plotForm.area === "" ? 0 : Number(plotForm.area)
    const area = validateNumber("พื้นที่", areaVal, { min: 0.5, max: 100000 })
    const notes = validateText("บันทึก", plotForm.notes, { maxLength: 500 })
    if (!name.ok || !area.ok || !notes.ok) {
      const invalid = !name.ok ? name : !area.ok ? area : notes
      alert(invalid.message)
      return
    }
    addPlot({ name: name.value, area: area.value, notes: notes.value })
    setPlotForm({ name: "", area: "1", notes: "" })
    setShowAddPlot(false)
  }

  const selectedPlot = data.plots.find(p => p.id === selectedPlotId)

  return (
    <div className="flex min-w-0 flex-col items-start gap-6 lg:min-h-[600px] lg:flex-row animate-slide-up">
      {/* Left Column: Plot List (Sticky on desktop) */}
      <div className={`w-full lg:w-64 shrink-0 space-y-3 lg:sticky lg:top-4 ${selectedPlotId ? 'hidden lg:block' : 'block'}`}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#146B3E] to-[#1D5C3A] dark:from-[#1D3A29] dark:to-[#14291E] p-4 text-white shadow-md border border-[#146B3E]/30 dark:border-[#31533D]/60">
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
                <DurianIcon className="h-4 w-4 text-[#E7F3EC]" />
              </div>
              <div>
                <h2 className="text-sm font-black leading-tight text-white">แปลงทุเรียน</h2>
                <p className="text-[11px] font-semibold text-white/58">{data.plots.length} แปลงในสวน</p>
              </div>
            </div>
            <button onClick={() => setShowAddPlot(v => !v)} type="button"
              className="flex items-center gap-1 bg-[#E7F3EC] text-[#146B3E] px-2.5 py-1.5 rounded-xl text-[10px] font-black hover:bg-white transition-all active:scale-[0.98] shadow-sm">
              {showAddPlot ? <X size={12} /> : <Plus size={12} />}
              {showAddPlot ? "ยกเลิก" : "เพิ่มแปลง"}
            </button>
          </div>
        </div>

        {showAddPlot && (
          <div className="bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-2xl p-4 space-y-3 shadow-md backdrop-blur-sm animate-fade-in-up">
            <h3 className="font-semibold text-foreground text-sm">เพิ่มแปลงใหม่</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-1 block">ชื่อแปลง</label>
                <input value={plotForm.name} onChange={e => setPlotForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="เช่น แปลง A" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-1 block">พื้นที่ (ไร่)</label>
                <input
                  type="text"
                  value={plotForm.area}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9.]/g, "")
                    const parts = val.split(".")
                    if (parts.length > 2) {
                      val = parts[0] + "." + parts.slice(1).join("")
                    }
                    setPlotForm(f => ({ ...f, area: val }))
                  }}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  placeholder="พื้นที่ (ไร่)"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block">บันทึก</label>
              <input value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="บันทึกเพิ่มเติม..." />
            </div>
            <button onClick={handleAddPlot} type="button" className="w-full bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2 font-black text-xs shadow-md hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] active:scale-95 transition-all">บันทึกแปลงใหม่</button>
          </div>
        )}

        {data.plots.length === 0 ? (
          <div className="bg-white dark:bg-[#14291E] border border-[#B9DCC8] dark:border-[#31533D]/60 rounded-2xl p-6 text-center shadow-sm">
            <DurianIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-bold">ยังไม่มีแปลงทุเรียน กดเพิ่มแปลงเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {data.plots.map(plot => {
              const goodCount = plot.trees.filter(t => t.health === "good").length
              const issueCount = plot.trees.filter(t => t.health !== "good").length
              const isActive = selectedPlotId === plot.id
              return (
                <button
                  key={plot.id}
                  onClick={() => setSelectedPlotId(plot.id)}
                  className={`min-h-[5.75rem] w-full rounded-2xl p-4 text-left transition-all group relative overflow-hidden orchard-card ${isActive
                    ? "border-[#146B3E] dark:border-[#72C08A] ring-1 ring-[#146B3E] dark:ring-[#72C08A] bg-[#E7F3EC]/20 dark:bg-[#1D3A29]/20"
                    : "orchard-card-hover cursor-pointer"
                    }`}
                >
                  <div className="relative flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#146B3E] text-white dark:bg-[#72C08A] dark:text-[#0B1B12]' : 'bg-[#E7F3EC] text-[#146B3E] dark:bg-[#1D3A29]/40 dark:text-[#72C08A]'}`}>
                        <DurianIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-black text-sm leading-tight ${isActive ? 'text-[#146B3E] dark:text-[#72C08A]' : 'text-foreground'}`}>{plot.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground font-bold">{plot.area} ไร่ · {plot.trees.length} ต้น</p>
                      </div>
                    </div>
                    <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${isActive ? "bg-[#146B3E] dark:bg-[#72C08A] text-white dark:text-[#0B1B12]" : "bg-[#F7FAF8] dark:bg-[#0B140F] text-[#527060] dark:text-[#B8D1C0] group-hover:bg-[#146B3E] group-hover:text-white dark:group-hover:bg-[#72C08A] dark:group-hover:text-[#0B1B12]"} transition-colors`}>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">ดี {goodCount}</span>
                    {issueCount > 0 && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-black border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">ดูแล {issueCount}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Column: Plot Detail or Tree Detail */}
      <div className={`flex-1 w-full min-w-0 ${selectedPlotId ? 'block' : 'hidden lg:block'}`}>
        {selectedPlot ? (
          <div className="orchard-card rounded-[2rem] p-4 sm:p-6 md:p-8">
            <PlotDetailView
              plot={selectedPlot}
              activities={data.activities}
              onBack={() => setSelectedPlotId(null)}
              addTree={addTree}
              updateTree={updateTree}
              deleteTree={deleteTree}
              bulkUpdateTrees={bulkUpdateTrees}
              updatePlot={updatePlot}
              deletePlot={(id) => { deletePlot(id); setSelectedPlotId(null) }}
              addActivity={addActivity}
              addBatch={addBatch}
              addBatchStage={addBatchStage}
              updateBatch={updateBatch}
              deleteBatch={deleteBatch}
            />
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center orchard-card border-dashed rounded-[2.5rem] p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-muted dark:bg-[#1D3A29]/20 flex items-center justify-center mb-6">
              <DurianIcon className="h-10 w-10 text-muted-foreground/40 dark:text-[#72C08A]/40" />
            </div>
            <h3 className="text-xl font-black text-foreground">เลือกแปลงเพื่อดูข้อมูล</h3>
            <p className="text-base text-muted-foreground font-medium max-w-xs mx-auto mt-2">
              เลือกแปลงจากรายการด้านซ้ายเพื่อจัดการต้นทุเรียน กิจกรรม และพยากรณ์วันเก็บเกี่ยว
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
