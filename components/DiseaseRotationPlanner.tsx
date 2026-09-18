"use client"

import { useState } from "react"
import { AlertTriangle, Check, Leaf, RotateCcw, ShieldCheck, Sprout } from "lucide-react"
import { compatibleFungicides } from "@/lib/pest-planner"

const diseases = [
  {
    id: "root-rot",
    name: "โรครากเน่า–โคนเน่า (ไฟทอปธอรา)",
    hint: "โคนฉ่ำน้ำ • เปลือกแตก • ใบร่วง",
    detail: "เชื้อไฟทอปธอรา (Phytophthora) เป็นสาเหตุสำคัญของโรครากเน่า–โคนเน่าในทุเรียน ตรวจโคน ราก และทางระบายน้ำ พร้อมจัดการน้ำและตัดส่วนเป็นโรคร่วมด้วย",
    fungicides: ["metalaxyl"],
    tone: "border-orange-200 from-orange-50 to-white dark:border-orange-800/60 dark:from-orange-950/30 dark:to-card",
  },
  {
    id: "fusarium",
    name: "โรคเหี่ยว / รากเน่า (ฟิวซาเรียม)",
    hint: "ใบเหลืองเหี่ยว • รากสีน้ำตาล • ต้นทรุด",
    detail: "อาการฟิวซาเรียมอาจคล้ายไฟทอปธอรา ภาวะรากขาดอากาศ หรือปัญหาระบบน้ำ ควรตรวจรากและยืนยันสาเหตุก่อนเลือกสาร เพราะคลังข้อมูลนี้ยังไม่มีสารที่ยืนยันสำหรับฟิวซาเรียมในทุเรียน",
    fungicides: [],
    tone: "border-violet-200 from-violet-50 to-white dark:border-violet-800/60 dark:from-violet-950/30 dark:to-card",
  },
  {
    id: "anthracnose",
    name: "โรคแอนแทรคโนส",
    hint: "แผลสีน้ำตาล • ใบและผล",
    detail: "ลดความชื้น ตัดแต่งทรงพุ่ม และเก็บชิ้นส่วนเป็นโรคออกจากแปลงก่อนพิจารณาสาร",
    fungicides: ["azoxystrobin", "difenoconazole", "mancozeb", "propineb"],
    tone: "border-rose-200 from-rose-50 to-white dark:border-rose-800/60 dark:from-rose-950/30 dark:to-card",
  },
  {
    id: "leaf-blight",
    name: "โรคราใบติด / ใบไหม้",
    hint: "ใบติดกัน • แผลลามช่วงชื้น",
    detail: "เปิดทรงพุ่มให้ลมผ่านและหลีกเลี่ยงน้ำค้างบนใบเป็นเวลานาน สำรวจการลามซ้ำหลังฝน",
    fungicides: ["azoxystrobin", "mancozeb"],
    tone: "border-emerald-200 from-emerald-50 to-white dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-card",
  },
  {
    id: "leaf-spot",
    name: "โรคใบจุด",
    hint: "จุดสีน้ำตาล • ใบแก่",
    detail: "แยกจากอาการขาดธาตุหรือพิษสารก่อนใช้ยา เก็บใบป่วยและลดแหล่งสะสมเชื้อในสวน",
    fungicides: ["difenoconazole", "mancozeb", "propineb"],
    tone: "border-sky-200 from-sky-50 to-white dark:border-sky-800/60 dark:from-sky-950/30 dark:to-card",
  },
]

const fracKey = (group: string) => group.replace(/^FRAC\s+/i, "")

