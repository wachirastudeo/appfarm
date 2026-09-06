"use client"

import { useState } from "react"
import PestTreatmentPlanner from "./PestTreatmentPlanner"
import { FlaskConical, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { assessIrac, iracActives, iracGroups, IRAC_SOURCE, IRAC_MIXTURES_SOURCE, labelAmount } from "@/lib/irac"

const field = "min-h-12 w-full rounded-md border border-input bg-background px-3 text-base"
const panel = "rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4"
const checks = [
  "ตรวจทะเบียนและฉลากผลิตภัณฑ์สำหรับพืชและแมลงเป้าหมาย รวมถึงข้อห้ามผสม",
  "สารแต่ละตัวมีประสิทธิภาพต่อแมลงเป้าหมายเดียวกัน และใช้ตามอัตราฉลาก ไม่ลดอัตราเพราะผสมหลายตัว",
  "ตรวจประวัติดื้อสารและการดื้อข้ามกลุ่มกับผู้เชี่ยวชาญในพื้นที่ รวมถึงระยะคงฤทธิ์ของแต่ละสาร",
  "ตรวจสูตรผลิตภัณฑ์ คุณภาพน้ำ และความเข้ากันได้ตามผู้ผลิต การทดสอบในภาชนะเล็กไม่ยืนยันความปลอดภัยต่อพืชหรือประสิทธิภาพ",
  "ตรวจระยะเว้นก่อนเก็บเกี่ยว (PHI) ระยะกลับเข้าพื้นที่ (REI) อุปกรณ์ป้องกัน ผึ้ง แหล่งน้ำ และสภาพอากาศตามฉลากทุกผลิตภัณฑ์",
]

export default function InsecticideMixing() {
  const [view, setView] = useState<"guide" | "mix" | "table">("guide")
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previous, setPrevious] = useState<string[]>([])
  const [rate, setRate] = useState("")
  const [basis, setBasis] = useState("20")
  const [water, setWater] = useState("")
  const [unit, setUnit] = useState("มิลลิลิตร")
  const [checked, setChecked] = useState<number[]>([])
  const selected = iracActives.filter(item => selectedIds.includes(item.id))
  const result = assessIrac(selected, previous)
  const mainGroups = [...new Set(iracGroups.map(item => item.mainGroup))]
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const filtered = iracActives.filter(item => (!group || item.mainGroup === group) && words.every(word => `${item.name} ${item.thai} ${item.code} ${item.family} ${item.mechanism}`.toLocaleLowerCase().includes(word)))
  const amount = labelAmount(Number(rate), Number(basis), Number(water))
  const toggle = (id: string) => { setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); setChecked([]) }

  return <div className="min-w-0 space-y-5">
    <header className="rounded-2xl bg-primary/10 p-5 sm:p-6">
      <div className="flex items-center gap-3"><FlaskConical className="shrink-0 text-primary" /><h1 className="text-xl font-bold sm:text-2xl">เลือกสารกำจัดแมลงและดูคู่ผสม</h1></div>
      <p className="mt-2 text-sm text-muted-foreground">เลือกแมลงที่พบ → เลือกสารหลัก → ดูตัวเลือกคู่ผสม</p>
    </header>
    {view !== "guide" && <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-relaxed">
      <strong>เลข IRAC บอกกลไกการออกฤทธิ์ ไม่ได้ยืนยันว่าสารผสมถังเดียวกันได้</strong>
      <p>ข้อมูลนี้ไม่ใช่สูตรพ่นหรือรายการสารที่ขึ้นทะเบียนในทุเรียน/ประเทศไทย ต้องตรวจฉลากผลิตภัณฑ์จริงและคำแนะนำในพื้นที่ก่อนใช้ สารต่างกลุ่มก็อาจดื้อข้ามกลุ่มได้</p>
    </div>}
    <div className="flex flex-wrap gap-2" aria-label="เลือกหน้าข้อมูล">
      <Button onClick={() => setView("guide")} variant={view === "guide" ? "default" : "outline"} aria-pressed={view === "guide"}>เลือกตามแมลง</Button>
      <Button onClick={() => setView("mix")} variant={view === "mix" ? "default" : "outline"} aria-pressed={view === "mix"}>ตรวจเอง / คำนวณ ({selected.length})</Button>
      <Button onClick={() => setView("table")} variant={view === "table" ? "default" : "outline"} aria-pressed={view === "table"}>ตารางสาร IRAC</Button>
    </div>

    <div hidden={view !== "guide"}>
      <PestTreatmentPlanner onInspect={ids => {
        setSelectedIds(ids)
        setChecked([])
        setRate("")
        setBasis("20")
        setWater("")
        setUnit("มิลลิลิตร")
        setView("mix")
      }} />
    </div>

    {view === "mix" && <section className={panel}>
      <h2 className="text-lg font-bold">1. รายการสารที่ต้องการตรวจ</h2>
      <p className="text-sm text-muted-foreground">เลือกสารจากรายการด้านล่าง หากเป็นผลิตภัณฑ์สำเร็จรูปผสม ให้เลือกสารออกฤทธิ์ทุกตัวบนฉลาก รายการนี้เก็บเฉพาะระหว่างเปิดหน้านี้</p>
      {selected.length === 0 ? <p className="rounded-lg bg-muted p-4">ยังไม่ได้เลือกสาร — ค้นหาชื่อแล้วกด “เพิ่ม”</p> : <ul className="space-y-2">{selected.map(item => <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3"><span className="min-w-0 break-words">{item.name} <strong className="text-primary">IRAC {item.code}</strong></span><Button variant="ghost" size="icon" onClick={() => toggle(item.id)} aria-label={`ลบ ${item.name}`}><X size={18} /></Button></li>)}</ul>}
      {selected.length > 0 && <Button variant="outline" onClick={() => { setSelectedIds([]); setChecked([]) }}>ล้างรายการสาร</Button>}
      <div className="space-y-2 rounded-xl border border-border p-4 text-sm" aria-live="polite">
        <h3 className="font-bold">ผลตรวจเบื้องต้นด้านการดื้อสาร</h3>
        {selected.length < 2 && <p>เลือกอย่างน้อย 2 สารเพื่อตรวจกลุ่มซ้ำในการผสม</p>}
        {result.duplicateGroups.length > 0 && <p className="font-semibold text-destructive">พบกลุ่มหลักซ้ำ: {result.duplicateGroups.join(", ")} — เปลี่ยนสารหรือกลุ่มย่อยยังไม่ถือเป็นการเปลี่ยนกลไก เช่น 4A กับ 4C</p>}
        {result.unknown && <p>มีสารกลุ่ม UN / ไม่ทราบกลไก จึงยังสรุปความต่างของกลไกหรือการสลับกลุ่มไม่ได้</p>}
        {selected.length >= 2 && !result.unknown && !result.duplicateGroups.length && <p>ไม่พบเลขกลุ่มหลักซ้ำในรายการที่เลือก เป็นเพียงการตรวจการจัดกลุ่ม ไม่ใช่การรับรองสูตรผสมหรือประสิทธิภาพ</p>}
        {result.repeatedGroups.length > 0 && <p className="font-semibold text-destructive">ซ้ำกับช่วงการใช้ก่อนหน้า: กลุ่ม {result.repeatedGroups.join(", ")} — ทบทวนแผนสำหรับแมลงรุ่นถัดไปกับผู้เชี่ยวชาญ</p>}
      </div>
      <details><summary className="cursor-pointer py-3 font-semibold">2. ตรวจกลุ่มที่ใช้ในช่วงก่อนหน้า ({previous.length} กลุ่ม)</summary>
        <p className="mb-3 text-sm text-muted-foreground">ระบุทุกกลุ่ม รวมสารผสมในช่วงก่อนหน้า วางช่วงการใช้ตามวงจรแมลงและคำแนะนำพื้นที่ ไม่กำหนดจำนวนวันตายตัว หลีกเลี่ยงใช้กลุ่มเดิมกับแมลงรุ่นถัดไป</p>
        <div className="flex flex-wrap gap-2">{mainGroups.filter(code => /^\d+$/.test(code)).map(code => <label key={code} className="flex min-h-12 items-center gap-2 rounded-md border px-3"><input type="checkbox" checked={previous.includes(code)} onChange={() => setPrevious(items => items.includes(code) ? items.filter(item => item !== code) : [...items, code])} />{code}</label>)}</div>
      </details>
    </section>}

    {view !== "guide" && <section className={panel}>
      <h2 className="text-lg font-bold">{view === "table" ? "ตารางสารกำจัดแมลงและไร" : "ค้นหาและเพิ่มสารออกฤทธิ์"}</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div><label htmlFor="irac-search" className="mb-2 flex items-center gap-2 text-sm font-medium"><Search size={16} />ค้นหาชื่อสาร กลุ่ม หรือกลไก</label><Input id="irac-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="เช่น อะบาเมกติน, abamectin, 4A" className="min-h-12 text-base" /><p className="mt-1 text-xs text-muted-foreground">ชื่อไทยรองรับบางสาร หากไม่พบให้ใช้ชื่อสามัญภาษาอังกฤษบนฉลาก</p></div>
        <div><label htmlFor="irac-group" className="mb-2 block text-sm font-medium">กรองกลุ่มหลัก</label><select id="irac-group" className={field} value={group} onChange={event => setGroup(event.target.value)}><option value="">ทุกกลุ่ม</option>{mainGroups.map(code => <option key={code} value={code}>IRAC {code}</option>)}</select></div>
      </div>
      <p className="text-sm text-muted-foreground" role="status">พบ {filtered.length} จาก {iracActives.length} รายการ • {iracGroups.length} หมวด • ข้อมูล IRAC v11.5 (ก.พ. 2026), ตรวจเมื่อ 6 ก.ย. 2026</p>
      <div className="max-h-[32rem] overflow-auto rounded-xl border border-border" tabIndex={0} aria-label="ตารางสาร เลื่อนดูข้อมูลเพิ่มเติม">
        <table className="w-full text-left text-sm"><caption className="sr-only">สารออกฤทธิ์และกลุ่ม IRAC ข้อมูลจำแนกระดับสากล ไม่ยืนยันทะเบียนในประเทศไทย</caption><thead className="sticky top-0 z-10 bg-muted"><tr><th scope="col" className="p-3">สารออกฤทธิ์</th><th scope="col" className="p-3">IRAC</th><th scope="col" className="hidden p-3 md:table-cell">กลุ่มสาร / กลไก</th><th scope="col" className="p-3">เลือก</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-border"><td className="max-w-[10rem] break-words p-3 sm:max-w-xs"><span className="font-medium">{item.name}</span>{item.thai && <span className="mt-1 block text-xs text-muted-foreground">{item.thai}</span>}<details className="mt-2 md:hidden"><summary className="cursor-pointer text-xs text-primary">กลไก / กลุ่มสาร</summary><p className="mt-1 text-xs">{item.family} — {item.mechanism}</p></details></td><td className="p-3 font-bold text-primary">{item.code}</td><td className="hidden max-w-xs p-3 md:table-cell"><p>{item.family}</p><p className="mt-1 text-xs text-muted-foreground">{item.mechanism}</p></td><td className="p-2"><Button className="min-h-11" variant={selectedIds.includes(item.id) ? "secondary" : "outline"} aria-label={`${selectedIds.includes(item.id) ? "นำออก" : "เพิ่ม"} ${item.name}`} aria-pressed={selectedIds.includes(item.id)} onClick={() => toggle(item.id)}>{selectedIds.includes(item.id) ? "นำออก" : "เพิ่ม"}</Button></td></tr>)}</tbody></table>
        {!filtered.length && <div className="space-y-3 p-6 text-center"><p>ไม่พบสารที่ค้นหา ลองชื่อภาษาอังกฤษหรือเลขกลุ่ม</p><Button variant="outline" onClick={() => { setQuery(""); setGroup("") }}>ล้างตัวกรอง</Button></div>}
      </div>
    </section>}

    {view === "mix" && <>
      <section className={panel}><h2 className="text-lg font-bold">3. คำนวณปริมาณจากอัตราฉลาก</h2><p className="text-sm text-muted-foreground">คำนวณผลิตภัณฑ์ทีละตัว ใช้เฉพาะฉลากที่ระบุปริมาณต่อน้ำ ไม่แปลงอัตราต่อไร่ และไม่คำนวณจากเปอร์เซ็นต์สารออกฤทธิ์</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{id:"rate",label:"ปริมาณผลิตภัณฑ์ตามฉลาก",value:rate,set:setRate},{id:"basis",label:"ต่อน้ำตามฉลาก (ลิตร)",value:basis,set:setBasis},{id:"water",label:"น้ำที่ต้องการใช้ (ลิตร)",value:water,set:setWater}].map(input => <div key={input.id}><label className="mb-2 block text-sm" htmlFor={`irac-${input.id}`}>{input.label}</label><Input id={`irac-${input.id}`} type="number" min="0" step="any" inputMode="decimal" value={input.value} onChange={event => input.set(event.target.value)} className="min-h-12 text-base" /></div>)}<div><label htmlFor="irac-unit" className="mb-2 block text-sm">หน่วยตามฉลาก</label><select id="irac-unit" value={unit} onChange={event => setUnit(event.target.value)} className={field}><option>มิลลิลิตร</option><option>กรัม</option></select></div></div>
        <p aria-live="polite" className="rounded-xl bg-muted p-4 font-medium">{amount === null ? "กรอกตัวเลขมากกว่า 0 ให้ครบเพื่อคำนวณ" : `ใช้ผลิตภัณฑ์ ${amount.toLocaleString("th-TH", { maximumSignificantDigits: 6 })} ${unit} สำหรับน้ำ ${water} ลิตร (${rate} × ${water} ÷ ${basis})`}</p>
      </section>
      <section className={panel}><h2 className="text-lg font-bold">4. ตรวจสอบก่อนตัดสินใจใช้</h2><div className="space-y-3">{checks.map((text, index) => <label key={text} className="flex min-h-12 items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={checked.includes(index)} onChange={() => setChecked(items => items.includes(index) ? items.filter(item => item !== index) : [...items, index])} />{text}</label>)}</div><p className="text-sm text-muted-foreground">ตรวจแล้ว {checked.length}/{checks.length} ข้อ — การติ๊กครบไม่ใช่การอนุมัติให้ผสม ใช้การสำรวจแมลงและ IPM ร่วมด้วย ไม่พ่นโดยไม่มีความจำเป็น</p></section>
    </>}
    <footer className="space-y-2 text-xs text-muted-foreground"><p>แหล่งข้อมูล: <a href={IRAC_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Mode of Action</a> · <a href={IRAC_MIXTURES_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Insecticide Mixtures: Key Considerations</a></p><p>ตารางอาจรวมสารที่ห้ามใช้หรือไม่ได้ขึ้นทะเบียนในประเทศ ข้อมูลไม่อัปเดตอัตโนมัติ และไม่ได้ระบุอัตราใช้ ยี่ห้อ หรือความเหมาะสมกับแมลงแต่ละชนิด</p></footer>
  </div>
}
