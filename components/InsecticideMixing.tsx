"use client"

import { useState } from "react"
import PestTreatmentPlanner from "./PestTreatmentPlanner"
import DiseaseRotationPlanner from "./DiseaseRotationPlanner"
import PesticideRotationPicker from "./PesticideRotationPicker"
import { Bug, FlaskConical, Leaf, ShieldCheck } from "lucide-react"
import { IRAC_SOURCE, IRAC_MIXTURES_SOURCE } from "@/lib/irac"
import type { Product } from "@/lib/store"

export default function InsecticideMixing({ products = [] }: { products?: Product[] }) {
  const [view, setView] = useState<"drug" | "problems">("drug")
  const [problemKind, setProblemKind] = useState<"insect" | "disease">("insect")
  const views = [
    { id: "drug" as const, label: "เลือกตามยา", detail: "ระบุยารอบที่แล้ว", icon: FlaskConical, tone: "from-amber-600 to-orange-500" },
    { id: "problems" as const, label: "โรคและแมลง", detail: "ปัญหาหลักในสวนทุเรียน", icon: Bug, tone: "from-emerald-600 to-teal-500" },
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
            <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-emerald-50/95 sm:text-lg">
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

    <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="เลือกหน้าข้อมูล">
      {views.map(item => {
        const Icon = item.icon
        const isActive = view === item.id
        return <button
          key={item.id}
          type="button"
          onClick={() => setView(item.id)}
          aria-pressed={isActive}
          className={`group flex min-h-20 touch-manipulation items-center gap-3 rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] active:scale-[0.98] ${isActive ? "border-primary/30 bg-card shadow-[0_12px_28px_rgba(20,83,45,0.10)] ring-2 ring-primary/15" : "border-border bg-card/70 hover:border-primary/30 hover:bg-card"}`}
        >
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black text-foreground">{item.label}</span>
            <span className="mt-0.5 block text-sm font-semibold leading-relaxed text-muted-foreground">{item.detail}</span>
          </span>
          {isActive && <span className="ml-auto size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden="true" />}
        </button>
      })}
    </nav>

    {view === "drug" && <PesticideRotationPicker products={products} />}

    {view === "problems" && <div className="space-y-5">
      <section className="rounded-3xl border border-primary/15 bg-card p-3 shadow-[0_12px_34px_rgba(20,83,45,0.07)] sm:p-4">
        <div className="grid grid-cols-2 gap-2" aria-label="เลือกประเภทปัญหาในสวน">
          <button type="button" onClick={() => setProblemKind("insect")} aria-pressed={problemKind === "insect"} className={`flex min-h-16 touch-manipulation items-center justify-center gap-2 rounded-2xl border px-3 text-base font-black transition-[border-color,background-color,box-shadow] ${problemKind === "insect" ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-100"}`}>
            <Bug size={19} aria-hidden="true" /> แมลงหลัก 8 ชนิด
          </button>
          <button type="button" onClick={() => setProblemKind("disease")} aria-pressed={problemKind === "disease"} className={`flex min-h-16 touch-manipulation items-center justify-center gap-2 rounded-2xl border px-3 text-base font-black transition-[border-color,background-color,box-shadow] ${problemKind === "disease" ? "border-sky-600 bg-sky-600 text-white shadow-md" : "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-400 dark:border-sky-800 dark:bg-sky-950/25 dark:text-sky-100"}`}>
            <Leaf size={19} aria-hidden="true" /> โรคหลัก 5 โรค
          </button>
        </div>
      </section>
      {problemKind === "insect" ? <PestTreatmentPlanner guideOnly products={products} /> : <DiseaseRotationPlanner />}
    </div>}

    <footer className="space-y-2 text-xs text-muted-foreground"><p>แหล่งข้อมูล: <a href={IRAC_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Mode of Action</a> · <a href={IRAC_MIXTURES_SOURCE} target="_blank" rel="noreferrer" className="underline">IRAC Insecticide Mixtures: Key Considerations</a></p><p>ตรวจฉลากและทะเบียนล่าสุดของผลิตภัณฑ์ก่อนใช้ทุกครั้ง ข้อมูลนี้ไม่ยืนยันความเหมาะสมหรือการขึ้นทะเบียนของทุกผลิตภัณฑ์ในประเทศไทย</p></footer>
  </div>
}