export default function DiseaseRotationPlanner() {
  const [diseaseId, setDiseaseId] = useState(diseases[0].id)
  const [currentId, setCurrentId] = useState("")
  const disease = diseases.find(item => item.id === diseaseId) ?? diseases[0]
  const options = compatibleFungicides.filter(item => disease.fungicides.includes(item.id))
  const current = options.find(item => item.id === currentId)
  const rotations = current
    ? options.filter(item => item.id !== current.id && fracKey(item.fracGroup) !== fracKey(current.fracGroup))
    : []
  const sameGroup = current
    ? options.filter(item => item.id !== current.id && fracKey(item.fracGroup) === fracKey(current.fracGroup))
    : []

  const chooseDisease = (id: string) => {
    setDiseaseId(id)
    setCurrentId("")
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-sky-300/40 bg-gradient-to-br from-sky-50 via-emerald-50 to-lime-50 p-5 shadow-[0_12px_34px_rgba(14,116,144,0.08)] sm:p-6 dark:from-sky-950/30 dark:via-emerald-950/20 dark:to-lime-950/15">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white shadow-sm"><Sprout size={23} /></span>
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">FRAC rotation guide</span>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">เลือกโรคที่พบในสวน</h2>
          <p className="mt-1 text-sm text-muted-foreground">ดูตัวอย่างสารในคลังข้อมูล แล้วเทียบกลุ่ม FRAC สำหรับรอบถัดไป</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {diseases.map(item => {
          const active = item.id === diseaseId
          return <button key={item.id} type="button" onClick={() => chooseDisease(item.id)} aria-pressed={active} className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition-all ${item.tone} ${active ? "ring-2 ring-primary shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
            <span className="flex items-center justify-between gap-2"><Leaf size={19} className="text-primary" />{active && <Check size={18} className="text-primary" />}</span>
            <strong className="mt-3 block text-sm">{item.name}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{item.hint}</span>
          </button>
        })}
      </div>
    </section>

    <section className="rounded-3xl border border-primary/15 bg-card p-4 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-6">
      <h3 className="text-lg font-black">{disease.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{disease.detail}</p>
      {options.length === 0 && <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        ยังไม่มีสารสำหรับโรคนี้ในคลังข้อมูล โปรดยืนยันเชื้อกับเจ้าหน้าที่หรือห้องปฏิบัติการ และตรวจฉลากผลิตภัณฑ์ที่ขึ้นทะเบียนก่อนใช้
      </div>}
      {options.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(item => {
          const active = currentId === item.id
          return <button key={item.id} type="button" onClick={() => setCurrentId(active ? "" : item.id)} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/30 dark:bg-sky-950/30" : "border-border hover:border-sky-400/60 hover:bg-sky-50/40 dark:hover:bg-sky-950/15"}`}>
            <span className="flex items-start justify-between gap-2">
              <span><strong className="block text-sm">{item.thai}</strong><span className="text-xs text-muted-foreground">{item.name} · {item.formulation}</span></span>
              <span className="shrink-0 rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-black text-sky-700 dark:text-sky-300">{item.fracGroup}</span>
            </span>
            <span className="mt-3 block text-xs text-muted-foreground">เลือกหากนี่คือสารที่ใช้ล่าสุด</span>
          </button>
        })}
      </div>}
    </section>

    {current && <section className="rounded-3xl border border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-lime-50 p-4 sm:p-6 dark:from-emerald-950/30 dark:to-lime-950/20" aria-live="polite">
      <h3 className="flex items-center gap-2 text-lg font-black"><RotateCcw size={20} className="text-emerald-600" />แผนสลับจาก {current.thai} ({current.fracGroup})</h3>
      {rotations.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rotations.map(item => <div key={item.id} className="rounded-2xl border border-emerald-300 bg-white/80 p-4 dark:border-emerald-800 dark:bg-card/80">
          <span className="flex items-center justify-between gap-2"><strong>{item.thai}</strong><span className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white">{item.fracGroup}</span></span>
          <p className="mt-2 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200"><ShieldCheck size={15} className="shrink-0" />คนละกลุ่ม FRAC กับสารล่าสุด จึงเป็นตัวเลือกสำหรับพิจารณาสลับกลไก</p>
        </div>)}
      </div> : <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">ยังไม่มีสารต่างกลุ่มสำหรับโรคนี้ในคลังข้อมูล ไม่ควรสรุปว่าสารอื่นใช้แทนได้โดยไม่ตรวจฉลากและวินิจฉัยโรค</p>}
      {sameGroup.length > 0 && <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200"><AlertTriangle size={15} className="shrink-0" />{sameGroup.map(item => item.thai).join(", ")} อยู่ {current.fracGroup} เหมือนกัน จึงไม่ถือว่าเปลี่ยนกลุ่ม</p>}
      <p className="mt-4 text-xs text-muted-foreground">ใช้เฉพาะผลิตภัณฑ์ที่ขึ้นทะเบียนกับทุเรียนและโรคเป้าหมายในประเทศไทย ตรวจอัตรา PHI/REI และข้อจำกัดจากฉลากล่าสุดทุกครั้ง</p>
    </section>}
  </div>
}
