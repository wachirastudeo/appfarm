"use client"
import { useState } from "react"
import {
  Plot, Tree, FlowerStage, DurianVariety,
  FLOWER_STAGE_LABELS, FLOWER_STAGES, VARIETIES,
  useAppData
} from "@/lib/store"
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
function BulkUpdateModal({ plot, onClose, onUpdate }: {
  plot: Plot; onClose: () => void; onUpdate: (stage: FlowerStage) => void
}) {
  const [stage, setStage] = useState<FlowerStage>(plot.trees[0]?.stage ?? "vegetative")
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border rounded-[2rem] p-6 w-full max-w-[95%] sm:max-w-md shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] flex items-center justify-center">
              <RefreshCw size={20} className="text-[#146B3E]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground leading-tight">อัปเดตทั้งแปลง</h3>
              <p className="text-base text-muted-foreground font-medium">{plot.name} • {plot.trees.length} ต้น</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} className="text-muted-foreground" /></button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
            <label className="text-base font-black text-muted-foreground uppercase tracking-widest mb-2 block">เลือกระยะที่ต้องการเปลี่ยน</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value as FlowerStage)}
              className="w-full bg-background border border-border rounded-xl px-4 py-4 text-foreground text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
            >
              {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-base">!</div>
            <p className="text-base text-amber-800 leading-relaxed font-medium">
              การอัปเดตนี้นี้จะเปลี่ยนระยะของทุเรียน **ทุกต้น** ในแปลงนี้ให้เป็นระยะเดียวกัน
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 border border-border rounded-2xl py-4 text-muted-foreground font-bold hover:bg-muted transition-all">ยกเลิก</button>
          <button 
            onClick={() => { onUpdate(stage); onClose() }} 
            className="flex-2 bg-primary text-primary-foreground rounded-2xl py-4 font-black text-lg shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check size={20} strokeWidth={3} />อัปเดตเลย
          </button>
        </div>
      </div>
    </div>
  )
}

function QRModal({ tree, plot, onClose }: { tree: Tree; plot: Plot; onClose: () => void }) {
  const qrData = JSON.stringify({ plotId: plot.id, plotName: plot.name, treeId: tree.id, treeNumber: tree.treeNumber, variety: tree.variety })
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs text-center shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-foreground mb-1">QR Code ต้นทุเรียน</h3>
        <p className="text-muted-foreground text-base mb-4">{plot.name} · {tree.treeNumber}</p>
        <div className="bg-white p-4 rounded-xl inline-block mb-4 border border-border">
          <QRCodeSVG value={qrData} size={180} />
        </div>
        <p className="text-base text-muted-foreground">{tree.variety} · อายุ {tree.age} ปี</p>
        <button onClick={onClose} className="mt-4 w-full border border-border rounded-lg py-2.5 text-muted-foreground hover:text-foreground transition-colors">ปิด</button>
      </div>
    </div>
  )
}

