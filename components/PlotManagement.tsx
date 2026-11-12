"use client"
import { useEffect, useRef, useState } from "react"
import {
  Activity, Plot, Tree, FlowerStage, DurianVariety,
  FLOWER_STAGE_LABELS, FLOWER_STAGES, VARIETIES,
  useAppData
} from "@/lib/store"
import { validateDate, validateNumber, validateText } from "@/lib/form-validation"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import {
  Plus, Pencil, Trash2, QrCode, RefreshCw, X, Check,
  ChevronRight, ArrowLeft, Printer, Sparkles,
  Search, Download, MoreHorizontal, ListChecks
} from "lucide-react"
import { toast } from "sonner"
import { exportPlotsToCSV } from "@/lib/report-utils"
import { PrintReportData } from "./PrintReportView"
import { QRCodeSVG } from "qrcode.react"
import DurianIcon from "./DurianIcon"
import Portal from "./Portal"
import BorderBeam from "./magicui/border-beam"
import TreeDetail from "./records/TreeDetail"
import { applyStage, StageSheet } from "./records/TreeSheets"
import { HEALTH_META, STAGE_PHASES, stagePhaseIndex } from "./records/meta"
import { ConfirmDialog, Field, FormError, inputClass, PrimaryButton, RecordSheet } from "./records/ui"
import { daysBetween, relativeDistance, toDateKey, todayKey } from "@/lib/date-utils"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AppDataReturn = ReturnType<typeof useAppData>

