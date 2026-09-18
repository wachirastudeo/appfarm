"use client"

import { useState } from "react"
import {
  ArrowRight,
  Bug,
  Check,
  ChevronLeft,
  FlaskConical,
  Leaf,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Egg,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  documentedPremixes,
  getPestPartners,
  getPestTreatments,
  orchardPests,
  compatibleFungicides,
  tankMixRules,
  tankMixingOrder,
  calculateTankDose,
  type CompatibleFungicide,
} from "@/lib/pest-planner"

const panel = "rounded-3xl border border-primary/15 bg-card p-4 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-6"
const selectedStyle = "border-primary bg-gradient-to-br from-primary/15 to-emerald-500/5 ring-2 ring-primary/50 shadow-[0_12px_28px_rgba(20,83,45,0.12)]"
const normalStyle = "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-[0_10px_24px_rgba(20,83,45,0.08)] transition-[border-color,background-color,box-shadow]"

const TANK_PRESETS = [20, 200, 1000]
const PEST_TONES = [
  { card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800/60 dark:from-emerald-950/35 dark:to-card", icon: "bg-emerald-500 text-white", tag: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
  { card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-800/60 dark:from-amber-950/30 dark:to-card", icon: "bg-amber-500 text-white", tag: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" },
  { card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white dark:border-sky-800/60 dark:from-sky-950/30 dark:to-card", icon: "bg-sky-500 text-white", tag: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200" },
  { card: "border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:border-orange-800/60 dark:from-orange-950/30 dark:to-card", icon: "bg-orange-500 text-white", tag: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200" },
  { card: "border-teal-200 bg-gradient-to-br from-teal-50 to-white dark:border-teal-800/60 dark:from-teal-950/30 dark:to-card", icon: "bg-teal-500 text-white", tag: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200" },
  { card: "border-lime-200 bg-gradient-to-br from-lime-50 to-white dark:border-lime-800/60 dark:from-lime-950/30 dark:to-card", icon: "bg-lime-600 text-white", tag: "bg-lime-100 text-lime-900 dark:bg-lime-900/50 dark:text-lime-200" },
]

const PART_TONES: Record<string, string> = {
  "ทั้งหมด": "border-primary/25 bg-primary/10 text-primary",
  "ยอดอ่อน": "border-lime-300 bg-lime-100 text-lime-900 dark:border-lime-700 dark:bg-lime-950/50 dark:text-lime-200",
  "ดอก": "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  "ผล": "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-200",
  "ใบ": "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
}

export default function PestTreatmentPlanner({ onInspect, guideOnly = false }: { onInspect?: (ids: string[]) => void; guideOnly?: boolean }) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedPart, setSelectedPart] = useState<string>("ทั้งหมด")
  const [eggControlOnly, setEggControlOnly] = useState(false)
  const [pestId, setPestId] = useState("")
  const [primaryName, setPrimaryName] = useState("")
  const [rotationName, setRotationName] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [selectedFungicideId, setSelectedFungicideId] = useState<string>("")
  const [tankLiters, setTankLiters] = useState<number>(200)
  const [planKind, setPlanKind] = useState<"solo" | "tank" | "premix">("solo")

  const pest = orchardPests.find(item => item.id === pestId)
  const treatments = getPestTreatments(pestId, guideOnly)
  const eggControlTreatments = treatments.filter(item => item.controlsEggs)
  const previousTreatment = treatments.find(item => item.name === primaryName)
  const rotationTreatment = treatments.find(item => item.name === rotationName)
  const primary = rotationTreatment ?? previousTreatment
  const previousPartners = getPestPartners(pestId, primaryName)
  const rotationPartners = previousTreatment ? previousPartners.filter(item => item.active.mainGroup !== previousTreatment.active.mainGroup) : []
  const sameGroupPartners = previousTreatment ? previousPartners.filter(item => item.active.mainGroup === previousTreatment.active.mainGroup) : []
  const partners = getPestPartners(pestId, primary?.name ?? "")
  const partner = partners.find(item => item.name === partnerName)
  const premix = documentedPremixes.find(item => item.pestId === pestId && item.actives.includes(primary?.name ?? ""))
  const fungicide = compatibleFungicides.find(item => item.id === selectedFungicideId)

  // Filter pests by search query and target plant part
  const filteredPests = orchardPests.filter(item => {
    const matchesSearch = `${item.name} ${item.hint} ${item.symptoms}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesPart = selectedPart === "ทั้งหมด" || item.targetParts.some(p => p.includes(selectedPart))
    const matchesEggControl = !eggControlOnly || item.treatments.some(treatment => treatment.controlsEggs)
    return matchesSearch && matchesPart && matchesEggControl
  })

  const choosePest = (id: string) => {
    setPestId(id)
    setPrimaryName("")
    setRotationName("")
    setPartnerName("")
    setSelectedFungicideId("")
    setPlanKind("solo")
    setStep(2)
  }

  const choosePrimary = (name: string) => {
    setPrimaryName(name)
    setRotationName("")
    setPartnerName("")
    setPlanKind("solo")
    setStep(3)
  }

  const chooseRotation = (name: string) => {
    setRotationName(name)
    setPartnerName("")
    setSelectedFungicideId("")
    setPlanKind("solo")
  }

  const resetAll = () => {
    setStep(1)
    setPestId("")
    setPrimaryName("")
    setRotationName("")
    setPartnerName("")
    setSelectedFungicideId("")
    setPlanKind("solo")
    setSearch("")
    setSelectedPart("ทั้งหมด")
    setEggControlOnly(false)
  }

  return (
    <div className="space-y-6">
      {/* Modern Step Navigation */}
      {!guideOnly && <nav aria-label="ขั้นตอนเลือกสาร" className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { num: 1, label: "1. เลือกแมลง", sub: pest?.name || "ระบุศัตรูพืช", active: step === 1, done: step > 1, disabled: false },
          { num: 2, label: "2. ยารอบที่แล้ว", sub: previousTreatment?.thai || "เลือกสารที่เคยใช้", active: step === 2, done: step > 2, disabled: !pest },
          { num: 3, label: "3. เลือกยารอบใหม่", sub: rotationTreatment?.thai || "สลับกลุ่ม IRAC", active: step === 3, done: false, disabled: !previousTreatment },
        ].map(item => (
          <button
            key={item.num}
            type="button"
            disabled={item.disabled}
            onClick={() => setStep(item.num)}
            className={`flex min-h-20 flex-col items-start justify-center rounded-2xl border p-3 text-left transition-[border-color,background-color,box-shadow,transform] active:scale-[0.98] sm:p-4 ${
              item.active
                ? selectedStyle
                : item.done
                ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                : normalStyle
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <div className="flex items-center gap-1.5 w-full">
              <span className={`flex size-5 sm:size-6 items-center justify-center rounded-full text-xs font-bold ${
                item.active ? "bg-primary text-primary-foreground" : item.done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {item.done ? <Check size={12} strokeWidth={3} /> : item.num}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">{item.label}</span>
            </div>
            <span className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate max-w-full font-medium pl-6 sm:pl-7">
              {item.sub}
            </span>
          </button>
        ))}
      </nav>}

      {/* STEP 1: SELECT PEST */}
      {step === 1 && (
        <section className={`${panel} space-y-4`}>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 p-4 shadow-sm sm:p-5 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:via-lime-950/25 dark:to-amber-950/25">
            <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-900/15">
                  <Bug size={22} aria-hidden="true" />
                </span>
                <div>
                  <span className="inline-flex rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black text-amber-800 dark:text-amber-200">ขั้นตอนที่ 1 · สำรวจสวน</span>
                  <h2 className="mt-1 text-lg font-black text-emerald-950 sm:text-xl dark:text-emerald-50">
                    พบแมลงศัตรูพืชชนิดไหนในสวนทุเรียน?
                  </h2>
                  <p className="mt-1 text-xs font-medium text-emerald-900/70 sm:text-sm dark:text-emerald-100/70">
                    {guideOnly ? "เลือกแมลงที่พบเพื่อดูสารกำจัด กลุ่ม IRAC และข้อห้ามผสมที่สำคัญ" : "เลือกแมลงที่พบเพื่อดูสารกำจัดและคู่ผสมที่เหมาะสมตามหลักวิชาการ"}
                  </p>
                </div>
              </div>
              {/* Filter by plant part */}
              <div className="flex flex-wrap gap-2" aria-label="กรองตามส่วนของต้นทุเรียน">
                {["ทั้งหมด", "ยอดอ่อน", "ดอก", "ผล", "ใบ"].map(part => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setSelectedPart(part)}
                    aria-pressed={selectedPart === part}
                    className={`min-h-10 rounded-full border px-3 py-1 text-xs font-bold transition-[background-color,border-color,box-shadow,transform] active:scale-95 ${
                      selectedPart === part ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20" : `${PART_TONES[part]} hover:shadow-sm`
                    }`}
                  >
                    {part}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEggControlOnly(value => !value)}
                  aria-pressed={eggControlOnly}
                  className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-[background-color,border-color,box-shadow,transform] active:scale-95 ${
                    eggControlOnly
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm ring-2 ring-violet-500/20"
                      : "border-violet-300 bg-violet-100 text-violet-900 hover:shadow-sm dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200"
                  }`}
                >
                  <Egg size={14} aria-hidden="true" /> มียาคุมไข่
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 size-4 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            <Input
              id="pest-search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อแมลง หรืออาการ เช่น เพลี้ยไฟ, ยอดหงิก, ไรแดง, ผงขาว, ขี้หนอน..."
              className="min-h-12 rounded-xl border-sky-200 bg-sky-50/60 pl-9 text-sm focus-visible:border-sky-500 focus-visible:ring-sky-500/25 sm:text-base dark:border-sky-800/60 dark:bg-sky-950/20"
            />
          </div>

          {/* Pest Cards Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPests.map((item, index) => {
              const tone = PEST_TONES[index % PEST_TONES.length]
              const eggControlCount = item.treatments.filter(treatment => treatment.controlsEggs).length
              return (
              <button
                type="button"
                key={item.id}
                onClick={() => choosePest(item.id)}
                className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,83,45,0.11)] active:scale-[0.99] ${
                  item.id === pestId ? selectedStyle : tone.card
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-9 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105 ${tone.icon}`}>
                        <Bug size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-black text-base text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-primary font-medium">{item.hint}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Target parts tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.targetParts.map(part => (
                      <span key={part} className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${tone.tag}`}>
                        {part}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.symptoms}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground font-medium">
                    มียาแนะนำ {item.treatments.length} ชนิด
                    {eggControlCount > 0 && <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-violet-500/15 px-1.5 py-0.5 font-bold text-violet-700 dark:text-violet-300"><Egg size={12} aria-hidden="true" />คุมไข่ {eggControlCount}</span>}
                  </span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    เลือกแมลงนี้ <ArrowRight size={13} />
                  </span>
                </div>
              </button>
              )
            })}
          </div>

          {!filteredPests.length && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
              <p>ไม่พบแมลงตามคำค้นหา &ldquo;{search}&rdquo;</p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedPart("ทั้งหมด") }}>
                ล้างคำค้นหา
              </Button>
            </div>
          )}
        </section>
      )}

      {/* STEP 2: SELECT PRIMARY CHEMICAL */}
      {step === 2 && pest && (
        <section className={`${panel} space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Bug size={15} /> ศัตรูพืชเป้าหมาย: {pest.name}
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-black">
                {guideOnly ? `ยาที่ใช้กับ${pest.name}` : "รอบที่แล้วใช้ยาอะไร?"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {guideOnly ? "ดูชื่อสาร กลุ่ม IRAC สูตร และข้อมูลการใช้เบื้องต้น ไม่ใช่หน้าวางแผนสลับกลุ่ม" : "เลือกสารที่ใช้ล่าสุด 1 ตัว ระบบจะตัดยากลุ่มเดิมออกและแนะนำยาสำหรับรอบใหม่"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1 font-bold">
              <ChevronLeft size={15} /> เปลี่ยนแมลง
            </Button>
          </div>

          {/* Pest Info & Cultural tips */}
          <div className="rounded-xl bg-muted/60 p-4 text-xs sm:text-sm space-y-2 leading-relaxed border border-border/50">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Info size={16} className="text-primary" /> อาการระบาดและจุดสังเกต:
            </div>
            <p className="text-muted-foreground">{pest.symptoms}</p>
            <div className="pt-1.5 flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <Leaf size={15} className="shrink-0 mt-0.5" />
              <span>{pest.beforeSpraying}</span>
            </div>
          </div>

          {eggControlTreatments.length > 0 && (
            <div className="rounded-2xl border border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 dark:border-violet-800 dark:from-violet-950/35 dark:to-fuchsia-950/20">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><Egg size={20} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h3 className="font-black text-violet-950 dark:text-violet-100">ตัวอย่างยาคุมไข่/ตัวอ่อนสำหรับ {pest.name}</h3>
                  <p className="mt-1 text-xs text-violet-900/70 dark:text-violet-200/75">เหมาะกับการวางแผนช่วงพบไข่หรือตัวอ่อน ไม่ใช่ยาน็อกตัวเต็มวัยทุกชนิด ควรสำรวจระยะของแมลงและตรวจฉลากก่อนใช้</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eggControlTreatments.map(item => (
                      <span key={item.name} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-violet-300 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-violet-950 dark:border-violet-800 dark:bg-card/70 dark:text-violet-100">
                        {item.thai} <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-800 dark:bg-violet-900 dark:text-violet-200">IRAC {item.active.code}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chemical Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {treatments.map(item => {
              const isSelected = primaryName === item.name
              return (
                <div
                  key={item.name}
                  onClick={guideOnly ? undefined : () => choosePrimary(item.name)}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${guideOnly ? "" : "cursor-pointer"} ${
                    isSelected ? selectedStyle : normalStyle
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-foreground">{item.thai}</h3>
                        <p className="text-xs text-muted-foreground break-words">{item.name}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary border border-primary/20">
                        IRAC {item.iracLabel ?? item.active.code}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.actionType && (
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          item.actionType === "ดูดซึม"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : item.actionType === "สัมผัสตาย"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : item.actionType === "ยับยั้งการลอกคราบ"
                            ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                            : "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                        }`}>
                          {item.actionType}
                        </span>
                      )}
                      {item.controlsEggs && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-300">
                          <Egg size={12} aria-hidden="true" /> คุมไข่/ตัวอ่อน
                        </span>
                      )}
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        สูตร {item.formulation}
                      </span>
                      {item.ratePer20L && (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          {item.ratePer20L} {item.unit || "ซีซี"} / 20 ลิตร
                        </span>
                      )}
                    </div>

                    {item.highlight && (
                      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                        <span>{item.highlight}</span>
                      </p>
                    )}
                  </div>

                  {!guideOnly && <div className="mt-4 pt-3 border-t border-border/60">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between font-bold text-xs sm:text-sm h-10"
                      onClick={e => {
                        e.stopPropagation()
                        choosePrimary(item.name)
                      }}
                    >
                      <span>{isSelected ? "ยาที่ใช้รอบที่แล้ว" : "เลือกว่าใช้รอบที่แล้ว"}</span>
                      <ArrowRight size={15} />
                    </Button>
                  </div>}
                </div>
              )
            })}
          </div>
          {guideOnly && <div className="rounded-2xl border border-amber-400/60 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/25">
            <h3 className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-100"><ShieldAlert size={18} />ข้อห้ามผสมที่ต้องตรวจทุกครั้ง</h3>
            <div className="mt-3 space-y-2">{tankMixRules.map(rule => <div key={rule.id} className="rounded-xl border border-amber-300/70 bg-white/75 p-3 text-xs dark:border-amber-900 dark:bg-card/70"><strong className="text-amber-950 dark:text-amber-100">{rule.title}</strong><p className="mt-1 text-muted-foreground">{rule.dangerText}</p></div>)}</div>
            <p className="mt-3 text-xs text-muted-foreground">หากฉลากผลิตภัณฑ์ระบุข้อห้ามเพิ่มเติม ให้ยึดฉลากเป็นหลักและทดสอบความเข้ากันได้ก่อนผสมจริง</p>
          </div>}
        </section>
      )}

      {/* STEP 3: CHOOSE ROTATION, THEN OPTIONAL MIXING & CALCULATOR */}
      {step === 3 && pest && previousTreatment && primary && (
        <div className="space-y-6">
          {/* Previous and next treatment summary */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Bug size={14} /> ศัตรูพืช: {pest.name}
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-xl font-black text-foreground">รอบที่แล้ว: {previousTreatment.thai}</h2>
                <span className="text-xs text-muted-foreground">({previousTreatment.name} {previousTreatment.formulation})</span>
                <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-black text-white">
                  IRAC {previousTreatment.active.code}
                </span>
                {previousTreatment.actionType && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                    กลไก: {previousTreatment.actionType}
                  </span>
                )}
              </div>
              {rotationTreatment ? <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300"><ArrowRight size={16} /> รอบนี้เลือก {rotationTreatment.thai} <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white">IRAC {rotationTreatment.active.code}</span></p> : <p className="text-xs text-muted-foreground">เลือกยารอบใหม่ด้านล่างเพื่อจัดทำแผนต่อ</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 font-bold shrink-0">
              <ChevronLeft size={15} /> เปลี่ยนยารอบที่แล้ว
            </Button>
          </div>

          {/* Rotation plan for the next treatment window */}
          <section className="rounded-3xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-4 shadow-[0_12px_30px_rgba(20,83,45,0.08)] sm:p-6 dark:from-emerald-950/35 dark:via-lime-950/20 dark:to-amber-950/15">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                  <RotateCcw size={13} /> แผนสลับกลุ่มรอบถัดไป
                </span>
                <h3 className="mt-3 text-lg font-black">ใช้ {previousTreatment.thai} กลุ่ม IRAC {previousTreatment.active.code} ล่าสุด</h3>
                <p className="mt-1 text-sm text-muted-foreground">กดเลือกยาที่ต้องการใช้รอบนี้จากกลุ่มหลักที่ต่างกัน เมื่อการสำรวจพบว่ายังจำเป็นต้องใช้สาร</p>
              </div>
              <span className="rounded-2xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">เปลี่ยนชื่อยา ≠ เปลี่ยนกลุ่มเสมอ</span>
            </div>

            {rotationPartners.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rotationPartners.map(item => {
                  const isSelected = rotationName === item.name
                  return <button type="button" key={item.name} onClick={() => chooseRotation(item.name)} aria-pressed={isSelected} className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] active:scale-[0.99] ${isSelected ? "border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500/30 shadow-lg dark:bg-emerald-950/50" : "border-emerald-300 bg-white/85 hover:border-emerald-500 hover:shadow-md dark:border-emerald-800 dark:bg-card/85"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div><strong className="block text-sm">{item.thai}</strong><span className="text-xs text-muted-foreground">{item.name}</span></div>
                      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white">{isSelected && <Check size={13} />} IRAC {item.active.code}</span>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200"><ShieldCheck size={15} className="shrink-0" />ต่างจากกลุ่มหลัก {previousTreatment.active.mainGroup} — {isSelected ? "เลือกใช้รอบนี้แล้ว" : "กดเพื่อเลือกใช้รอบนี้"}</p>
                  </button>
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">ยังไม่มีสารต่างกลุ่มสำหรับแมลงชนิดนี้ในคลังข้อมูล โปรดปรึกษาเจ้าหน้าที่และตรวจทะเบียนล่าสุด</p>
            )}

            {sameGroupPartners.length > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-orange-300/70 bg-orange-100/70 p-3 text-xs text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100">
                <ShieldAlert size={16} className="shrink-0" />
                <span><strong>ระบบไม่ให้เลือกเป็นยาสลับ:</strong> {sameGroupPartners.map(item => `${item.thai} (IRAC ${item.active.code})`).join(", ")} อยู่กลุ่มหลัก {previousTreatment.active.mainGroup} เหมือนกัน</span>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">อย่ากำหนดรอบพ่นจากปฏิทินอย่างเดียว ต้องอิงการสำรวจ วงจรแมลง ฉลากผลิตภัณฑ์ และทะเบียนที่ใช้กับทุเรียนในประเทศไทย</p>
          </section>

          {rotationTreatment && <>

          {/* Solo vs Mixed options */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setPlanKind("solo")
                setPartnerName("")
              }}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                planKind === "solo" ? selectedStyle : normalStyle
              }`}
            >
              <span className={`flex size-10 items-center justify-center rounded-xl ${
                planKind === "solo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Leaf size={20} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base">ใช้สารหลักตัวเดียว (ไม่ผสมสารกำจัดแมลงอื่น)</h3>
                  {planKind === "solo" && <Check className="text-primary size-5" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เหมาะกับการฉีดพ่นทั่วไป ไม่เสี่ยงต่อสารตีกัน และลดค่าใช้จ่าย
                </p>
              </div>
            </button>

            {premix && (
              <button
                type="button"
                onClick={() => {
                  setPlanKind("premix")
                  setPartnerName("")
                }}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                  planKind === "premix" ? selectedStyle : normalStyle
                }`}
              >
                <span className={`flex size-10 items-center justify-center rounded-xl ${
                  planKind === "premix" ? "bg-sky-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Sparkles size={20} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base">ใช้สูตรผสมสำเร็จจากโรงงาน (Premix)</h3>
                    {planKind === "premix" && <Check className="text-sky-500 size-5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {premix.label} ({premix.formulation}) ผ่านการรับรองสูตรสำเร็จ
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Section 1: Compatible Insecticide Partners */}
          <section className={`${panel} space-y-4`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <FlaskConical size={18} className="text-primary" />
                  สารกำจัดแมลง/ไรคู่ผสมที่สามารถพิจารณาได้
                </h3>
                <span className="text-xs text-muted-foreground">คลิกเพื่อเลือกคู่ผสมร่วมถัง</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                หลักการผสมสารกำจัดแมลง 2 ตัวในถังเดียว: ควรเลือกสารที่อยู่ <strong>คนละกลุ่ม IRAC</strong> เพื่อเสริมฤทธิ์และไม่สร้างการดื้อยา
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {partners.map(item => {
                const isDiffGroup = item.active.mainGroup !== primary.active.mainGroup
                const isChosen = planKind === "tank" && partnerName === item.name
                return (
                  <div
                    key={item.name}
                    onClick={() => {
                      if (!isDiffGroup) return
                      if (isChosen) {
                        setPlanKind("solo")
                        setPartnerName("")
                      } else {
                        setPlanKind("tank")
                        setPartnerName(item.name)
                      }
                    }}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      !isDiffGroup
                        ? "border-destructive/30 bg-destructive/5 opacity-70 cursor-not-allowed"
                        : isChosen
                        ? selectedStyle
                        : `${normalStyle} cursor-pointer`
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">{item.thai}</h4>
                          <p className="text-xs text-muted-foreground">{item.name} ({item.formulation})</p>
                        </div>
                        <span className={`rounded-lg px-2.5 py-0.5 text-xs font-black ${
                          isDiffGroup ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/15 text-destructive"
                        }`}>
                          IRAC {item.active.code}
                        </span>
                      </div>

                      {/* Compatibility Badge & Reason */}
                      <div className="mt-3">
                        {isDiffGroup ? (
                          <div className="flex items-start gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                            <span>
                              ต่างกลุ่ม ({primary.active.code} + {item.active.code}) — สลับกลไก ไม่ดื้อยา
                              {item.actionType ? ` (${primary.actionType} + ${item.actionType})` : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5 text-xs font-bold text-destructive">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span>
                              กลุ่ม {item.active.mainGroup} ซ้ำกัน — ไม่แนะนำให้ผสมร่วม (เปลืองและเร่งดื้อยา)
                            </span>
                          </div>
                        )}
                      </div>

                      {item.highlight && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {item.highlight}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        อัตรา: {item.ratePer20L} {item.unit} / 20 ลิตร
                      </span>
                      {isDiffGroup && (
                        <Button
                          variant={isChosen ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs font-bold gap-1"
                        >
                          {isChosen ? <Check size={14} /> : null}
                          {isChosen ? "เลือกผสมแล้ว" : "เพิ่มในถังผสม"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Section 2: Compatible Fungicide Partners */}
          <section className={`${panel} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Droplets size={18} className="text-sky-500" />
                  ยาป้องกันกำจัดเชื้อราที่สามารถผสมร่วมถังได้
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  ชาวสวนทุเรียนมักผสมยาฆ่าแมลง + ยาเชื้อราในรอบเดียวกัน เลือกยาเชื้อราที่ต้องการเติมลงถัง
                </p>
              </div>
              {selectedFungicideId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFungicideId("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ไม่ใส่ยาเชื้อรา
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {compatibleFungicides.map((fung: CompatibleFungicide) => {
                const isSelected = selectedFungicideId === fung.id
                return (
                  <div
                    key={fung.id}
                    onClick={() => setSelectedFungicideId(isSelected ? "" : fung.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected ? selectedStyle : normalStyle
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">{fung.thai}</h4>
                          <p className="text-xs text-muted-foreground">{fung.name} ({fung.formulation})</p>
                        </div>
                        <span className="rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-xs font-bold">
                          {fung.fracGroup}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-semibold text-primary">
                        🎯 ป้องกัน: {fung.targetDisease}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {fung.notes}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        อัตรา: {fung.ratePer20L} {fung.unit} / 20 ลิตร
                      </span>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs font-bold"
                      >
                        {isSelected ? "เลือกแล้ว" : "เพิ่มในถัง"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Section 3: Incompatibility Warnings & Prohibitions */}
          <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-amber-600 dark:text-amber-400 size-5 shrink-0" />
              <h3 className="font-black text-base text-amber-900 dark:text-amber-200">
                กฎเหล็กข้อห้ามผสมเด็ดขาด (สิ่งที่ห้ามใส่ร่วมถัง)
              </h3>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {tankMixRules.map(rule => (
                <div key={rule.id} className="rounded-xl bg-card/80 p-3.5 border border-amber-500/20 text-xs space-y-1">
                  <div className="font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{rule.title}</span>
                  </div>
                  <p className="font-semibold text-foreground">{rule.dangerText}</p>
                  <p className="text-muted-foreground leading-relaxed">{rule.guidance}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Live Tank Calculator & WALES Mixing Order */}
          <section className={`${panel} space-y-5 bg-gradient-to-b from-card to-muted/30`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <FlaskConical className="text-primary size-5" />
                  เครื่องคำนวณปริมาณยาและลำดับการผสมถังฉีด
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  เลือกขนาดถังเพื่อคำนวณปริมาณสารที่ต้องตวงจริง พร้อมลำดับการเทลงถังตามหลักสากล W-A-L-E-S
                </p>
              </div>

              {/* Tank Size Selector */}
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
                {TANK_PRESETS.map(liters => (
                  <button
                    key={liters}
                    type="button"
                    onClick={() => setTankLiters(liters)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      tankLiters === liters
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ถัง {liters.toLocaleString()} ลิตร
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tank Input & Summary */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">หรือระบุขนาดถังเอง:</span>
              <div className="flex items-center gap-2 max-w-[140px]">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={tankLiters}
                  onChange={e => setTankLiters(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 text-sm font-bold text-center"
                />
                <span className="text-xs font-bold text-foreground">ลิตร</span>
              </div>
            </div>

            {/* Live Dose Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted font-bold">
                  <tr>
                    <th className="p-3">ชนิดสารที่เลือกใส่ถัง</th>
                    <th className="p-3">ประเภทสูตร</th>
                    <th className="p-3">อัตรา / 20 ลิตร</th>
                    <th className="p-3 text-right">ปริมาณตวงสำหรับถัง {tankLiters.toLocaleString()} ลิตร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Primary */}
                  <tr className="bg-card">
                    <td className="p-3 font-black text-primary">
                      1. ยาหลัก: {primary.thai} ({primary.name})
                    </td>
                    <td className="p-3 text-muted-foreground">{primary.formulation}</td>
                    <td className="p-3 font-semibold">{primary.ratePer20L} {primary.unit}</td>
                    <td className="p-3 text-right font-black text-base text-primary">
                      {calculateTankDose(primary.ratePer20L || 15, tankLiters).toLocaleString("th-TH", { maximumFractionDigits: 1 })} {primary.unit}
                    </td>
                  </tr>

                  {/* Partner if tank mixed */}
                  {planKind === "tank" && partner && (
                    <tr className="bg-card">
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                        2. ยาคู่ผสม: {partner.thai} ({partner.name})
                      </td>
                      <td className="p-3 text-muted-foreground">{partner.formulation}</td>
                      <td className="p-3 font-semibold">{partner.ratePer20L} {partner.unit}</td>
                      <td className="p-3 text-right font-black text-base text-emerald-600 dark:text-emerald-400">
                        {calculateTankDose(partner.ratePer20L || 15, tankLiters).toLocaleString("th-TH", { maximumFractionDigits: 1 })} {partner.unit}
                      </td>
                    </tr>
                  )}

                  {/* Fungicide if selected */}
                  {fungicide && (
                    <tr className="bg-card">
                      <td className="p-3 font-black text-sky-600 dark:text-sky-400">
                        3. ยาเชื้อรา: {fungicide.thai} ({fungicide.name})
                      </td>
                      <td className="p-3 text-muted-foreground">{fungicide.formulation}</td>
                      <td className="p-3 font-semibold">{fungicide.ratePer20L} {fungicide.unit}</td>
                      <td className="p-3 text-right font-black text-base text-sky-600 dark:text-sky-400">
                        {calculateTankDose(fungicide.ratePer20L, tankLiters).toLocaleString("th-TH", { maximumFractionDigits: 1 })} {fungicide.unit}
                      </td>
                    </tr>
                  )}

                  {/* Surfactant */}
                  <tr className="bg-muted/40 text-muted-foreground">
                    <td className="p-3 font-medium">4. สารจับใบ / สารเสริมประสิทธิภาพ (ถ้าจำเป็น)</td>
                    <td className="p-3">Adjuvant / SL</td>
                    <td className="p-3">3-5 ซีซี</td>
                    <td className="p-3 text-right font-bold text-foreground">
                      {calculateTankDose(4, tankLiters).toLocaleString("th-TH", { maximumFractionDigits: 1 })} ซีซี (ใส่ลำดับสุดท้าย)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* WALES Mixing Sequence Guide */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-black flex items-center gap-1.5 text-foreground">
                <Info size={16} className="text-primary" />
                ลำดับขั้นตอนการเทยาลงถัง (หลักสากล W-A-L-E-S)
              </h4>
              <div className="grid gap-2 sm:grid-cols-5">
                {tankMixingOrder.map(stepItem => (
                  <div key={stepItem.step} className="rounded-xl border border-border bg-card p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-primary">
                      <span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px]">
                        {stepItem.step}
                      </span>
                      <span>{stepItem.code}</span>
                    </div>
                    <div className="font-bold text-foreground">{stepItem.thai}</div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{stepItem.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 font-bold">
                  <ChevronLeft size={15} /> เปลี่ยนยารอบที่แล้ว
                </Button>
                <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1 text-muted-foreground">
                  <RotateCcw size={14} /> เริ่มเลือกแมลงใหม่
                </Button>
              </div>

              {onInspect && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const ids = [primary.active.id]
                    if (planKind === "tank" && partner) ids.push(partner.active.id)
                    onInspect(ids)
                  }}
                  className="gap-1.5 font-bold"
                >
                  <FlaskConical size={14} /> ตรวจเลขกลุ่ม IRAC ในห้องทดลอง
                </Button>
              )}
            </div>
          </section>
          </>}
        </div>
      )}
    </div>
  )
}

