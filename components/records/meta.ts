import { Droplets, MoreHorizontal, PackageSearch, Scissors, Search, Sprout, SprayCan, type LucideIcon } from "lucide-react"
import type { ActivityType, DurianVariety, FinanceCategory, FlowerStage, Task, Tree } from "@/lib/store"

export const ACTIVITY_TYPES: ActivityType[] = ["fertilize", "spray", "water", "prune", "harvest", "inspect", "other"]

export const ACTIVITY_META: Record<ActivityType, {
  icon: LucideIcon
  /** Icon chip (soft background + strong foreground). */
  chip: string
  /** Solid swatch used for the selected state and timeline dots. */
  solid: string
  suggestions: string[]
  financeCategory: FinanceCategory
}> = {
  fertilize: {
    icon: Sprout,
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    solid: "bg-emerald-500",
    suggestions: ["ปุ๋ยทางดิน", "ปุ๋ยทางใบ", "ปุ๋ยอินทรีย์/ขี้ไก่", "ปุ๋ยสูตรเสมอ 15-15-15", "ปุ๋ยเร่งดอก 8-24-24"],
    financeCategory: "ปุ๋ย",
  },
  spray: {
    icon: SprayCan,
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    solid: "bg-amber-500",
    suggestions: ["ป้องกันเชื้อรา", "กำจัดเพลี้ยไก่แจ้", "กำจัดหนอนเจาะผล", "ฮอร์โมน/อาหารเสริม", "ราดโคนป้องกันรากเน่า"],
    financeCategory: "ยา",
  },
  water: {
    icon: Droplets,
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    solid: "bg-sky-500",
    suggestions: ["ให้น้ำเต็มที่", "ให้น้ำน้อย (ดึงดอก)", "งดน้ำ / กดน้ำ", "ให้น้ำผ่านสปริงเกอร์"],
    financeCategory: "น้ำ/ไฟ",
  },
  prune: {
    icon: Scissors,
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
    solid: "bg-orange-500",
    suggestions: ["ตัดแต่งกิ่งหลังเก็บเกี่ยว", "ตัดแต่งดอก", "ตัดแต่งผล/ไว้ผล", "ตัดกิ่งกระโดง", "โยงกิ่ง"],
    financeCategory: "แรงงาน",
  },
  harvest: {
    icon: PackageSearch,
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    solid: "bg-rose-500",
    suggestions: ["ตัดลูกรุ่นแรก", "ตัดลูกรุ่นสอง", "ตัดลูกเก็บตก", "ขายเหมาสวน"],
    financeCategory: "แรงงาน",
  },
  inspect: {
    icon: Search,
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    solid: "bg-violet-500",
    suggestions: ["สำรวจโรคและแมลง", "เช็กการแทงช่อดอก", "เช็กความชื้นดิน", "ตรวจแผลที่ลำต้น"],
    financeCategory: "อื่นๆ",
  },
  other: {
    icon: MoreHorizontal,
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    solid: "bg-slate-500",
    suggestions: ["กำจัดวัชพืช", "ซ่อมระบบน้ำ", "ปรับปรุงดิน", "ทำร่องระบายน้ำ"],
    financeCategory: "อื่นๆ",
  },
}

export const TASK_SUGGESTIONS = [
  "พ่นยาป้องกันเชื้อรา", "ใส่ปุ๋ย", "ให้น้ำ", "ตัดแต่งกิ่ง", "สำรวจโรคและแมลง", "ตัดแต่งดอก", "โยงกิ่ง", "เก็บเกี่ยว",
]

export const PRIORITY_META: Record<Task["priority"], { label: string; dot: string; chip: string; active: string }> = {
  high: {
    label: "ด่วน",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    active: "bg-rose-600 text-white border-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:border-rose-400",
  },
  medium: {
    label: "ปกติ",
    dot: "bg-amber-400",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    active: "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-400",
  },
  low: {
    label: "ไม่รีบ",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    active: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-400",
  },
}

/** Best-guess activity type for a finished task, from words in its title. */
export function inferActivityType(title: string): ActivityType {
  const t = title.toLowerCase()
  if (/ปุ๋ย|ขี้ไก่|บำรุง/.test(t)) return "fertilize"
  if (/พ่น|ยา|ฮอร์โมน|ราด|เพลี้ย|หนอน|เชื้อรา/.test(t)) return "spray"
  if (/น้ำ/.test(t)) return "water"
  if (/ตัดแต่ง|ตัดกิ่ง|โยง|แต่ง/.test(t)) return "prune"
  if (/เก็บ|ตัดลูก|ขาย/.test(t)) return "harvest"
  if (/ตรวจ|สำรวจ|เช็ก|ดู/.test(t)) return "inspect"
  return "other"
}

// ---- Tree / flowering ----

export const HEALTH_META: Record<Tree["health"], { label: string; dot: string; chip: string; active: string }> = {
  good: {
    label: "แข็งแรง",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    active: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-400",
  },
  fair: {
    label: "เฝ้าระวัง",
    dot: "bg-amber-400",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    active: "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-400",
  },
  poor: {
    label: "ต้องรักษา",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    active: "bg-rose-600 text-white border-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:border-rose-400",
  },
}

/** Groups the 13 stages into the five phases farmers talk about. */
export const STAGE_PHASES: { label: string; short: string; emoji: string; stages: FlowerStage[] }[] = [
  { label: "ทำใบ", short: "ใบ", emoji: "🌿", stages: ["vegetative", "dormant"] },
  { label: "ระยะดอก", short: "ดอก", emoji: "🌱", stages: ["egg_fish", "nail", "mouse_foot", "eggplant", "bracelet", "white_flower"] },
  { label: "ดอกบาน", short: "บาน", emoji: "🌼", stages: ["bloom", "rat_tail"] },
  { label: "ติดผล", short: "ผล", emoji: "🍈", stages: ["chicken_egg", "expanding"] },
  { label: "เก็บเกี่ยว", short: "เก็บ", emoji: "🧺", stages: ["harvest"] },
]

export function stagePhaseIndex(stage: FlowerStage) {
  return Math.max(0, STAGE_PHASES.findIndex(phase => phase.stages.includes(stage)))
}

/** Stages that belong to a flower/fruit batch (everything except leaf/rest phases). */
export function isCropStage(stage: FlowerStage) {
  return stage !== "vegetative" && stage !== "dormant"
}

/** Typical days from full bloom to cutting, by variety. */
export const HARVEST_DAYS: Record<DurianVariety, number> = {
  "หมอนทอง": 120,
  "ชะนี": 105,
  "กันยาว": 125,
  "ก้านยาว": 125,
  "พวงมณี": 100,
  "กระดุม": 95,
  "อื่นๆ": 120,
}