function AllQRModal({ plot, onClose }: { plot: Plot; onClose: () => void }) {
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
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-3xl shrink-0 print-hide">
            <div>
               <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><QrCode size={20} className="text-[#146B3E]" /> พิมพ์ QR Code ทั้งแปลง</h3>
               <p className="text-base text-muted-foreground mt-0.5">{plot.name} · มีทั้งหมด {plot.trees.length} ต้น</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-muted-foreground hover:text-foreground shadow-sm border border-border">
               <X size={20} />
            </button>
          </div>
          <div id="qr-print-root" className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 bg-white">
            {plot.trees.map(tree => {
              const qrData = JSON.stringify({ plotId: plot.id, plotName: plot.name, treeId: tree.id, treeNumber: tree.treeNumber, variety: tree.variety })
              return (
                <div key={tree.id} className="qr-print-item p-4 flex flex-col items-center justify-center text-center">
                  <h4 className="font-semibold text-base text-muted-foreground mb-1">QR Code ต้นทุเรียน</h4>
                  <p className="font-black text-xl mb-3 text-foreground">{tree.treeNumber}</p>
                  <div className="bg-white mb-3 inline-block">
                    <QRCodeSVG value={qrData} size={120} />
                  </div>
                  <p className="text-base font-medium text-muted-foreground">{plot.name} · {tree.variety}</p>
                </div>
              )
            })}
          </div>
          <div className="p-5 border-t border-border bg-white rounded-b-3xl shrink-0 print-hide">
            <button onClick={() => window.print()} className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all active:scale-95">
               <Printer size={20} /> สั่งพิมพ์ QR Code
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
    age: tree?.age ?? 5,
    stage: (tree?.stage ?? "vegetative") as FlowerStage,
    health: (tree?.health ?? "good") as Tree["health"],
    notes: tree?.notes ?? "",
    batches: tree?.batches ?? [],
  })
  const [addCount, setAddCount] = useState(1)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = () => {
    if (!isAdding) {
      if (form.treeNumber.trim()) onSave({ ...form, treeNumber: form.treeNumber.trim() })
      return
    }

    const count = Math.max(1, Math.min(200, addCount))
    const baseTree = { ...form, treeNumber: form.treeNumber.trim() }
    const items = Array.from({ length: count }, (_, index) => ({
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
          <label className="text-base text-muted-foreground mb-1 block">หมายเลขต้น</label>
          <input value={form.treeNumber} onChange={e => set("treeNumber", e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder={isAdding ? getNextTreeNumber(existingTrees) : "A-001"} />
          {isAdding && <p className="mt-1 text-xs font-semibold text-muted-foreground">เว้นว่างเพื่อรันเลขต่ออัตโนมัติ</p>}
        </div>
        <div>
          <label className="text-base text-muted-foreground mb-1 block">อายุ (ปี)</label>
          <input type="number" value={form.age} onChange={e => set("age", Number(e.target.value))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" min={1} />
        </div>
      </div>
      {isAdding && (
        <div>
          <label className="text-base text-muted-foreground mb-1 block">จำนวนต้นที่เพิ่ม</label>
          <input
            type="number"
            value={addCount}
            onChange={e => setAddCount(Number(e.target.value))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            min={1}
            max={200}
          />
        </div>
      )}
      <div>
        <label className="text-base text-muted-foreground mb-1 block">พันธุ์</label>
        <select value={form.variety} onChange={e => set("variety", e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-base text-muted-foreground mb-1 block">ระยะปัจจุบัน</label>
        <select value={form.stage} onChange={e => set("stage", e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
        </select>
      </div>
      <div>
        <label className="text-base text-muted-foreground mb-1 block">สุขภาพต้น</label>
        <div className="flex gap-2">
          {(["good", "fair", "poor"] as Tree["health"][]).map(h => (
            <button key={h} onClick={() => set("health", h)}
              className={`flex-1 py-2.5 rounded-lg text-base font-medium border transition-colors ${form.health === h ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {HEALTH_LABELS[h]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-base text-muted-foreground mb-1 block">บันทึก</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="บันทึกเพิ่มเติม..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 border border-border rounded-lg py-2.5 text-muted-foreground hover:text-foreground transition-colors">ยกเลิก</button>
        <button onClick={handleSave}
          className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:opacity-90 transition-opacity">บันทึก</button>
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
  const [stageForm, setStageForm] = useState<{stage: FlowerStage, date: string, note: string}>({ stage: 'vegetative', date: new Date().toISOString().split('T')[0], note: '' })
  const [batchForm, setBatchForm] = useState({ name: '', fruitCount: 0 })
  const treeActivities = activities.filter(a => a.treeId === tree.id)

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
          <button onClick={onBack} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <DurianIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground leading-tight">ต้น {tree.treeNumber}</h2>
            <p className="text-muted-foreground text-base font-medium mt-0.5">{plot.name} · {tree.variety} · อายุ {tree.age} ปี</p>
          </div>
        </div>
        <button onClick={() => setShowEdit(!showEdit)} className={`p-2 rounded-xl transition-colors ${showEdit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
          <Pencil size={18} />
        </button>
      </div>

      {/* Stats row */}
      {!showEdit && (
        <div className="flex gap-3 w-full">
          <div className="flex-1 bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
            <span className="text-base uppercase tracking-wider text-muted-foreground font-semibold">สุขภาพ</span>
            <span className="font-bold text-base text-foreground">{HEALTH_LABELS[tree.health]}</span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
            <span className="text-base uppercase tracking-wider text-muted-foreground font-semibold">ระยะดอก</span>
            <span className="font-bold text-base text-foreground">{tree.stage === 'vegetative' ? 'ไม่มี' : FLOWER_STAGE_LABELS[tree.stage]}</span>
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

          {/* Batch Management (The "Form" requested) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                รุ่นดอก/ผล ({tree.batches?.length || 0})
              </h4>
              <button 
                onClick={() => addBatch(plot.id, tree.id, `รุ่นที่ ${(tree.batches?.length || 0) + 1}`)}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-base font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> เพิ่มรุ่น
              </button>
            </div>

            {(!tree.batches || tree.batches.length === 0) ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-base italic">ยังไม่มีการบันทึกรุ่นดอก/ผล</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tree.batches.map(batch => {
                  const latestStage = batch.stages[0]
                  const bloomDate = batch.bloomDate ? new Date(batch.bloomDate) : null
                  const harvestDate = bloomDate ? new Date(bloomDate.getTime() + 120 * 86400000) : null
                  
                  return (
                    <div key={batch.id} className="bg-card border-l-4 border-l-accent rounded-xl p-4 shadow-sm border border-border relative">
                      {activeBatchIdForEdit === batch.id ? (
                        <div className="bg-card border border-border rounded-xl p-4 mb-4">
                          <p className="text-base font-semibold mb-2">แก้ไขข้อมูลรุ่น</p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-base font-bold text-muted-foreground uppercase mb-1 block">ชื่อรุ่น</label>
                              <input value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-base font-bold" placeholder="เช่น รุ่นที่ 1" />
                            </div>
                            <div>
                              <label className="text-base font-bold text-muted-foreground uppercase mb-1 block">จำนวนผลผลิต</label>
                              <div className="relative">
                                <input type="number" value={batchForm.fruitCount} onChange={e => setBatchForm({...batchForm, fruitCount: Number(e.target.value)})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-base font-bold pr-10" placeholder="0" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">ลูก</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => setActiveBatchIdForEdit(null)} className="flex-1 text-base py-2 border border-border rounded-lg">ยกเลิก</button>
                            <button onClick={() => { updateBatch(plot.id, tree.id, batch.id, batchForm); setActiveBatchIdForEdit(null) }} className="flex-1 text-base py-2 bg-primary text-primary-foreground rounded-lg">บันทึก</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-foreground">{batch.name}</h5>
                            <button onClick={() => { setBatchForm({name: batch.name, fruitCount: batch.fruitCount}); setActiveBatchIdForEdit(batch.id) }} className="text-muted-foreground p-1 hover:text-[#146B3E]"><Pencil size={12} /></button>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => deleteBatch(plot.id, tree.id, batch.id)} className="p-2 bg-muted rounded-xl text-muted-foreground hover:text-destructive">
                               <Trash2 size={16} />
                             </button>
                             <button onClick={() => setCollapsedBatches(prev => ({...prev, [batch.id]: !prev[batch.id]}))} className="p-2 bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                               <ChevronRight size={18} className={`transition-transform duration-200 ${collapsedBatches[batch.id] ? '' : 'rotate-90'}`} />
                             </button>
                          </div>
                        </div>
                      )}

                      <div className={`transition-all duration-300 overflow-hidden ${collapsedBatches[batch.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>

                      <div className="flex items-center gap-3 mb-4">
                        {latestStage && (
                          <span className={`text-base px-3 py-1 rounded-full font-bold ${STAGE_BADGE[latestStage.stage]}`}>
                            {FLOWER_STAGE_LABELS[latestStage.stage]}
                          </span>
                        )}
                        <span className="text-base text-muted-foreground flex items-center gap-1">
                          <CalendarDays size={14} /> {latestStage ? new Date(latestStage.date).toLocaleDateString("th-TH") : '-'}
                        </span>
                        <span className="text-base text-[#146B3E] font-bold flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#146B3E]" /> {batch.fruitCount} ลูก
                        </span>
                      </div>

                      {harvestDate && (
                        <div className="flex items-center gap-2 text-destructive font-bold text-base mb-4">
                          <div className="w-4 h-4 rounded-full border-2 border-destructive flex items-center justify-center text-base">!</div>
                          เก็บเกี่ยว: {harvestDate.toLocaleDateString("th-TH")}
                        </div>
                      )}

                      {/* Prediction Box */}
                      {bloomDate && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-white">
                            <CalendarDays size={24} />
                          </div>
                          <div>
                            <p className="text-base text-amber-800 font-bold uppercase">พยากรณ์วันเก็บเกี่ยว (120 วันหลังดอกบาน)</p>
                            <p className="text-lg font-black text-amber-900">{harvestDate?.toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      )}

                      {/* Add next stage form */}
                      {activeBatchIdForStage === batch.id ? (
                        <div className="bg-muted rounded-2xl p-4 mb-6 space-y-3">
                          <p className="font-bold text-base">บันทึกระยะใหม่</p>
                          <select value={stageForm.stage} onChange={e => setStageForm({...stageForm, stage: e.target.value as FlowerStage})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-accent">
                            {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                          </select>
                          <input type="date" value={stageForm.date} onChange={e => setStageForm({...stageForm, date: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-accent" />
                          <input type="text" value={stageForm.note} onChange={e => setStageForm({...stageForm, note: e.target.value})} placeholder="บันทึกเพิ่มเติม (ตัวเลือก)" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-accent" />
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => setActiveBatchIdForStage(null)} className="flex-1 py-2 text-base border border-border rounded-lg text-muted-foreground hover:text-foreground">ยกเลิก</button>
                            <button onClick={() => {
                               addBatchStage(plot.id, tree.id, batch.id, { stage: stageForm.stage, date: new Date(stageForm.date).toISOString(), note: stageForm.note });
                               setActiveBatchIdForStage(null);
                             }} className="flex-1 py-2 text-base bg-primary text-primary-foreground rounded-lg font-bold shadow-md">บันทึก</button>
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
                          className="w-full border-2 border-dashed border-[#146B3E]/35 rounded-2xl py-3 text-[#146B3E] font-bold flex items-center justify-center gap-2 hover:bg-[#E7F3EC]/70 transition-colors mb-6"
                        >
                          <Plus size={18} /> บันทึกระยะถัดไป
                        </button>
                      )}

                      {/* Timeline History */}
                      <div className="space-y-4">
                        <p className="text-base font-bold text-foreground flex items-center gap-2">
                           <History size={14} className="text-muted-foreground" /> ประวัติระยะทั้งหมด
                        </p>
                        <div className="relative pl-6 space-y-4 border-l-2 border-l-muted ml-2">
                          {batch.stages.map((st, idx) => (
                            <div key={st.id} className="relative">
                              <div className={`absolute -left-[1.65rem] top-1.5 w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#146B3E]' : 'bg-secondary'}`} />
                              {activeStageIdForEdit === st.id ? (
                                <div className="bg-white border border-border rounded-2xl p-3 space-y-2">
                                  <select value={stageForm.stage} onChange={e => setStageForm({...stageForm, stage: e.target.value as FlowerStage})} className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-base">
                                    {FLOWER_STAGES.map(s => <option key={s} value={s}>{FLOWER_STAGE_LABELS[s]}</option>)}
                                  </select>
                                  <input type="date" value={stageForm.date} onChange={e => setStageForm({...stageForm, date: e.target.value})} className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-base" />
                                  <input type="text" value={stageForm.note} onChange={e => setStageForm({...stageForm, note: e.target.value})} placeholder="บันทึกเพิ่มเติม" className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-base" />
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={() => setActiveStageIdForEdit(null)} className="flex-1 py-1.5 text-base border border-border rounded-lg text-muted-foreground">ยกเลิก</button>
                                    <button onClick={() => {
                                       updateBatch(plot.id, tree.id, batch.id, {
                                         stages: batch.stages.map(s => s.id === st.id ? { ...s, stage: stageForm.stage, date: new Date(stageForm.date).toISOString(), note: stageForm.note } : s)
                                       });
                                       setActiveStageIdForEdit(null);
                                     }} className="flex-1 py-1.5 text-base bg-primary text-primary-foreground rounded-lg">บันทึก</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white/50 border border-border rounded-2xl p-3 flex items-center justify-between hover:bg-white transition-colors">
                                  <div>
                                    <p className="text-base font-bold text-foreground">{FLOWER_STAGE_LABELS[st.stage]}</p>
                                    <p className="text-base text-muted-foreground">{new Date(st.date).toLocaleDateString("th-TH")}</p>
                                    {st.note && <p className="text-base text-muted-foreground mt-1">📝 {st.note}</p>}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => {
                                      setStageForm({ stage: st.stage, date: st.date.split('T')[0], note: st.note || '' });
                                      setActiveStageIdForEdit(st.id);
                                    }} className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                                    <button onClick={() => {
                                      if (confirm("ลบระยะนี้?")) {
                                        updateBatch(plot.id, tree.id, batch.id, { stages: batch.stages.filter(s => s.id !== st.id) });
                                      }
                                    }} className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
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
             <button onClick={onBack} className="w-full bg-primary text-primary-foreground rounded-[2rem] py-5 font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:opacity-90 transition-all">
                <Check size={24} /> บันทึกข้อมูล
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
  const [plotForm, setPlotForm] = useState({ name: plot.name, area: plot.area, notes: plot.notes ?? "" })

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

      {/* Plot Header */}
      <div className="flex flex-wrap items-start gap-2 sm:gap-3 pb-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors mt-0.5 lg:hidden">
          <ArrowLeft size={18} />
        </button>
        {editingPlot ? (
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={plotForm.name}
                onChange={e => setPlotForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ชื่อแปลง"
              />
              <input
                type="number"
                value={plotForm.area}
                onChange={e => setPlotForm(f => ({ ...f, area: Number(e.target.value) }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                min={0.5}
                step={0.5}
                placeholder="พื้นที่ (ไร่)"
              />
            </div>
            <input
              value={plotForm.notes}
              onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="บันทึกเพิ่มเติม"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingPlot(false)} className="flex-1 border border-border rounded-xl py-2.5 text-muted-foreground font-bold hover:bg-muted/50">ยกเลิก</button>
              <button
                onClick={() => {
                  updatePlot(plot.id, plotForm)
                  setEditingPlot(false)
                }}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 font-bold hover:opacity-90"
              >
                บันทึก
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-foreground">{plot.name}</h2>
              <p className="text-base text-muted-foreground font-medium mt-0.5 leading-relaxed">{plot.area} ไร่{plot.notes ? ` · ${plot.notes}` : ""}</p>
            </div>
            <button onClick={() => { setPlotForm({ name: plot.name, area: plot.area, notes: plot.notes ?? "" }); setEditingPlot(true) }} className="p-2.5 sm:p-3 bg-muted text-primary rounded-2xl hover:bg-primary/10 transition-colors shrink-0">
              <Pencil size={18} />
            </button>
            <button
              onClick={() => {
                if (confirm(`ลบแปลง ${plot.name}? ต้นทุเรียนในแปลงนี้จะถูกลบด้วย`)) {
                  deletePlot(plot.id)
                }
              }}
              className="p-2.5 sm:p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shrink-0"
              title="ลบแปลง"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={() => setShowBulk(true)}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 px-3 py-2.5 sm:flex-none sm:px-5 sm:py-3 bg-[#146B3E] text-white rounded-2xl text-sm sm:text-base font-black hover:bg-[#0F5A34] transition-all shadow-[0_10px_22px_rgba(47,170,98,0.32)] active:scale-95 shrink-0 ring-1 ring-white/30">
              <RefreshCw size={18} strokeWidth={2.8} />อัปเดตทั้งแปลง
            </button>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-card rounded-2xl p-2.5 sm:p-3 text-center border border-border">
          <p className="text-lg sm:text-xl font-black text-foreground leading-none">{plot.trees.length}</p>
          <p className="text-xs sm:text-base text-muted-foreground font-medium mt-1 leading-tight">ต้นทั้งหมด</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-2.5 sm:p-3 text-center border border-emerald-100">
          <p className="text-lg sm:text-xl font-black text-emerald-700 leading-none">{goodCount}</p>
          <p className="text-xs sm:text-base text-emerald-600 font-medium mt-1 leading-tight">สุขภาพดี</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-2.5 sm:p-3 text-center border border-amber-100">
          <p className="text-lg sm:text-xl font-black text-amber-700 leading-none">{fairCount + poorCount}</p>
          <p className="text-xs sm:text-base text-amber-600 font-medium mt-1 leading-tight">ต้องดูแล</p>
        </div>
      </div>

      {/* Add Tree Button */}
      <div className="mb-2 flex gap-2 sm:px-2">
        {addingTree ? (
          <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-base font-semibold text-foreground mb-3">เพิ่มต้นทุเรียน</p>
            <TreeForm
              plotId={plot.id}
              existingTrees={plot.trees}
              onSave={d => { addTree(plot.id, d); setAddingTree(false) }}
              onSaveMany={items => {
                items.forEach(item => addTree(plot.id, item))
                setAddingTree(false)
              }}
              onCancel={() => setAddingTree(false)}
            />
          </div>
        ) : (
          <>
            <button onClick={() => setAddingTree(true)}
              className="flex-1 bg-[#E7F3EC] text-[#146B3E] font-black rounded-2xl px-3 py-3 flex items-center justify-center gap-2 text-sm sm:text-base hover:bg-[#D8EEE2] transition-all border border-[#146B3E]/25 shadow-sm">
              <Plus size={18} strokeWidth={2.5} /> เพิ่มต้นทุเรียน
            </button>
            <button onClick={() => setShowAllQR(true)}
              className="min-w-20 px-3 sm:px-5 bg-white text-foreground rounded-2xl flex flex-col items-center justify-center border border-border shadow-sm hover:bg-muted transition-colors">
              <QrCode size={20} className="mb-1 text-[#146B3E]" />
              <span className="text-xs sm:text-base font-medium leading-none">พิมพ์ QR</span>
            </button>
          </>
        )}
      </div>

      {/* Tree list */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {plot.trees.length === 0 ? (
          <div className="col-span-2 bg-card border border-border rounded-xl p-5 text-center">
            <DurianIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-base">ยังไม่มีต้นทุเรียนในแปลงนี้</p>
          </div>
        ) : plot.trees.map(tree => (
          <div key={tree.id} className={editingTree === tree.id ? "col-span-2" : ""}>
            {editingTree === tree.id ? (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-base font-semibold text-foreground mb-3">แก้ไขข้อมูลต้น {tree.treeNumber}</p>
                <TreeForm
                  plotId={plot.id}
                  tree={tree}
                  onSave={d => { updateTree(plot.id, tree.id, d); setEditingTree(null) }}
                  onCancel={() => setEditingTree(null)}
                />
              </div>
            ) : (
              <div onClick={() => setSelectedTreeId(tree.id)} className="bg-card border border-[#B9DCC8] rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 group hover:border-[#146B3E]/55 hover:shadow-md cursor-pointer transition-all h-full relative">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E7F3EC] flex items-center justify-center shrink-0">
                    <DurianIcon className="h-4 w-4 text-[#146B3E]" />
                  </div>
                  <div className="flex gap-0.5 sm:gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setQrTree(tree)} className="p-1.5 text-[#527060] hover:text-[#146B3E] rounded-md hover:bg-[#E7F3EC] transition-colors" title="QR Code">
                      <QrCode size={14} />
                    </button>
                    <button onClick={() => setEditingTree(tree.id)} className="p-1.5 text-[#527060] hover:text-[#146B3E] rounded-md hover:bg-[#E7F3EC] transition-colors" title="แก้ไข">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteTree(plot.id, tree.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors" title="ลบ">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-0.5 mb-2">
                    <span className="font-bold text-foreground text-base sm:text-lg leading-tight truncate">{tree.treeNumber}</span>
                    <span className="text-xs sm:text-base text-muted-foreground leading-tight truncate">{tree.variety} · {tree.age} ปี</span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className={`text-[11px] sm:text-base px-1.5 py-0.5 rounded-full font-bold leading-tight ${STAGE_BADGE[tree.stage] || "bg-muted text-muted-foreground"}`}>
                      {FLOWER_STAGE_LABELS[tree.stage]}
                    </span>
                    <span className={`text-[11px] sm:text-base px-1.5 py-0.5 rounded-full font-bold leading-tight ${HEALTH_BG[tree.health]}`}>
                      {HEALTH_LABELS[tree.health]}
                    </span>
                  </div>
                  {tree.notes && <p className="text-xs sm:text-base text-muted-foreground mt-2 italic line-clamp-2">{tree.notes}</p>}
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
  const [plotForm, setPlotForm] = useState({ name: "", area: 1, notes: "" })

  const handleAddPlot = () => {
    if (!plotForm.name) return
    addPlot(plotForm)
    setPlotForm({ name: "", area: 1, notes: "" })
    setShowAddPlot(false)
  }

  const selectedPlot = data.plots.find(p => p.id === selectedPlotId)

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[600px]">
      {/* Left Column: Plot List (Sticky on desktop) */}
      <div className={`w-full lg:w-64 shrink-0 space-y-3 lg:sticky lg:top-4 ${selectedPlotId ? 'hidden lg:block' : 'block'}`}>
        <div className="relative overflow-hidden rounded-2xl bg-[#146B3E] p-3 text-white shadow-sm">
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
          <button onClick={() => setShowAddPlot(v => !v)}
            className="flex items-center gap-1 bg-[#E7F3EC] text-[#146B3E] px-2 py-1.5 rounded-xl text-[11px] font-black hover:bg-white transition-colors shadow-sm">
            {showAddPlot ? <X size={14} /> : <Plus size={14} />}
            {showAddPlot ? "ยกเลิก" : "เพิ่มแปลง"}
          </button>
          </div>
        </div>

        {showAddPlot && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-semibold text-foreground text-sm">เพิ่มแปลงใหม่</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ชื่อแปลง</label>
                <input value={plotForm.name} onChange={e => setPlotForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="เช่น แปลง A" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">พื้นที่ (ไร่)</label>
                <input type="number" value={plotForm.area} onChange={e => setPlotForm(f => ({ ...f, area: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" min={0.5} step={0.5} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">บันทึก</label>
              <input value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="บันทึกเพิ่มเติม..." />
            </div>
            <button onClick={handleAddPlot} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all">บันทึกแปลงใหม่</button>
          </div>
        )}

        {data.plots.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <DurianIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">ยังไม่มีแปลงทุเรียน กดเพิ่มแปลงเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.plots.map(plot => {
              const goodCount = plot.trees.filter(t => t.health === "good").length
              const issueCount = plot.trees.filter(t => t.health !== "good").length
              const isActive = selectedPlotId === plot.id
              return (
                <button
                  key={plot.id}
                  onClick={() => setSelectedPlotId(plot.id)}
                  className={`min-h-[5.75rem] rounded-2xl bg-white p-3 text-left transition-all group relative overflow-hidden ${
                    isActive 
                      ? "border-2 border-[#146B3E] shadow-sm"
                      : "border border-[#DDEBE1] hover:border-[#9BC7AA] hover:shadow-sm"
                  }`}
                >
                  <div className="relative flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#146B3E] text-white' : 'bg-[#E7F3EC] text-[#146B3E]'}`}>
                        <DurianIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-black text-base leading-tight ${isActive ? 'text-[#146B3E]' : 'text-[#143422]'}`}>{plot.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#527060] font-bold">{plot.area} ไร่ · {plot.trees.length} ต้น</p>
                      </div>
                    </div>
                    <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${isActive ? "bg-[#146B3E] text-white" : "bg-[#F2F8F4] text-[#527060] group-hover:bg-[#146B3E] group-hover:text-white"} transition-colors`}>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black border border-emerald-100">ดี {goodCount}</span>
                    {issueCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-black border border-amber-100">ดูแล {issueCount}</span>
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
          <div className="bg-card border border-border rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-6 md:rounded-[2.5rem] md:p-8 shadow-sm">
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
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-border rounded-[2.5rem] p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <DurianIcon className="h-10 w-10 text-muted-foreground/40" />
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
