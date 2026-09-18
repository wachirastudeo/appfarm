"use client"

import { useState } from "react"
import { AlertTriangle, Check, Leaf, ShieldAlert, Sprout } from "lucide-react"
import { diseaseFungicides, tankMixRules } from "@/lib/pest-planner"

const diseases = [
  {
    id: "root-rot",
    name: "โรครากเน่า–โคนเน่า (ไฟทอปธอรา)",
    hint: "โคนฉ่ำน้ำ • เปลือกแตก • ใบร่วง",
    detail: "เชื้อไฟทอปธอรา (Phytophthora) เป็นสาเหตุสำคัญของโรครากเน่า–โคนเน่าในทุเรียน ตรวจโคน ราก และทางระบายน้ำ พร้อมจัดการน้ำและตัดส่วนเป็นโรคร่วมด้วย",
    fungicides: ["metalaxyl", "fosetyl-aluminium", "metalaxyl-m-mancozeb"],
    tone: "border-orange-200 from-orange-50 to-white dark:border-orange-800/60 dark:from-orange-950/30 dark:to-card",
  },
  {
    id: "fusarium",
    name: "โรคเหี่ยว / รากเน่า (ฟิวซาเรียม)",
    hint: "ใบเหลืองเหี่ยว • รากสีน้ำตาล • ต้นทรุด",
    detail: "อาการฟิวซาเรียมอาจคล้ายไฟทอปธอรา ภาวะรากขาดอากาศ หรือปัญหาระบบน้ำ ควรตรวจรากและยืนยันเชื้อก่อนเลือกสาร ตัวเลือกด้านล่างเป็นสารที่มีข้อมูลต่อเชื้อฟิวซาเรียม แต่ต้องตรวจทะเบียนทุเรียนและโรคเป้าหมายบนฉลากจริง",
    fungicides: ["thiophanate-methyl", "difenoconazole", "carbendazim", "captan", "pyraclostrobin"],
    tone: "border-violet-200 from-violet-50 to-white dark:border-violet-800/60 dark:from-violet-950/30 dark:to-card",
  },
  {
    id: "anthracnose",
    name: "โรคแอนแทรคโนส",
    hint: "แผลสีน้ำตาล • ใบและผล",
    detail: "ลดความชื้น ตัดแต่งทรงพุ่ม และเก็บชิ้นส่วนเป็นโรคออกจากแปลงก่อนพิจารณาสาร",
    fungicides: ["azoxystrobin", "pyraclostrobin", "pyraclostrobin-metiram", "difenoconazole", "mancozeb", "propineb", "thiophanate-methyl", "carbendazim", "captan", "chlorothalonil", "prochloraz"],
    tone: "border-rose-200 from-rose-50 to-white dark:border-rose-800/60 dark:from-rose-950/30 dark:to-card",
  },
  {
    id: "leaf-blight",
    name: "โรคราใบติด / ใบไหม้",
    hint: "ใบติดกัน • แผลลามช่วงชื้น",
    detail: "เปิดทรงพุ่มให้ลมผ่านและหลีกเลี่ยงน้ำค้างบนใบเป็นเวลานาน สำรวจการลามซ้ำหลังฝน",
    fungicides: ["azoxystrobin", "pyraclostrobin", "pyraclostrobin-metiram", "mancozeb", "chlorothalonil", "copper-oxychloride", "copper-hydroxide", "validamycin", "hexaconazole"],
    tone: "border-emerald-200 from-emerald-50 to-white dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-card",
  },
  {
    id: "leaf-spot",
    name: "โรคใบจุด",
    hint: "จุดสีน้ำตาล • ใบแก่",
    detail: "แยกจากอาการขาดธาตุหรือพิษสารก่อนใช้ยา เก็บใบป่วยและลดแหล่งสะสมเชื้อในสวน",
    fungicides: ["pyraclostrobin", "pyraclostrobin-metiram", "difenoconazole", "mancozeb", "propineb", "thiophanate-methyl", "carbendazim", "captan", "chlorothalonil", "copper-oxychloride"],
    tone: "border-sky-200 from-sky-50 to-white dark:border-sky-800/60 dark:from-sky-950/30 dark:to-card",
  },
]

