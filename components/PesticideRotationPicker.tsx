"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, ChevronDown, FlaskConical, RotateCcw, Search, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPestTreatments, orchardPests } from "@/lib/pest-planner"

type Props = {
  onInspect?: (ids: string[]) => void
}

const popularPesticides = [
  "Thiamethoxam",
  "Emamectin benzoate",
  "Imidacloprid",
  "Dinotefuran",
  "Abamectin",
  "Chlorantraniliprole",
]

const normalizeSearch = (value: string) => value.toLocaleLowerCase("th").replace(/[\s\-_/().]+/g, "")

const editDistance = (left: string, right: string) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0]
    row[0] = leftIndex
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex]
      row[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, row[rightIndex], row[rightIndex - 1]) + 1
      diagonal = above
    }
  }
  return row[right.length]
}

export default function PesticideRotationPicker({ onInspect }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [previousName, setPreviousName] = useState("")
  const [nextName, setNextName] = useState("")

  const pesticides = useMemo(() => {
    const unique = new Map<string, ReturnType<typeof getPestTreatments>[number]>()
    orchardPests.forEach(pest => {
      getPestTreatments(pest.id).forEach(treatment => unique.set(treatment.name, treatment))
    })
    return [...unique.values()].sort((a, b) => a.thai.localeCompare(b.thai, "th"))
  }, [])

  const normalizedQuery = normalizeSearch(searchQuery.trim())
  const filteredPesticides = normalizedQuery
    ? pesticides.map(item => {
      const terms = [item.thai, item.name, item.active.code, item.active.mainGroup]
      const normalizedTerms = terms.map(normalizeSearch)
      const exactIndex = normalizedTerms.findIndex(term => term.startsWith(normalizedQuery))
      const containsIndex = normalizedTerms.findIndex(term => term.includes(normalizedQuery))
      const closestDistance = Math.min(...normalizedTerms.map(term => editDistance(normalizedQuery, term.slice(0, normalizedQuery.length))))
      const tolerance = normalizedQuery.length >= 4 ? Math.max(1, Math.floor(normalizedQuery.length * 0.25)) : 0
      const score = exactIndex >= 0 ? exactIndex : containsIndex >= 0 ? 10 + containsIndex : closestDistance <= tolerance ? 20 + closestDistance : Number.POSITIVE_INFINITY
      return { item, score }
    }).filter(result => Number.isFinite(result.score)).sort((left, right) => left.score - right.score || left.item.thai.localeCompare(right.item.thai, "th")).map(result => result.item)
    : popularPesticides.map(name => pesticides.find(item => item.name === name)).filter((item): item is (typeof pesticides)[number] => Boolean(item))
  const previous = pesticides.find(item => item.name === previousName)
  const supportedPests = previous
    ? orchardPests.filter(pest => pest.treatments.some(treatment => treatment.name === previous.name))
    : []
  const rotations = previous
    ? [...new Map(supportedPests.flatMap(pest => getPestTreatments(pest.id))
      .filter(item => item.name !== previous.name && item.active.mainGroup !== previous.active.mainGroup)
      .map(item => [item.name, item])).values()]
    : []
  const sameGroup = previous
    ? [...new Map(supportedPests.flatMap(pest => getPestTreatments(pest.id))
      .filter(item => item.name !== previous.name && item.active.mainGroup === previous.active.mainGroup)
      .map(item => [item.name, item])).values()]
    : []
  const next = rotations.find(item => item.name === nextName)

  const pestsForTreatment = (name: string) => supportedPests
    .filter(pest => pest.treatments.some(treatment => treatment.name === name))
    .map(pest => pest.name)

  const choosePrevious = (name: string) => {
    setPreviousName(name)
    setSearchQuery("")
    setIsSearchOpen(false)
    setNextName("")
  }

  const reset = () => {
    setSearchQuery("")
    setIsSearchOpen(false)
    setPreviousName("")
    setNextName("")
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-amber-300/50 bg-gradient-to-br from-amber-50 via-lime-50 to-emerald-50 p-5 shadow-[0_14px_36px_rgba(161,98,7,0.09)] sm:p-6 dark:from-amber-950/30 dark:via-lime-950/20 dark:to-emerald-950/25">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-900/15">
            <FlaskConical size={23} aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">เริ่มจากยาที่เคยใช้</span>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">รอบที่แล้วใช้ยาอะไร?</h2>
            <p className="mt-1 text-sm text-muted-foreground">เปิดรายการแล้วเลือกยา ระบบจะแนะนำสารต่างกลุ่มที่ควรสลับใช้ให้ทันที</p>
          </div>
        </div>
        {previous && <Button type="button" variant="outline" size="sm" onClick={reset} className="gap-1.5 font-bold"><RotateCcw size={14} />เลือกใหม่</Button>}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/70 bg-white/75 p-4 dark:border-amber-800 dark:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="pesticide-search" className="text-sm font-black text-amber-900 dark:text-amber-100">เลือกยาที่ใช้รอบที่แล้ว</label>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">{normalizedQuery ? `พบ ${filteredPesticides.length} จาก ${pesticides.length} สาร` : `มี ${pesticides.length} สาร`}</span>
        </div>
        <label htmlFor="pesticide-search" className="mt-3 block text-xs font-bold text-amber-900 dark:text-amber-100">ค้นหายา</label>
        <div className="mt-1.5" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setIsSearchOpen(false) }}>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            <Input
            id="pesticide-search"
            type="search"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={event => { setSearchQuery(event.target.value); setIsSearchOpen(true) }}
            placeholder="ค้นหาชื่อไทย อังกฤษ หรือกลุ่ม IRAC"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearchOpen}
            aria-controls="pesticide-suggestions"
            aria-describedby="pesticide-search-help"
            className="min-h-12 border-amber-300 bg-white pl-10 pr-12 text-base focus-visible:border-amber-600 focus-visible:ring-amber-500/20 dark:border-amber-800 dark:bg-card"
            />
            <button type="button" onClick={() => setIsSearchOpen(open => !open)} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200 dark:hover:bg-amber-950" aria-label={isSearchOpen ? "ปิดรายการยา" : "เปิดรายการยา"} aria-expanded={isSearchOpen} aria-controls="pesticide-suggestions">
              <ChevronDown size={19} className={`transition-transform ${isSearchOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
          {isSearchOpen && <div id="pesticide-suggestions" className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-amber-300 bg-white shadow-lg dark:border-amber-800 dark:bg-card" role="listbox" aria-label="คำแนะนำชื่อยา">
            <p className="sticky top-0 z-10 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 dark:bg-amber-950 dark:text-amber-100">{normalizedQuery ? "คำที่ใกล้เคียง" : "ยาที่ใช้บ่อย"}</p>
            {filteredPesticides.map(item => <button key={item.name} type="button" role="option" aria-selected={previousName === item.name} onClick={() => choosePrevious(item.name)} className={`flex w-full items-center justify-between gap-3 border-t border-amber-100 px-3 py-3 text-left transition-colors hover:bg-amber-50 focus:bg-amber-50 focus:outline-none dark:border-amber-950 dark:hover:bg-amber-950/40 dark:focus:bg-amber-950/40 ${previousName === item.name ? "bg-amber-100 dark:bg-amber-950/60" : ""}`}>
              <span className="min-w-0"><strong className="block text-sm">{item.thai}</strong><span className="block truncate text-xs text-muted-foreground">{item.name} · {item.formulation}</span></span>
              <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-black text-amber-900 dark:bg-amber-950 dark:text-amber-100">IRAC {item.active.code}</span>
            </button>)}
            {!filteredPesticides.length && <p className="p-5 text-center text-sm text-muted-foreground">ยังไม่พบคำใกล้เคียง ลองพิมพ์ชื่อบางส่วนหรือกลุ่ม เช่น 4A</p>}
          </div>}
        </div>
        <p id="pesticide-search-help" className="mt-2 text-xs text-muted-foreground">พิมพ์บางส่วนของชื่อ ระบบจะเดาคำใกล้เคียงขึ้นมาให้กดเลือกทันที</p>
      </div>
    </section>

    {previous && <section className="rounded-3xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-lime-50 to-white p-4 shadow-[0_12px_34px_rgba(20,83,45,0.08)] sm:p-6 dark:from-emerald-950/35 dark:via-lime-950/20 dark:to-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white"><RotateCcw size={13} />แนะนำยาสำหรับรอบนี้</span><h3 className="mt-3 text-lg font-black">ควรสลับจาก {previous.thai} ไปใช้ตัวไหน?</h3><p className="mt-1 text-sm text-muted-foreground">ตัวเลือกด้านล่างเป็นคนละกลุ่มกับ IRAC {previous.active.code} และใช้กับแมลงเป้าหมายเดียวกัน</p></div>
        <span className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-bold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">เปลี่ยนชื่อยาอย่างเดียวอาจยังเป็นกลุ่มเดิม</span>
      </div>

      {rotations.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rotations.map(item => {
        const active = nextName === item.name
        return <button key={item.name} type="button" onClick={() => setNextName(item.name)} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] active:scale-[0.99] ${active ? "border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500/30 shadow-lg dark:bg-emerald-950/50" : "border-emerald-300 bg-white/85 hover:border-emerald-500 hover:shadow-md dark:border-emerald-800 dark:bg-card/80"}`}>
          <span className="flex items-start justify-between gap-2"><span><strong className="block">{item.thai}</strong><span className="text-xs text-muted-foreground">{item.name} · {item.formulation}</span></span><span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white">{active && <Check size={13} />} IRAC {item.active.code}</span></span>
          <span className="mt-2 block text-xs text-muted-foreground">เหมาะกับ: {pestsForTreatment(item.name).join(", ")}</span>
          <span className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200"><ShieldCheck size={15} className="shrink-0" />{active ? "เลือกใช้รอบนี้แล้ว" : "กดเพื่อเลือกใช้รอบนี้"}</span>
        </button>
      })}</div> : <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">ยังไม่มีสารต่างกลุ่มสำหรับแมลงนี้ในคลังข้อมูล โปรดตรวจทะเบียนล่าสุดและปรึกษาเจ้าหน้าที่</p>}

      {sameGroup.length > 0 && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-orange-300 bg-orange-100/70 p-3 text-xs text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100"><ShieldAlert size={16} className="shrink-0" /><span><strong>ไม่นับเป็นการสลับกลุ่ม:</strong> {sameGroup.map(item => `${item.thai} (${item.active.code})`).join(", ")}</span></div>}

      {next && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-500 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-card/90" aria-live="polite">
        <div><span className="text-xs font-bold text-muted-foreground">แผนที่เลือก</span><p className="font-black">รอบก่อน {previous.thai} ({previous.active.code}) <ArrowRight className="mx-1 inline size-4" /> รอบนี้ {next.thai} ({next.active.code})</p></div>
        {onInspect && <Button type="button" onClick={() => onInspect([next.active.id])} className="gap-2 font-black"><FlaskConical size={16} />ตรวจกลุ่มและคำนวณยารอบนี้</Button>}
      </div>}
      <p className="mt-4 text-xs text-muted-foreground">ตรวจฉลาก ทะเบียนสำหรับทุเรียนและแมลงเป้าหมาย อัตราใช้ PHI/REI และสำรวจการระบาดก่อนใช้ทุกครั้ง</p>
    </section>}
  </div>
}
