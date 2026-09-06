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

const panel = "rounded-2xl border border-border bg-card p-4 sm:p-6"
const selectedStyle = "border-primary bg-primary/10 ring-2 ring-primary/60 shadow-sm"
const normalStyle = "border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"

const TANK_PRESETS = [20, 200, 1000]

export default function PestTreatmentPlanner({ onInspect }: { onInspect?: (ids: string[]) => void }) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedPart, setSelectedPart] = useState<string>("ทั้งหมด")
  const [pestId, setPestId] = useState("")
  const [primaryName, setPrimaryName] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [selectedFungicideId, setSelectedFungicideId] = useState<string>("")
  const [tankLiters, setTankLiters] = useState<number>(200)
  const [planKind, setPlanKind] = useState<"solo" | "tank" | "premix">("solo")

  const pest = orchardPests.find(item => item.id === pestId)
  const treatments = getPestTreatments(pestId)
  const primary = treatments.find(item => item.name === primaryName)
  const partners = getPestPartners(pestId, primaryName)
  const partner = partners.find(item => item.name === partnerName)
  const premix = documentedPremixes.find(item => item.pestId === pestId && item.actives.includes(primaryName))
  const fungicide = compatibleFungicides.find(item => item.id === selectedFungicideId)

  // Filter pests by search query and target plant part
  const filteredPests = orchardPests.filter(item => {
    const matchesSearch = `${item.name} ${item.hint} ${item.symptoms}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesPart = selectedPart === "ทั้งหมด" || item.targetParts.some(p => p.includes(selectedPart))
    return matchesSearch && matchesPart
  })

  const choosePest = (id: string) => {
    setPestId(id)
    setPrimaryName("")
    setPartnerName("")
    setSelectedFungicideId("")
    setPlanKind("solo")
    setStep(2)
  }

  const choosePrimary = (name: string) => {
    setPrimaryName(name)
    setPartnerName("")
    setPlanKind("solo")
    setStep(3)
  }

  const resetAll = () => {
    setStep(1)
    setPestId("")
    setPrimaryName("")
    setPartnerName("")
    setSelectedFungicideId("")
    setPlanKind("solo")
    setSearch("")
    setSelectedPart("ทั้งหมด")
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-emerald-500/10 p-5 sm:p-6 border border-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FlaskConical size={22} />
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl text-foreground">โปรแกรมเลือกยาและจับคู่ผสมสารเคมี</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                เลือกแมลงที่พบในสวน → แนะนำยาที่ได้ผล → แนะนำคู่ผสมที่ปลอดภัยและคำนวณอัตราถังฉีด
              </p>
            </div>
          </div>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5 font-bold">
              <RotateCcw size={14} />
              เริ่มใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Modern Step Navigation */}
      <nav aria-label="ขั้นตอนเลือกสาร" className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { num: 1, label: "1. เลือกแมลง", sub: pest?.name || "ระบุศัตรูพืช", active: step === 1, done: step > 1, disabled: false },
          { num: 2, label: "2. เลือกยาหลัก", sub: primary?.thai || "สารกำจัดแมลง", active: step === 2, done: step > 2, disabled: !pest },
          { num: 3, label: "3. ดูคู่ผสม & ถังฉีด", sub: planKind === "tank" && partner ? `ผสม ${partner.thai}` : "คำนวณการผสม", active: step === 3, done: false, disabled: !primary },
        ].map(item => (
          <button
            key={item.num}
            type="button"
            disabled={item.disabled}
            onClick={() => setStep(item.num)}
            className={`flex flex-col items-start justify-center rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
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
      </nav>

      {/* STEP 1: SELECT PEST */}
      {step === 1 && (
        <section className={`${panel} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <Bug className="text-primary size-5" />
                พบแมลงศัตรูพืชชนิดไหนในสวนทุเรียน?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                เลือกแมลงที่พบเพื่อดูสารกำจัดและคู่ผสมที่เหมาะสมตามหลักวิชาการ
              </p>
            </div>
            {/* Filter by plant part */}
            <div className="flex flex-wrap gap-1.5">
              {["ทั้งหมด", "ยอดอ่อน", "ดอก", "ผล", "ใบ"].map(part => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setSelectedPart(part)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    selectedPart === part ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
            <Input
              id="pest-search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อแมลง หรืออาการ เช่น เพลี้ยไฟ, ยอดหงิก, ไรแดง, ผงขาว, ขี้หนอน..."
              className="pl-9 min-h-11 text-sm sm:text-base rounded-xl"
            />
          </div>

          {/* Pest Cards Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPests.map(item => (
              <div
                key={item.id}
                onClick={() => choosePest(item.id)}
                className={`group cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                  item.id === pestId ? selectedStyle : normalStyle
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        <Bug size={20} />
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
                      <span key={part} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {part}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.symptoms}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">มียาแนะนำ {item.treatments.length} ชนิด</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    เลือกแมลงนี้ <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
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
                เลือกสารกำจัดแมลงหลักที่ต้องการใช้
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                คลิกเลือก 1 ตัวยาเพื่อเป็นสารตั้งต้น จากนั้นระบบจะแสดงคู่ผสมที่เข้ากันได้
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

          {/* Chemical Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {treatments.map(item => {
              const isSelected = primaryName === item.name
              return (
                <div
                  key={item.name}
                  onClick={() => choosePrimary(item.name)}
                  className={`cursor-pointer rounded-2xl border p-4 flex flex-col justify-between transition-all ${
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
                        IRAC {item.active.code}
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
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                        ✨ {item.highlight}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between font-bold text-xs sm:text-sm h-10"
                      onClick={e => {
                        e.stopPropagation()
                        choosePrimary(item.name)
                      }}
                    >
                      <span>{isSelected ? "เลือกแล้ว" : "เลือกเป็นสารหลัก"}</span>
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* STEP 3: MIXING PARTNER & LIVE TANK CALCULATOR */}
      {step === 3 && pest && primary && (
        <div className="space-y-6">
          {/* Chosen Chemical Header Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Bug size={14} /> ศัตรูพืช: {pest.name}
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-xl font-black text-foreground">ยาหลัก: {primary.thai}</h2>
                <span className="text-xs text-muted-foreground">({primary.name} {primary.formulation})</span>
                <span className="rounded-md bg-primary text-primary-foreground px-2 py-0.5 text-xs font-black">
                  IRAC {primary.active.code}
                </span>
                {primary.actionType && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                    กลไก: {primary.actionType}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                อัตราแนะนำตามเอกสาร: {primary.ratePer20L} {primary.unit} ต่อน้ำ 20 ลิตร
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 font-bold shrink-0">
              <ChevronLeft size={15} /> เปลี่ยนยาหลัก
            </Button>
          </div>

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
                  <ChevronLeft size={15} /> เปลี่ยนยาหลัก
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
        </div>
      )}
    </div>
  )
}