export default function DiseaseRotationPlanner() {
  const [diseaseId, setDiseaseId] = useState(diseases[0].id)
  const disease = diseases.find(item => item.id === diseaseId) ?? diseases[0]
  const options = diseaseFungicides.filter(item => disease.fungicides.includes(item.id))

  const chooseDisease = (id: string) => {
    setDiseaseId(id)
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-sky-300/40 bg-gradient-to-br from-sky-50 via-emerald-50 to-lime-50 p-5 shadow-[0_12px_34px_rgba(14,116,144,0.08)] sm:p-6 dark:from-sky-950/30 dark:via-emerald-950/20 dark:to-lime-950/15">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white shadow-sm"><Sprout size={23} /></span>
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">Disease treatment guide</span>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">เลือกโรคที่พบในสวน</h2>
          <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">เลือกโรคเพื่อดูสารที่เกี่ยวข้อง กลุ่ม FRAC และข้อห้ามผสมที่สำคัญ</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {diseases.map(item => {
          const active = item.id === diseaseId
          return <button key={item.id} type="button" onClick={() => chooseDisease(item.id)} aria-pressed={active} className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition-all ${item.tone} ${active ? "ring-2 ring-primary shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
            <span className="flex items-center justify-between gap-2"><Leaf size={19} className="text-primary" />{active && <Check size={18} className="text-primary" />}</span>
            <strong className="mt-3 block text-base leading-snug">{item.name}</strong>
            <span className="mt-1 block text-sm font-medium leading-relaxed text-muted-foreground">{item.hint}</span>
          </button>
        })}
      </div>
    </section>

    <section className="rounded-3xl border border-primary/15 bg-card p-4 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-6">
      <h3 className="text-xl font-black">{disease.name}</h3>
      <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">{disease.detail}</p>
      {options.length === 0 && <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        ยังไม่มีสารสำหรับโรคนี้ในคลังข้อมูล โปรดยืนยันเชื้อกับเจ้าหน้าที่หรือห้องปฏิบัติการ และตรวจฉลากผลิตภัณฑ์ที่ขึ้นทะเบียนก่อนใช้
      </div>}
      {options.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(item => {
          return <article key={item.id} className="rounded-2xl border border-border p-4 text-left">
            <span className="flex items-start justify-between gap-2">
              <span><strong className="block text-lg leading-snug">{item.thai}</strong><span className="mt-1 block text-sm font-medium text-muted-foreground">{item.name} · {item.formulation}</span></span>
              <span className="shrink-0 rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-black text-sky-700 dark:text-sky-300">{item.fracGroup}</span>
            </span>
            <span className="mt-3 flex flex-wrap gap-1.5">
              {item.popular && <span className="inline-flex rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">ชาวสวนใช้บ่อย</span>}
              <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${item.useStatus === "durian-guidance" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"}`}>{item.useStatus === "durian-guidance" ? "มีคำแนะนำในทุเรียน" : "ต้องตรวจฉลากทุเรียน"}</span>
            </span>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">{item.notes}</p>
          </article>
        })}
      </div>}
    </section>

    <section className="rounded-3xl border border-amber-400/60 bg-amber-50 p-4 sm:p-6 dark:border-amber-800 dark:bg-amber-950/25">
      <h3 className="flex items-center gap-2 text-xl font-black text-amber-950 dark:text-amber-100"><ShieldAlert size={21} />ข้อห้ามผสมที่ต้องตรวจทุกครั้ง</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{tankMixRules.map(rule => <div key={rule.id} className="rounded-2xl border border-amber-300/70 bg-white/80 p-4 dark:border-amber-900 dark:bg-card/70"><strong className="text-base text-amber-950 dark:text-amber-100">{rule.title}</strong><p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{rule.dangerText}</p></div>)}</div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle size={15} className="shrink-0" />ใช้เฉพาะผลิตภัณฑ์ที่ขึ้นทะเบียนกับทุเรียนและโรคเป้าหมาย ตรวจ PHI/REI และข้อจำกัดจากฉลากล่าสุดทุกครั้ง</p>
    </section>
  </div>
}