interface Props {
  data: AppDataReturn["data"]
  addPlot: AppDataReturn["addPlot"]
  updatePlot: AppDataReturn["updatePlot"]
  deletePlot: AppDataReturn["deletePlot"]
  addTree: AppDataReturn["addTree"]
  addTrees: AppDataReturn["addTrees"]
  updateTree: AppDataReturn["updateTree"]
  deleteTree: AppDataReturn["deleteTree"]
  bulkUpdateTrees: AppDataReturn["bulkUpdateTrees"]
  addActivity: AppDataReturn["addActivity"]
  addFinance?: AppDataReturn["addFinance"]
  addBatch: AppDataReturn["addBatch"]
  addBatchStage: AppDataReturn["addBatchStage"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
  onPrint?: (reportData: Omit<PrintReportData, "farmName" | "userName" | "plots">) => void
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
function QRModal({ tree, plot, onClose }: { tree: Tree; plot: Plot; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrData = JSON.stringify({ plotId: plot.id, plotName: plot.name, treeId: tree.id, treeNumber: tree.treeNumber, variety: tree.variety })

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <Portal>
      <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card border border-border dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl orchard-card" onClick={e => e.stopPropagation()}>
          <h3 className="font-black text-base text-foreground mb-1">QR Code ต้นทุเรียน</h3>
          <p className="text-muted-foreground text-xs font-bold mb-4">{plot.name} · {tree.treeNumber}</p>
          <div className="bg-white p-4 rounded-2xl inline-block mb-4 border border-[#B9DCC8] dark:border-[#31533D]/60 shadow-inner">
            <QRCodeSVG value={qrData} size={180} />
          </div>
          <p className="text-xs text-muted-foreground font-black">{tree.variety} · อายุทุเรียน {tree.age} ปี</p>
          <button onClick={onClose} type="button" className="mt-5 w-full border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-muted-foreground dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 hover:text-foreground font-black transition-all">ปิด</button>
        </div>
      </div>
    </Portal>
  )
}

function AllQRModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <Portal>
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
    </Portal>
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
          <label className="text-[10px] font-black text-muted-foreground mb-1 block">อายุทุเรียน (ปี)</label>
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

function AddTreeModal({ plot, existingTrees, onClose, onSave, onSaveMany }: {
  plot: Plot; existingTrees: Tree[]; onClose: () => void;
  onSave: (data: Omit<Tree, "id" | "lastUpdated">) => void;
  onSaveMany: (items: Omit<Tree, "id" | "lastUpdated">[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  return (
    <Portal>
      <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-[95%] sm:max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] dark:bg-[#1D3A29]/40 flex items-center justify-center">
                <Plus size={20} className="text-[#146B3E] dark:text-[#72C08A]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground leading-tight">เพิ่มต้นทุเรียนใหม่</h3>
                <p className="text-xs text-muted-foreground font-semibold">แปลง: {plot.name}</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="p-2 hover:bg-muted dark:hover:bg-[#1D3A29] rounded-full transition-colors"><X size={16} className="text-muted-foreground" /></button>
          </div>
          <TreeForm
            plotId={plot.id}
            existingTrees={existingTrees}
            onSave={onSave}
            onSaveMany={onSaveMany}
            onCancel={onClose}
          />
        </div>
      </div>
    </Portal>
  )
}

function PlotDetailView({
  plot, activities, selectedTreeId, setSelectedTreeId, onBack, addTree, addTrees, updateTree, deleteTree, updatePlot, deletePlot,
  addActivity, addFinance, updateBatch, deleteBatch
}: {
  plot: Plot; activities: Activity[]; onBack: () => void
  selectedTreeId: string | null
  setSelectedTreeId: (id: string | null) => void
  addTree: (plotId: string, tree: Omit<Tree, "id" | "lastUpdated">) => void
  addTrees: (plotId: string, treesList: Omit<Tree, "id" | "lastUpdated" | "batches">[]) => void
  updateTree: AppDataReturn["updateTree"]
  deleteTree: AppDataReturn["deleteTree"]
  updatePlot: (plotId: string, changes: Partial<Plot>) => void
  deletePlot: (plotId: string) => void
  addActivity: AppDataReturn["addActivity"]
  addFinance?: AppDataReturn["addFinance"]
  updateBatch: AppDataReturn["updateBatch"]
  deleteBatch: AppDataReturn["deleteBatch"]
}) {
  const [addingTree, setAddingTree] = useState(false)
  const [qrTree, setQrTree] = useState<Tree | null>(null)
  const [showAllQR, setShowAllQR] = useState(false)
  const [editingPlot, setEditingPlot] = useState(false)
  const [confirmDeletePlot, setConfirmDeletePlot] = useState(false)
  const [plotForm, setPlotForm] = useState({ name: plot.name, area: String(plot.area), notes: plot.notes ?? "" })
  const [plotError, setPlotError] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedHealth, setSelectedHealth] = useState<"all" | Tree["health"] | "stale">("all")
  const [selectedStage, setSelectedStage] = useState<"all" | FlowerStage>("all")
  const [visibleCount, setVisibleCount] = useState(40)

  useEffect(() => {
    setVisibleCount(40)
  }, [searchQuery, selectedHealth, selectedStage])

  const toggleSelectTree = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleSavePlot = () => {
    const name = validateText("ชื่อแปลง", plotForm.name, { required: true, maxLength: 120 })
    if (!name.ok) return setPlotError(name.message)
    const area = validateNumber("พื้นที่", plotForm.area === "" ? 0 : Number(plotForm.area), { min: 0.1, max: 100000 })
    if (!area.ok) return setPlotError(area.message)
    const notes = validateText("บันทึก", plotForm.notes, { maxLength: 500 })
    if (!notes.ok) return setPlotError(notes.message)
    updatePlot(plot.id, { name: name.value, area: area.value, notes: notes.value })
    setEditingPlot(false)
    toast.success("บันทึกข้อมูลแปลงแล้ว")
  }

  const selectedTree = plot.trees.find(t => t.id === selectedTreeId)

  if (selectedTree) {
    return (
      <>
        <TreeDetail
          tree={selectedTree}
          plot={plot}
          activities={activities}
          onBack={() => setSelectedTreeId(null)}
          onShowQr={() => setQrTree(selectedTree)}
          updateTree={updateTree}
          deleteTree={deleteTree}
          updateBatch={updateBatch}
          deleteBatch={deleteBatch}
          addActivity={addActivity}
          addFinance={addFinance}
        />
        {qrTree && <QRModal tree={qrTree} plot={plot} onClose={() => setQrTree(null)} />}
      </>
    )
  }

  const today = todayKey()
  const isStale = (t: Tree) => daysBetween(toDateKey(t.lastUpdated), today) > 14
  const goodCount = plot.trees.filter(t => t.health === "good").length
  const watchCount = plot.trees.length - goodCount
  const staleCount = plot.trees.filter(isStale).length
  const total = plot.trees.length

  const query = searchQuery.trim().toLowerCase()
  const filteredTrees = plot.trees.filter(t => {
    const matchesSearch = !query || t.treeNumber.toLowerCase().includes(query) || t.variety.toLowerCase().includes(query)
    const matchesHealth = selectedHealth === "all" || (selectedHealth === "stale" ? isStale(t) : t.health === selectedHealth)
    const matchesStage = selectedStage === "all" || t.stage === selectedStage
    return matchesSearch && matchesHealth && matchesStage
  })
  const shownTrees = filteredTrees.slice(0, visibleCount)
  const selectedTrees = plot.trees.filter(t => selectedIds.has(t.id))
  const allFilteredSelected = filteredTrees.length > 0 && filteredTrees.every(t => selectedIds.has(t.id))

  return (
    <div className="relative space-y-4 pb-28 lg:p-5 lg:pb-6">
      {qrTree && <QRModal tree={qrTree} plot={plot} onClose={() => setQrTree(null)} />}
      {showAllQR && <AllQRModal plot={plot} onClose={() => setShowAllQR(false)} />}

      {/* ── Plot header ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} aria-label="กลับไปรายการแปลง" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black text-foreground">{plot.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{plot.area} ไร่{plot.notes ? ` · ${plot.notes}` : ""}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="ตัวเลือกแปลง" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/70 hover:bg-muted">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => { setPlotForm({ name: plot.name, area: String(plot.area), notes: plot.notes ?? "" }); setPlotError(null); setEditingPlot(true) }} className="gap-2 py-2.5 font-semibold">
                <Pencil size={16} /> แก้ไขข้อมูลแปลง
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!total} onSelect={() => setShowAllQR(true)} className="gap-2 py-2.5 font-semibold">
                <Printer size={16} /> พิมพ์ QR Code ทุกต้น
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmDeletePlot(true)} className="gap-2 py-2.5 font-semibold text-destructive focus:text-destructive">
                <Trash2 size={16} /> ลบแปลงนี้
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-2 [&_p:last-child]:truncate">
          <button type="button" onClick={() => setSelectedHealth("all")} className={`rounded-xl px-3 py-2.5 text-left transition ${selectedHealth === "all" ? "bg-primary/10 ring-2 ring-primary/40" : "bg-muted/70"}`}>
            <p className="text-2xl font-black leading-none text-foreground">{total}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">ต้น</p>
          </button>
          <button type="button" onClick={() => setSelectedHealth(selectedHealth === "fair" ? "all" : "fair")} className={`rounded-xl px-3 py-2.5 text-left transition ${watchCount ? "bg-amber-50 dark:bg-amber-400/10" : "bg-muted/70"} ${selectedHealth === "fair" ? "ring-2 ring-amber-400" : ""}`}>
            <p className={`text-2xl font-black leading-none ${watchCount ? "text-amber-600 dark:text-amber-300" : "text-foreground"}`}>{watchCount}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">ต้องดูแล</p>
          </button>
          <button type="button" onClick={() => setSelectedHealth(selectedHealth === "stale" ? "all" : "stale")} className={`rounded-xl bg-muted/70 px-3 py-2.5 text-left transition ${selectedHealth === "stale" ? "ring-2 ring-primary/40" : ""}`}>
            <p className="text-2xl font-black leading-none text-foreground">{staleCount}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">รอเช็ก</p>
          </button>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขต้น"
            className="min-h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <select
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value as "all" | FlowerStage)}
          aria-label="กรองตามระยะ"
          className="min-h-11 w-[6.75rem] shrink-0 rounded-full border border-border bg-card px-3 text-sm font-bold text-foreground"
        >
          <option value="all">ทุกระยะ</option>
          {FLOWER_STAGES.map(st => <option key={st} value={st}>{FLOWER_STAGE_LABELS[st]}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-bold text-muted-foreground">
          <span className="whitespace-nowrap">{filteredTrees.length === total ? `${total} ต้น` : `${filteredTrees.length}/${total} ต้น`}</span>
          {(selectedHealth !== "all" || selectedStage !== "all" || query) && (
            <button type="button" onClick={() => { setSelectedHealth("all"); setSelectedStage("all"); setSearchQuery("") }} className="ml-2 whitespace-nowrap text-primary">ล้าง</button>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          {total > 0 && (
            <button
              type="button"
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition ${selectMode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:bg-muted"}`}
            >
              <ListChecks size={16} /> {selectMode ? "เสร็จ" : "เลือก"}
            </button>
          )}
          <button type="button" onClick={() => setAddingTree(true)} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 text-sm font-black text-primary-foreground shadow-sm">
            <Plus size={16} strokeWidth={2.75} /> เพิ่มต้น
          </button>
        </div>
      </div>

      {/* ── Tree grid ── */}
      {filteredTrees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <DurianIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-bold text-foreground">{total ? "ไม่พบต้นที่ตรงกับตัวกรอง" : "แปลงนี้ยังไม่มีต้นทุเรียน"}</p>
          {!total && (
            <button type="button" onClick={() => setAddingTree(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground">
              <Plus size={16} /> เพิ่มต้นทุเรียน
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
          {shownTrees.map(tree => {
            const selected = selectedIds.has(tree.id)
            const phase = stagePhaseIndex(tree.stage)
            const stale = isStale(tree)
            return (
              <li key={tree.id}>
                <button
                  type="button"
                  onClick={() => (selectMode ? toggleSelectTree(tree.id) : setSelectedTreeId(tree.id))}
                  aria-pressed={selectMode ? selected : undefined}
                  className={`relative flex h-full w-full flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition active:scale-[0.98] ${selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40"}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-black text-foreground">{tree.treeNumber}</span>
                      <span className="block truncate text-xs text-muted-foreground">{tree.variety} · {tree.age} ปี</span>
                    </span>
                    {selectMode ? (
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                        {selected && <Check size={14} strokeWidth={3.5} />}
                      </span>
                    ) : (
                      <span title={HEALTH_META[tree.health].label} className={`mt-1 h-3 w-3 shrink-0 rounded-full ${HEALTH_META[tree.health].dot}`} />
                    )}
                  </span>
                  <span className="text-sm font-bold text-foreground">{FLOWER_STAGE_LABELS[tree.stage]}</span>
                  <span className="grid grid-cols-5 gap-0.5" aria-hidden>
                    {STAGE_PHASES.map((p, i) => (
                      <span key={p.label} className={`h-1 rounded-full ${i < phase ? "bg-primary/50" : i === phase ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    {tree.health !== "good" && <span className={`rounded-full px-2 text-[11px] font-bold ${HEALTH_META[tree.health].chip}`}>{HEALTH_META[tree.health].label}</span>}
                    {stale && <span className="rounded-full bg-muted px-2 text-[11px] font-bold text-muted-foreground">เช็กล่าสุด {relativeDistance(tree.lastUpdated)}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {filteredTrees.length > visibleCount && (
        <button type="button" onClick={() => setVisibleCount(c => c + 40)} className="w-full rounded-xl py-3 text-sm font-bold text-primary hover:bg-muted">
          แสดงเพิ่มอีก {Math.min(40, filteredTrees.length - visibleCount)} ต้น
        </button>
      )}

      {/* ── Multi-select action bar ── */}
      {selectMode && (
        <Portal>
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_12px_32px_rgba(15,59,37,0.18)] lg:bottom-6">
          <button
            type="button"
            onClick={() => setSelectedIds(allFilteredSelected ? new Set() : new Set(filteredTrees.map(t => t.id)))}
            className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-bold text-foreground/80 hover:bg-muted"
          >
            {allFilteredSelected ? "ไม่เลือก" : `เลือกทั้งหมด (${filteredTrees.length})`}
          </button>
          <button
            type="button"
            disabled={!selectedIds.size}
            onClick={() => setBulkOpen(true)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-black text-primary-foreground disabled:opacity-40"
          >
            <RefreshCw size={16} /> อัปเดต {selectedIds.size} ต้น
          </button>
        </div>
        </Portal>
      )}

      {/* ── Sheets ── */}
      {addingTree && (
        <AddTreeModal
          plot={plot}
          existingTrees={plot.trees}
          onClose={() => setAddingTree(false)}
          onSave={d => { addTree(plot.id, d); setAddingTree(false); toast.success("เพิ่มต้นแล้ว") }}
          onSaveMany={items => { addTrees(plot.id, items); setAddingTree(false); toast.success(`เพิ่ม ${items.length} ต้นแล้ว`) }}
        />
      )}

      <StageSheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`อัปเดต ${selectedIds.size} ต้น`}
        description={selectedTrees.slice(0, 6).map(t => t.treeNumber).join(", ") + (selectedTrees.length > 6 ? ` และอีก ${selectedTrees.length - 6} ต้น` : "")}
        currentStage={selectedTrees[0]?.stage ?? "vegetative"}
        hasBatch={selectedTrees.some(t => t.batches?.length)}
        showHealth
        submitLabel={`อัปเดต ${selectedIds.size} ต้น`}
        onSave={({ health, ...input }) => {
          selectedTrees.forEach(t => updateTree(plot.id, t.id, { ...applyStage(t, input), ...(health ? { health } : {}) }))
          toast.success(`อัปเดต ${selectedTrees.length} ต้นเป็น “${FLOWER_STAGE_LABELS[input.stage]}” แล้ว`)
          // Wait for the sheet's close animation so its title doesn't flash "0 ต้น".
          window.setTimeout(exitSelectMode, 350)
        }}
      />

      <RecordSheet
        open={editingPlot}
        onOpenChange={setEditingPlot}
        title="แก้ไขข้อมูลแปลง"
        footer={<PrimaryButton onClick={handleSavePlot}>บันทึก</PrimaryButton>}
      >
        <div className="space-y-5">
          <Field label="ชื่อแปลง"><input value={plotForm.name} onChange={e => setPlotForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
          <Field label="พื้นที่ (ไร่)">
            <input
              inputMode="decimal"
              value={plotForm.area}
              onChange={e => {
                let val = e.target.value.replace(/[^0-9.]/g, "")
                const parts = val.split(".")
                if (parts.length > 2) val = `${parts[0]}.${parts.slice(1).join("")}`
                setPlotForm(f => ({ ...f, area: val }))
              }}
              className={inputClass}
            />
          </Field>
          <Field label="หมายเหตุ" hint="ไม่บังคับ"><input value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))} placeholder="เช่น ดินร่วนปนทราย ติดคลอง" className={inputClass} /></Field>
          <FormError message={plotError} />
        </div>
      </RecordSheet>

      <ConfirmDialog
        open={confirmDeletePlot}
        onOpenChange={setConfirmDeletePlot}
        title={`ลบ ${plot.name}?`}
        description={`ต้นทุเรียน ${total} ต้นและประวัติรุ่นดอกทั้งหมดในแปลงนี้จะถูกลบ กู้คืนไม่ได้`}
        confirmLabel="ลบแปลง"
        onConfirm={() => deletePlot(plot.id)}
      />
    </div>
  )
}

function StatTile({ value, label, tone }: { value: number | string; label: string; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${tone === "warn" ? "border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10" : "border-border bg-card"}`}>
      <p className={`text-2xl font-black leading-none ${tone === "warn" ? "text-amber-600 dark:text-amber-300" : "text-foreground"}`}>{value}</p>
      <p className="mt-1.5 truncate text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  )
}

// ---- Add Plot Modal ----
function AddPlotModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { name: string; area: number; notes: string; trees?: Tree[] }) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState("")
  const [area, setArea] = useState("1")
  const [notes, setNotes] = useState("")
  const [treeForm, setTreeForm] = useState({
    count: "1",
    treeNumber: "A-001",
    variety: "หมอนทอง" as DurianVariety,
    age: "5",
    stage: "vegetative" as FlowerStage,
    health: "good" as Tree["health"],
    notes: "",
  })

  useEscapeToClose({ enabled: true, onEscape: onClose, containerRef })

  const setTree = (key: string, value: unknown) => setTreeForm(current => ({ ...current, [key]: value }))

  const handleSave = () => {
    const checkedName = validateText("ชื่อแปลง", name, { required: true, maxLength: 120 })
    const areaVal = area === "" ? 0 : Number(area)
    const checkedArea = validateNumber("พื้นที่", areaVal, { min: 0.5, max: 100000 })
    const checkedNotes = validateText("บันทึก", notes, { maxLength: 500 })
    const countVal = treeForm.count === "" ? 0 : Number(treeForm.count)
    const checkedCount = validateNumber("จำนวนต้นทุเรียน", countVal, { min: 0, max: 1000, integer: true })
    const checkedTreeNumber = validateText("หมายเลขต้นเริ่มต้น", treeForm.treeNumber, { required: countVal > 0, maxLength: 80 })
    const ageVal = treeForm.age === "" ? 0 : Number(treeForm.age)
    const checkedAge = validateNumber("อายุต้นทุเรียน", ageVal, { min: 1, max: 200, integer: true })
    const checkedTreeNotes = validateText("บันทึกต้นทุเรียน", treeForm.notes, { maxLength: 500, allowMultiline: true })
    
    if (!checkedName.ok || !checkedArea.ok || !checkedNotes.ok || !checkedCount.ok || !checkedTreeNumber.ok || !checkedAge.ok || !checkedTreeNotes.ok) {
      const invalid = !checkedName.ok ? checkedName : !checkedArea.ok ? checkedArea : !checkedNotes.ok ? checkedNotes : !checkedCount.ok ? checkedCount : !checkedTreeNumber.ok ? checkedTreeNumber : !checkedAge.ok ? checkedAge : checkedTreeNotes
      alert(invalid.message)
      return
    }

    const createdAt = new Date().toISOString()
    const trees: Tree[] = Array.from({ length: checkedCount.value }, (_, index) => ({
      id: `t${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      treeNumber: getTreeNumberFromBase(checkedTreeNumber.value, index),
      variety: treeForm.variety,
      age: checkedAge.value,
      stage: treeForm.stage,
      health: treeForm.health,
      notes: checkedTreeNotes.value,
      batches: [],
      lastUpdated: createdAt,
    }))
    
    onSave({ name: checkedName.value, area: checkedArea.value, notes: checkedNotes.value, trees })
  }

  return (
    <Portal>
      <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-[#14291E] border border-white/60 dark:border-[#31533D]/60 rounded-3xl p-6 w-full max-w-[95%] sm:max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] dark:bg-[#1D3A29]/40 flex items-center justify-center">
                <Plus size={20} className="text-[#146B3E] dark:text-[#72C08A]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground leading-tight">เพิ่มแปลงทุเรียนใหม่</h3>
                <p className="text-xs text-muted-foreground font-semibold">กรอกข้อมูลแปลงและต้นทุเรียนเริ่มต้น</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="p-2 hover:bg-muted dark:hover:bg-[#1D3A29] rounded-full transition-colors"><X size={16} className="text-muted-foreground" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">ชื่อแปลง</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                placeholder="เช่น แปลง A, แปลงหน้าบ้าน" />
            </div>

            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">พื้นที่ (ไร่)</label>
              <input
                type="text"
                value={area === "0" ? "" : area}
                onChange={e => {
                  let val = e.target.value.replace(/[^0-9.]/g, "")
                  const parts = val.split(".")
                  if (parts.length > 2) {
                    val = parts[0] + "." + parts.slice(1).join("")
                  }
                  setArea(val)
                }}
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                placeholder="เช่น 1.5"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                placeholder="ข้อมูลเพิ่มเติม เช่น ปีที่เริ่มปลูก แหล่งน้ำ..." />
            </div>

            <div className="rounded-2xl border border-[#B9DCC8] dark:border-[#31533D] bg-[#F7FBF8] dark:bg-[#0B140F]/55 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-foreground">ข้อมูลต้นทุเรียน</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">สร้างต้นพร้อมแปลงใหม่ เว้นจำนวนเป็น 0 ถ้ายังไม่เพิ่มต้น</p>
                </div>
                <DurianIcon size={22} className="shrink-0 text-[#146B3E] dark:text-[#72C08A]" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">จำนวนต้น</label>
                  <input
                    type="text"
                    value={treeForm.count === "0" ? "" : treeForm.count}
                    onChange={e => setTree("count", e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                    placeholder="เช่น 20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">เลขต้นเริ่มต้น</label>
                  <input
                    value={treeForm.treeNumber}
                    onChange={e => setTree("treeNumber", e.target.value)}
                    className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                    placeholder="เช่น A-001"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">พันธุ์</label>
                  <select
                    value={treeForm.variety}
                    onChange={e => setTree("variety", e.target.value as DurianVariety)}
                    className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  >
                    {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">อายุ (ปี)</label>
                  <input
                    type="text"
                    value={treeForm.age === "0" ? "" : treeForm.age}
                    onChange={e => setTree("age", e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                    placeholder="เช่น 5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">ระยะปัจจุบัน</label>
                  <select
                    value={treeForm.stage}
                    onChange={e => setTree("stage", e.target.value as FlowerStage)}
                    className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  >
                    {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">สุขภาพต้น</label>
                  <div className="flex gap-2">
                    {(["good", "fair", "poor"] as Tree["health"][]).map(h => (
                      <button key={h} type="button" onClick={() => setTree("health", h)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-colors ${treeForm.health === h ? "bg-primary text-primary-foreground border-primary dark:bg-[#72C08A] dark:text-[#0B1B12] dark:border-[#72C08A]" : "border-[#B9DCC8] dark:border-[#31533D] text-[#527060] dark:text-[#B8D1C0] hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]"}`}>
                        {HEALTH_LABELS[h]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[10px] font-black text-muted-foreground mb-1 block uppercase tracking-wider">บันทึกต้นทุเรียน</label>
                <textarea
                  value={treeForm.notes}
                  onChange={e => setTree("notes", e.target.value)}
                  rows={2}
                  className="w-full bg-background dark:bg-[#0B140F] border border-[#B9DCC8] dark:border-[#31533D] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:focus:ring-emerald-400"
                  placeholder="เช่น ปลูกพร้อมกัน โซนแถวหน้า..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} type="button" className="flex-1 border border-[#B9DCC8] dark:border-[#31533D] rounded-xl py-2.5 text-xs text-[#527060] dark:text-[#B8D1C0] font-black hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50 transition-all active:scale-[0.98]">ยกเลิก</button>
            <button onClick={handleSave} type="button" className="flex-1 bg-primary text-primary-foreground dark:bg-[#72C08A] dark:text-[#0B1B12] rounded-xl py-2.5 text-xs font-black hover:bg-[#0F5A34] dark:hover:bg-[#5bb375] active:scale-[0.98] transition-all shadow-md">บันทึกแปลง</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

// ---- All Plots Overview Dashboard ----
function AllPlotsOverview({ data, setSelectedPlotId, onAddPlotClick, onPrint }: {
  data: AppDataReturn["data"]
  setSelectedPlotId: (id: string) => void
  onAddPlotClick: () => void
  onPrint?: (reportData: Omit<PrintReportData, "farmName" | "userName" | "plots">) => void
}) {
  const totalPlots = data.plots.length
  const totalArea = data.plots.reduce((acc, p) => acc + p.area, 0)
  const totalTrees = data.plots.reduce((acc, p) => acc + p.trees.length, 0)
  const goodTreesCount = data.plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "good").length, 0)
  const fairTreesCount = data.plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "fair").length, 0)
  const poorTreesCount = data.plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "poor").length, 0)
  const healthyPercent = totalTrees > 0 ? Math.round((goodTreesCount / totalTrees) * 100) : 0

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 pb-6 lg:p-5">
        {/* Overview header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-foreground">แปลงทุเรียน</h2>
            <p className="truncate text-sm text-muted-foreground">
              {totalPlots ? `${totalArea.toLocaleString("th-TH", { maximumFractionDigits: 1 })} ไร่ · สุขภาพดี ${healthyPercent}%` : "เริ่มจากเพิ่มแปลงแรกของสวน"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {totalPlots > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="ส่งออกรายงาน" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 hover:bg-muted">
                    <MoreHorizontal size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => exportPlotsToCSV(data.plots)} className="gap-2 py-2.5 font-semibold">
                    <Download size={16} /> ส่งออก Excel (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onPrint?.({ type: "plots", title: "รายงานสรุปทะเบียนแปลงและต้นทุเรียน", dateRange: "ข้อมูลอัปเดตล่าสุด" })} className="gap-2 py-2.5 font-semibold">
                    <Printer size={16} /> พิมพ์รายงาน (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button type="button" onClick={onAddPlotClick} className="inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 text-sm font-black text-primary-foreground shadow-sm">
              <Plus size={16} strokeWidth={2.75} /> เพิ่มแปลง
            </button>
          </div>
        </div>

        {totalPlots > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={totalPlots} label="แปลง" />
            <StatTile value={totalTrees} label="ต้น" />
            <StatTile value={fairTreesCount + poorTreesCount} label="ต้องดูแล" tone={fairTreesCount + poorTreesCount ? "warn" : undefined} />
          </div>
        )}

        {/* Plots List Panel */}
        <div className="space-y-2.5">
          <h3 className="px-1 text-sm font-black text-muted-foreground">เลือกแปลง</h3>
          {totalPlots === 0 ? (
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 text-center bg-gradient-to-br from-[#0d5c34] via-[#146B3E] to-[#1D5C3A] dark:from-[#0B1B12] dark:via-[#14291E] dark:to-[#173021] text-white shadow-2xl flex flex-col items-center justify-center border border-white/10">
              {/* decorative glowing circle blobs */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              
              {/* BorderBeam outline animation */}
              <BorderBeam size={350} duration={8} borderWidth={1.5} colorFrom="#ffffff" colorTo="#84CC16" />

              <div className="relative z-10 w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 shadow-inner border border-white/20 animate-bounce">
                <DurianIcon className="h-10 w-10 text-white" />
              </div>

              <h3 className="relative z-10 text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                ยังไม่มีแปลงทุเรียนในสวนของคุณ
              </h3>
              <p className="relative z-10 text-xs md:text-sm text-white/70 font-medium max-w-md mx-auto mt-2.5 mb-8 leading-relaxed">
                ก้าวแรกสู่การทำสวนทุเรียนอัจฉริยะ! เริ่มบันทึกข้อมูลแปลง ติดตามระยะการเจริญเติบโตของผล และวิเคราะห์ข้อมูลในแบบเรียลไทม์ได้ทันที
              </p>

              <button
                onClick={onAddPlotClick}
                className="group relative overflow-hidden bg-white text-[#146B3E] dark:bg-[#72C08A] dark:text-[#0B1B12] px-8 py-4 rounded-2xl font-black text-sm shadow-2xl hover:shadow-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span className="absolute inset-0 block rounded-[inherit] bg-[linear-gradient(to_right,transparent_20%,rgba(20,107,62,0.15)_50%,transparent_80%)] dark:bg-[linear-gradient(to_right,transparent_20%,rgba(255,255,255,0.3)_50%,transparent_80%)] bg-[length:200%_100%] bg-no-repeat transition-[background-position] duration-1000 [background-position:100%_0%] group-hover:[background-position:-100%_0%]" />
                <Plus size={16} strokeWidth={3} />
                <span className="relative z-10">สร้างแปลงทุเรียนแรก</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:gap-3">
              {data.plots.map(plot => {
                const pGood = plot.trees.filter(t => t.health === "good").length
                const pFair = plot.trees.filter(t => t.health === "fair").length
                const pPoor = plot.trees.filter(t => t.health === "poor").length
                const pTotal = plot.trees.length

                const goodPct = pTotal > 0 ? (pGood / pTotal) * 100 : 0
                const fairPct = pTotal > 0 ? (pFair / pTotal) * 100 : 0
                const poorPct = pTotal > 0 ? (pPoor / pTotal) * 100 : 0

                const vCounts = plot.trees.reduce((acc, t) => {
                  acc[t.variety] = (acc[t.variety] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const vString = Object.entries(vCounts)
                  .map(([name, count]) => `${name} (${count})`)
                  .join(", ")

                const needCare = pFair + pPoor
                return (
                  <button
                    type="button"
                    key={plot.id}
                    onClick={() => setSelectedPlotId(plot.id)}
                    className="group w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <DurianIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-black leading-tight text-foreground">{plot.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">{plot.area} ไร่ · {pTotal} ต้น{vString ? ` · ${Object.keys(vCounts).join(", ")}` : ""}</span>
                      </span>
                      <ChevronRight size={20} className="shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                    {pTotal > 0 ? (
                      <span className="mt-3 block">
                        <span className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          {goodPct > 0 && <span className="h-full bg-emerald-500" style={{ width: `${goodPct}%` }} />}
                          {fairPct > 0 && <span className="h-full bg-amber-400" style={{ width: `${fairPct}%` }} />}
                          {poorPct > 0 && <span className="h-full bg-rose-500" style={{ width: `${poorPct}%` }} />}
                        </span>
                        <span className="mt-1.5 flex justify-between text-xs font-bold">
                          <span className="text-emerald-700 dark:text-emerald-300">แข็งแรง {pGood}</span>
                          <span className={needCare ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}>{needCare ? `ต้องดูแล ${needCare}` : "ไม่มีต้นที่ต้องดูแล"}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="mt-3 block text-sm font-bold text-primary">+ เพิ่มต้นทุเรียนในแปลงนี้</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ---- Main Component ----
/**
 * Makes the in-app drill-down (overview → plot → tree) participate in browser
 * history so the device/browser Back button steps back one level at a time
 * instead of jumping to the previous tab. `depth` is the number of open levels;
 * `closeTop` closes the current top level. Pushes a history entry per opened
 * level (URL unchanged, so AppShell keeps the active tab) and consumes them on
 * UI-initiated closes to keep the stack balanced.
 */
function useDrillBackHistory(depth: number, closeTop: () => void) {
  const prevDepth = useRef(0)
  const fromPopState = useRef(false)
  const selfGo = useRef(false)
  const closeRef = useRef(closeTop)
  useEffect(() => {
    closeRef.current = closeTop
  })

  useEffect(() => {
    const onPop = () => {
      // Ignore the popstate our own history.go() triggers on a UI close.
      if (selfGo.current) {
        selfGo.current = false
        return
      }
      if (prevDepth.current > 0) {
        fromPopState.current = true
        closeRef.current()
      }
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    const before = prevDepth.current
    if (depth > before) {
      for (let i = before; i < depth; i++) {
        // URL omitted → entry keeps the same URL, so the active tab is preserved.
        window.history.pushState({ durianDrill: i + 1 }, "")
      }
    } else if (depth < before) {
      if (fromPopState.current) {
        fromPopState.current = false // browser already popped the entry
      } else {
        selfGo.current = true
        window.history.go(-(before - depth)) // UI close → consume our entries
      }
    }
    prevDepth.current = depth
  }, [depth])
}

export default function PlotManagement({
  data, addPlot, updatePlot, deletePlot,
  addTree, addTrees, updateTree, deleteTree, bulkUpdateTrees,
  addActivity, addFinance, updateBatch, deleteBatch,
  onPrint
}: Props) {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [showAddPlot, setShowAddPlot] = useState(false)

  const closePlot = () => {
    setSelectedTreeId(null)
    setSelectedPlotId(null)
  }

  // Back button steps tree → plot → previous tab (instead of jumping tabs).
  const depth = (selectedPlotId ? 1 : 0) + (selectedTreeId ? 1 : 0)
  useDrillBackHistory(depth, () => {
    if (selectedTreeId) setSelectedTreeId(null)
    else if (selectedPlotId) setSelectedPlotId(null)
  })

  const selectedPlot = data.plots.find(p => p.id === selectedPlotId)

  return (
    <div data-page="plots" className="w-full min-w-0 animate-slide-up">
      {showAddPlot && (
        <AddPlotModal
          onClose={() => setShowAddPlot(false)}
          onSave={(plotData) => {
            addPlot(plotData)
            setShowAddPlot(false)
          }}
        />
      )}

      <div className="relative flex flex-col lg:rounded-3xl lg:border lg:border-border lg:bg-card/60">
        <div className="relative flex min-h-0 flex-1 flex-col">
          {selectedPlot ? (
            <PlotDetailView
              plot={selectedPlot}
              activities={data.activities}
              selectedTreeId={selectedTreeId}
              setSelectedTreeId={setSelectedTreeId}
              onBack={closePlot}
              addTree={addTree}
              addTrees={addTrees}
              updateTree={updateTree}
              deleteTree={deleteTree}
              updatePlot={updatePlot}
              deletePlot={(id) => { deletePlot(id); closePlot() }}
              addActivity={addActivity}
              addFinance={addFinance}
              updateBatch={updateBatch}
              deleteBatch={deleteBatch}
            />
          ) : (
            <AllPlotsOverview
              data={data}
              setSelectedPlotId={setSelectedPlotId}
              onAddPlotClick={() => setShowAddPlot(true)}
              onPrint={onPrint}
            />
          )}
        </div>
      </div>
    </div>
  )
}
