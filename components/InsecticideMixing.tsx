"use client"

import { useState } from "react"
import PestTreatmentPlanner from "./PestTreatmentPlanner"
import DiseaseRotationPlanner from "./DiseaseRotationPlanner"
import PesticideRotationPicker from "./PesticideRotationPicker"
import { Bug, FlaskConical, Leaf, Search, ShieldAlert, ShieldCheck, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { iracActives, iracGroups, IRAC_SOURCE, IRAC_MIXTURES_SOURCE } from "@/lib/irac"

const field = "min-h-12 w-full rounded-md border border-input bg-background px-3 text-base"
const panel = "space-y-4 rounded-3xl border border-primary/15 bg-card p-4 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-6"

export default function InsecticideMixing() {
  const [view, setView] = useState<"drug" | "problems" | "table">("drug")
  const [problemKind, setProblemKind] = useState<"insect" | "disease">("insect")
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState("")
  const mainGroups = [...new Set(iracGroups.map(item => item.mainGroup))]
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const filtered = iracActives.filter(item => (!group || item.mainGroup === group) && words.every(word => `${item.name} ${item.thai} ${item.code} ${item.family} ${item.mechanism}`.toLocaleLowerCase().includes(word)))
  const views = [
    { id: "drug" as const, label: "เลือกตามยา", detail: "ระบุยารอบที่แล้ว", icon: FlaskConical, tone: "from-amber-600 to-orange-500" },
    { id: "problems" as const, label: "โรคและแมลง", detail: "ปัญหาหลักในสวนทุเรียน", icon: Bug, tone: "from-emerald-600 to-teal-500" },
    { id: "table" as const, label: "ตาราง IRAC", detail: "ค้นหากลุ่มสาร", icon: Table2, tone: "from-sky-600 to-cyan-500" },
  ]

  return <div data-page="mixing" className="min-w-0 space-y-5 pb-10">
    <header className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 p-5 text-white shadow-[0_22px_55px_rgba(20,83,45,0.22)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-14 -top-16 size-56 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 size-52 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black tracking-wide text-lime-100 backdrop-blur-sm">
          <ShieldCheck size={14} aria-hidden="true" /> IRAC SMART PLANNER
        </span>
        <div className="mt-4 flex items-start gap-3 sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-emerald-950 shadow-lg shadow-black/15 sm:size-14">
            <FlaskConical size={28} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">สลับยาอย่างเป็นระบบ</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-emerald-50/90 sm:text-base">
              เริ่มจากยาที่ใช้ล่าสุด หรือเลือกโรคและแมลงหลักที่พบบ่อยในสวนทุเรียน
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white sm:text-sm">
          <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">สลับกลุ่ม IRAC / FRAC</span>
          <span className="rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/15">โรคและแมลงหลัก</span>
          <span className="rounded-full bg-amber-300 px-3 py-1.5 text-emerald-950">เลือกง่าย ไม่ซับซ้อน</span>
        </div>
      </div>
    </header>

    <nav className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="เลือกหน้าข้อมูล">
      {views.map(item => {
        const Icon = item.icon
        const isActive = view === item.id
        return <button
          key={item.id}
          type="button"
          onClick={() => setView(item.id)}
          aria-pressed={isActive}
          className={`group flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition-[border-color,background-color,box-shadow,transform] active:scale-[0.98] sm:p-4 ${isActive ? "border-primary/30 bg-card shadow-[0_12px_28px_rgba(20,83,45,0.10)] ring-2 ring-primary/15" : "border-border bg-card/70 hover:border-primary/30 hover:bg-card"}`}
        >
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-black text-foreground">{item.label}</span>
            <span className="block text-xs font-medium text-muted-foreground">{item.detail}</span>
          </span>
          {isActive && <span className="ml-auto size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden="true" />}
        </button>
      })}
    </nav>

    {view === "drug" && <PesticideRotationPicker />}

    {view === "problems" && <div className="space-y-5">
      <section className="rounded-3xl border border-primary/15 bg-card p-3 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-4">
        <div className="grid grid-cols-2 gap-2" aria-label="เลือกประเภทปัญหาในสวน">
          <button type="button" onClick={() => setProblemKind("insect")} aria-pressed={problemKind === "insect"} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black transition-[border-color,background-color,box-shadow] ${problemKind === "insect" ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-100"}`}>
            <Bug size={19} aria-hidden="true" /> แมลงหลัก 8 ชนิด
          </button>
          <button type="button" onClick={() => setProblemKind("disease")} aria-pressed={problemKind === "disease"} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black transition-[border-color,background-color,box-shadow] ${problemKind === "disease" ? "border-sky-600 bg-sky-600 text-white shadow-md" : "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-400 dark:border-sky-800 dark:bg-sky-950/25 dark:text-sky-100"}`}>
            <Leaf size={19} aria-hidden="true" /> โรคหลัก 5 โรค
          </button>
        </div>
      </section>
      {problemKind === "insect" ? <PestTreatmentPlanner guideOnly /> : <DiseaseRotationPlanner />}
    </div>}

    {view === "table" && <>
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-sm leading-relaxed text-amber-950 dark:from-amber-950/35 dark:to-orange-950/25 dark:text-amber-100">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><ShieldAlert size={19} aria-hidden="true" /></span>
        <div><strong>IRAC บอกกลไกการออกฤทธิ์ แต่ไม่ได้ยืนยันว่าสารผสมถังเดียวกันได้</strong>
        <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">ข้อมูลนี้ไม่ใช่สูตรพ่นหรือรายการสารที่ขึ้นทะเบียนในทุเรียน/ประเทศไทย ต้องตรวจฉลากผลิตภัณฑ์จริงและคำแนะนำในพื้นที่ก่อนใช้</p></div>
      </div>
      <section className={panel}>
        <h2 className="text-lg font-bold">ตารางสารกำจัดแมลงและไร</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div><label htmlFor="irac-search" className="mb-2 flex items-center gap-2 text-sm font-medium"><Search size={16} />ค้นหาชื่อสาร กลุ่ม หรือกลไก</label><Input id="irac-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="เช่น อะบาเมกติน, abamectin, 4A" className="min-h-12 text-base" /><p className="mt-1 text-xs text-muted-foreground">ชื่อไทยรองรับบางสาร หากไม่พบให้ใช้ชื่อสามัญภาษาอังกฤษบนฉลาก</p></div>
          <div><label htmlFor="irac-group" className="mb-2 block text-sm font-medium">กรองกลุ่มหลัก</label><select id="irac-group" className={field} value={group} onChange={event => setGroup(event.target.value)}><option value="">ทุกกลุ่ม</option>{mainGroups.map(code => <option key={code} value={code}>IRAC {code}</option>)}</select></div>
        </div>
        <p className="text-sm text-muted-foreground" role="status">พบ {filtered.length} จาก {iracActives.length} รายการ • {iracGroups.length} หมวด • ข้อมูล IRAC v11.5 (ก.พ. 2026), ตรวจเมื่อ 6 ก.ย. 2026</p>
        <div className="max-h-[32rem] overflow-auto rounded-xl border border-border" tabIndex={0} aria-label="ตารางสาร เลื่อนดูข้อมูลเพิ่มเติม">
          <table className="w-full text-left text-sm"><caption className="sr-only">สารออกฤทธิ์และกลุ่ม IRAC ข้อมูลจำแนกระดับสากล ไม่ยืนยันทะเบียนในประเทศไทย</caption><thead className="sticky top-0 z-10 bg-muted"><tr><th scope="col" className="p-3">สารออกฤทธิ์</th><th scope="col" className="p-3">IRAC</th><th scope="col" className="hidden p-3 md:table-cell">กลุ่มสาร / กลไก</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-border"><td className="max-w-[10rem] break-words p-3 sm:max-w-xs"><span className="font-medium">{item.name}</span>{item.thai && <span className="mt-1 block text-xs text-muted-foreground">{item.thai}</span>}<details className="mt-2 md:hidden"><summary className="cursor-pointer text-xs text-primary">กลไก / กลุ่มสาร</summary><p className="mt-1 text-xs">{item.family} — {item.mechanism}</p></details></td><td className="p-3 font-bold text-primary">{item.code}</td><td className="hidden max-w-xs p-3 md:table-cell"><p>{item.family}</p><p className="mt-1 text-xs text-muted-foreground">{item.mechanism}</p></td></tr>)}</tbody></table>
          {!filtered.length && <div className="space-y-3 p-6 text-center"><p>ไม่พบสารที่ค้นหา ลองชื่อภาษาอังกฤษหรือเลขกลุ่ม</p><Button variant="outline" onClick={() => { setQuery(""); setGroup("") }}>ล้างตัวกรอง</Button></div>}
        </div>
      </section>
    </>}

    <footer className="space-y-2 text-xs text-muted-foreground"><p>แหล่งข้อมูล: <a href={IRAC_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Mode of Action</a> · <a href={IRAC_MIXTURES_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Insecticide Mixtures: Key Considerations</a></p><p>ตารางอาจรวมสารที่ห้ามใช้หรือไม่ได้ขึ้นทะเบียนในประเทศ ข้อมูลไม่อัปเดตอัตโนมัติ และไม่ได้ระบุอัตราใช้ ยี่ห้อ หรือความเหมาะสมกับแมลงแต่ละชนิด</p></footer>
  </div>
}
