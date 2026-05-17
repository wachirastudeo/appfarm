"use client"
import { useState, useEffect, useCallback } from "react"

// ---- Types ----
export type FlowerStage =
  | "vegetative"   // ผลิใบ / เจริญเติบโต
  | "egg_fish"     // ไข่ปลา
  | "nail"         // ตาปู
  | "mouse_foot"   // เหยียดตีนหนู
  | "eggplant"     // มะเขือพวง
  | "bracelet"     // หัวกำไล
  | "white_flower" // ดอกขาว
  | "bloom"        // ดอกบาน
  | "rat_tail"     // หางแย้
  | "chicken_egg"  // ไข่ไก่
  | "expanding"    // ขยายพู / ผลโต
  | "harvest"      // เก็บเกี่ยว
  | "dormant"      // พักต้น

export const FLOWER_STAGE_LABELS: Record<FlowerStage, string> = {
  vegetative: "ผลิใบ / เจริญเติบโต",
  egg_fish: "ไข่ปลา",
  nail: "ตาปู",
  mouse_foot: "เหยียดตีนหนู",
  eggplant: "มะเขือพวง",
  bracelet: "หัวกำไล",
  white_flower: "ดอกขาว",
  bloom: "ดอกบาน",
  rat_tail: "หางแย้",
  chicken_egg: "ไข่ไก่",
  expanding: "ขยายพู / ผลโต",
  harvest: "เก็บเกี่ยว",
  dormant: "พักต้น",
}

export const FLOWER_STAGES: FlowerStage[] = [
  "vegetative","egg_fish","nail","mouse_foot","eggplant","bracelet","white_flower","bloom","rat_tail","chicken_egg","expanding","harvest","dormant"
]

export type DurianVariety = "หมอนทอง" | "ชะนี" | "กันยาว" | "พวงมณี" | "ก้านยาว" | "อื่นๆ"
export const VARIETIES: DurianVariety[] = ["หมอนทอง","ชะนี","กันยาว","พวงมณี","ก้านยาว","อื่นๆ"]

export interface BatchStage {
  id: string
  stage: FlowerStage
  date: string
  note: string
}

export interface FlowerBatch {
  id: string
  name: string
  fruitCount: number
  bloomDate?: string // Date of full bloom for harvest prediction
  stages: BatchStage[]
}

export interface Tree {
  id: string
  treeNumber: string
  variety: DurianVariety
  age: number // years
  stage: FlowerStage
  health: "good" | "fair" | "poor"
  notes: string
  batches: FlowerBatch[] // New field
  lastUpdated: string // ISO date
}

export interface Plot {
  id: string
  name: string
  area: number // rai
  trees: Tree[]
  notes: string
}

export type ActivityType = "fertilize" | "spray" | "water" | "prune" | "harvest" | "inspect" | "other"
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  fertilize: "ใส่ปุ๋ย",
  spray: "พ่นยา",
  water: "รดน้ำ",
  prune: "ตัดแต่ง",
  harvest: "เก็บเกี่ยว",
  inspect: "ตรวจสอบ",
  other: "อื่นๆ",
}

export interface Activity {
  id: string
  date: string // ISO
  plotId: string
  treeId?: string // Link to a specific tree if needed
  activityType: ActivityType
  description: string
  cost: number
  createdAt: string
}

export type TaskStatus = "pending" | "done" | "cancelled"
export interface Task {
  id: string
  date: string // ISO
  plotId: string
  title: string
  description: string
  status: TaskStatus
  priority: "high" | "medium" | "low"
}

export type FinanceType = "income" | "expense"
export type FinanceCategory =
  | "ขายผล" | "ปุ๋ย" | "ยา" | "แรงงาน" | "น้ำ/ไฟ" | "อุปกรณ์" | "ขนส่ง" | "อื่นๆ"
export const INCOME_CATEGORIES: FinanceCategory[] = ["ขายผล", "อื่นๆ"]
export const EXPENSE_CATEGORIES: FinanceCategory[] = ["ปุ๋ย","ยา","แรงงาน","น้ำ/ไฟ","อุปกรณ์","ขนส่ง","อื่นๆ"]

export interface FinanceRecord {
  id: string
  date: string
  type: FinanceType
  category: FinanceCategory
  amount: number
  description: string
  plotId?: string
}

export type UserRole = "admin" | "user"
export type UserStatus = "active" | "disabled"

export interface AppUser {
  id: string
  name: string
  email: string
  passwordHash: string
  password?: string
  role: UserRole
  status: UserStatus
  provider: string
  avatar?: string
  createdAt: string
}

export interface Article {
  id: string
  title: string
  category: string
  image: string
  content: string
  affiliateTitle?: string
  affiliateUrl?: string
  status: "published" | "draft"
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  image: string
  priceLabel: string
  description: string
  affiliateUrl: string
  status: "active" | "draft"
  createdAt: string
  updatedAt: string
}

export interface SiteSettings {
  siteName: string
  tagline: string
  logoUrl: string
}

export type NewUserInput = Omit<AppUser, "id" | "createdAt" | "passwordHash" | "password"> & { password: string }

export interface AppData {
  plots: Plot[]
  activities: Activity[]
  tasks: Task[]
  finance: FinanceRecord[]
  users: AppUser[]
  articles: Article[]
  products: Product[]
  siteSettings: SiteSettings
}

const seedArticles: Article[] = [
  { id: "art1", title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", image: "/images/articles/article_watering_1778037948644.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "ระยะเตรียมทำใบเป็นช่วงสำคัญที่ต้องเพิ่มการให้น้ำให้สม่ำเสมอ เพื่อให้ใบออกสวยงามและสม่ำเสมอ การให้น้ำแบบเคาะหรือหยดน้ำ 2-3 ครั้งต่อสัปดาห์จะช่วยให้พืชมีความชื้นเพียงพอ\n\nการให้น้ำในช่วงนี้ควรเน้นที่ความชื้นของดินเป็นหลัก ไม่ควรปล่อยให้ดินแห้งแตกระแหง เพราะจะทำให้การแตกใบอ่อนไม่สม่ำเสมอ นอกจากนี้ควรมีการเสริมปุ๋ยทางใบร่วมด้วยเพื่อให้ใบมีความสมบูรณ์สูงสุด" },
  { id: "art2", title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", image: "/images/articles/article_disease_1778037967060.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "โรคไฟทอปธอร่าเป็นโรคร้ายแรงที่อาจทำให้สูญเสียผลผลิตได้ 50-80% วิธีป้องกันคือการใช้ปุ๋ยสมดุล เพิ่มการระบายอากาศ และใช้สารเคมีป้องกันอย่างถูกต้อง\n\nหัวใจสำคัญคือการจัดการน้ำในสวนไม่ให้ท่วมขัง และการตรวจสอบแผลตามลำต้นอย่างสม่ำเสมอ หากพบแผลควรทำการถากเนื้อไม้ที่เสียออกและทาด้วยสารป้องกันเชื้อราทันที" },
  { id: "art3", title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", image: "/images/articles/article_market_1778038017547.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "ราคาทุเรียนปี 2026 คาดว่าจะสูงขึ้นจากปีที่แล้ว เนื่องจากอุปสงค์จากตลาดเอเชียและจีนที่เพิ่มขึ้น ราคาประมาณ 100-150 บาทต่อกิโลกรัมสำหรับคุณภาพเกรด A\n\nเกษตรกรควรเน้นการทำทุเรียนคุณภาพพรีเมียมและมีการรับรองมาตรฐาน GAP เพื่อให้ได้ราคาสูงสุดและเป็นที่ต้องการของตลาดส่งออก" },
  { id: "art4", title: "วิธีสังเกตดอกทุเรียนระยะไข่ปลา", category: "การสังเกต", image: "/images/articles/article_flowering_1778039300000_1778039688657.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "ระยะไข่ปลาเป็นช่วงที่ดอกเข้าชิดกันเหมือนไข่ปลา ลักษณะเพศเริ่มแตกต่างชัดเจน ควรเน้นการให้น้ำและปุ๋ยให้สม่ำเสมอในช่วงนี้\n\nระวังอย่าให้น้ำมากเกินไปเพราะอาจทำให้ดอกหลุดร่วงได้ ควรให้น้ำในปริมาณที่พอเหมาะเพื่อให้ดอกพัฒนาไปสู่ระยะมะเขือพวงได้อย่างสมบูรณ์" },
  { id: "art5", title: "ปุ๋ยสูตรไหนเหมาะกับระยะขยายขนาดผล", category: "การให้ปุ๋ย", image: "/images/articles/article_fertilizer_1778039300000_1778039705364.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "ในระยะขยายขนาดผล ควรใช้ปุ๋ยที่มีแคลเซียมและโพแทสเซียมสูง เช่น NPK 5:10:20 หรือสูตรเฉพาะสำหรับผลไม้ให้ 2-3 ครั้งต่อเดือน\n\nการใส่ปุ๋ยในช่วงนี้จะช่วยให้เนื้อทุเรียนมีคุณภาพดี รสชาติหวาน และมีน้ำหนักผลที่ได้มาตรฐาน" },
  { id: "art6", title: "การตัดแต่งกิ่งเตรียมพร้อมสำหรับฤดูกาลใหม่", category: "การดูแลรักษา", image: "/images/articles/article_pruning_1778039300000_1778039722927.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "การตัดแต่งกิ่งช่วยกระตุ้นการออกใบและดอกใหม่ ตัดกิ่งที่อ่อนแอหรือเก่า และปล่อยให้พืชมีรูปทรงสวยงาม ลักษณะปิรามิด\n\nการตัดแต่งกิ่งที่ถูกต้องจะช่วยให้แสงแดดส่องถึงโคนต้น ลดการสะสมของโรคและแมลง และช่วยให้พืชใช้สารอาหารได้อย่างมีประสิทธิภาพ" },
  { id: "art7", title: "เลือกใช้สารเคมีในสวนทุเรียนอย่างปลอดภัย", category: "สารเคมี", image: "/images/articles/article_disease_1778037967060.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "การเลือกใช้สารเคมีควรเริ่มจากการสำรวจอาการจริงในสวนก่อนเสมอ แยกให้ชัดว่าเป็นโรค แมลง หรือภาวะขาดธาตุอาหาร เพื่อเลือกกลุ่มสารให้ตรงปัญหาและลดการใช้เกินจำเป็น\n\nอ่านฉลาก อัตราผสม ระยะปลอดภัยก่อนเก็บเกี่ยว และอุปกรณ์ป้องกันทุกครั้ง ควรสลับกลุ่มสารตามคำแนะนำบนฉลากเพื่อลดการดื้อยา และหลีกเลี่ยงการพ่นช่วงลมแรงหรือก่อนฝนตก", affiliateTitle: "เพิ่มชื่อสารเคมีที่แนะนำ", affiliateUrl: "" },
]

const seedUsers: AppUser[] = [
  { id: "u-admin", name: "ผู้ดูแลสวน", email: "admin@appfarm.test", passwordHash: "d03892df293536e063da4ff9ccaf520c93544aadc598b6c50e9cafef7bb96ad3", role: "admin", status: "active", provider: "email", createdAt: new Date().toISOString() },
  { id: "u-user", name: "เกษตรกรตัวอย่าง", email: "user@appfarm.test", passwordHash: "21af8c1d848d7360fb404f70735b7aede4c00cff95394a7254cb9620bafa41d4", role: "user", status: "active", provider: "email", createdAt: new Date().toISOString() },
  { id: "u-staff", name: "ทีมงานแปลง A", email: "staff@appfarm.test", passwordHash: "612fb42e87fc09a29f793bc7d6f9868ee4ed6790960cc84ce2bfa27f1f71c0cd", role: "user", status: "active", provider: "email", createdAt: new Date().toISOString() },
]

const seedProducts: Product[] = [
  {
    id: "prod1",
    name: "สารป้องกันเชื้อราในสวนทุเรียน",
    category: "สารเคมี",
    image: "/images/articles/article_disease_1778037967060.avif",
    priceLabel: "ดูราคาล่าสุด",
    description: "เหมาะสำหรับใส่ลิงก์ affiliate กลุ่มป้องกันโรคพืช",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod2",
    name: "ปุ๋ยระยะขยายผล",
    category: "ปุ๋ย",
    image: "/images/articles/article_fertilizer_1778039300000_1778039705364.avif",
    priceLabel: "ดูรายละเอียด",
    description: "รายการแนะนำสำหรับบทความปุ๋ยและการบำรุงผล",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod3",
    name: "อุปกรณ์พ่นยา",
    category: "อุปกรณ์",
    image: "/images/articles/article_pruning_1778039300000_1778039722927.avif",
    priceLabel: "เช็กราคา",
    description: "ใช้เป็นช่องวางรายการกลุ่มเครื่องมือและอุปกรณ์สวน",
    affiliateUrl: "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const LEGACY_SEED_PASSWORD_HASHES: Record<string, string> = Object.fromEntries(seedUsers.map(user => [user.email, user.passwordHash]))

// ---- Seed Data ----
const SEED: AppData = {
  plots: [
    {
      id: "p1",
      name: "แปลง A",
      area: 5,
      notes: "แปลงหมอนทองเก่า ต้นอายุ 8-12 ปี",
      trees: [
        { id: "t1", treeNumber: "A-001", variety: "หมอนทอง", age: 10, stage: "eggplant", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t2", treeNumber: "A-002", variety: "หมอนทอง", age: 10, stage: "nail", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t3", treeNumber: "A-003", variety: "หมอนทอง", age: 8, stage: "egg_fish", health: "fair", notes: "ต้นอ่อนแอเล็กน้อย", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t4", treeNumber: "A-004", variety: "หมอนทอง", age: 12, stage: "rat_tail", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t5", treeNumber: "A-005", variety: "หมอนทอง", age: 11, stage: "expanding", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
      ],
    },
    {
      id: "p2",
      name: "แปลง B",
      area: 3,
      notes: "แปลงชะนี ปลูกใหม่ 3-5 ปี",
      trees: [
        { id: "t6", treeNumber: "B-001", variety: "ชะนี", age: 4, stage: "vegetative", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t7", treeNumber: "B-002", variety: "ชะนี", age: 5, stage: "egg_fish", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t8", treeNumber: "B-003", variety: "ชะนี", age: 3, stage: "vegetative", health: "fair", notes: "", batches: [], lastUpdated: new Date().toISOString() },
      ],
    },
    {
      id: "p3",
      name: "แปลง C",
      area: 4,
      notes: "แปลงผสมพันธุ์",
      trees: [
        { id: "t9", treeNumber: "C-001", variety: "กันยาว", age: 7, stage: "white_flower", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
        { id: "t10", treeNumber: "C-002", variety: "พวงมณี", age: 6, stage: "eggplant", health: "good", notes: "", batches: [], lastUpdated: new Date().toISOString() },
      ],
    },
  ],
  activities: [
    { id: "a1", date: new Date(Date.now()-2*86400000).toISOString(), plotId: "p1", activityType: "fertilize", description: "ใส่ปุ๋ยเคมีสูตร 13-13-21 แปลง A", cost: 1200, createdAt: new Date().toISOString() },
    { id: "a2", date: new Date(Date.now()-1*86400000).toISOString(), plotId: "p2", activityType: "spray", description: "พ่นยากำจัดแมลง แปลง B", cost: 800, createdAt: new Date().toISOString() },
    { id: "a3", date: new Date().toISOString(), plotId: "p1", activityType: "water", description: "รดน้ำแปลง A ช่วงออกดอก", cost: 0, createdAt: new Date().toISOString() },
  ],
  tasks: [
    { id: "tk1", date: new Date(Date.now()+86400000).toISOString(), plotId: "p1", title: "พ่นยาป้องกันโรค", description: "ใช้สารป้องกันโรคราน้ำค้าง", status: "pending", priority: "high" },
    { id: "tk2", date: new Date(Date.now()+2*86400000).toISOString(), plotId: "p2", title: "ใส่ปุ๋ยรองพื้น", description: "ปุ๋ยอินทรีย์ 50 กก./ต้น", status: "pending", priority: "medium" },
    { id: "tk3", date: new Date(Date.now()-86400000).toISOString(), plotId: "p1", title: "ตรวจดูการออกดอก", description: "นับเปอร์เซ็นต์การออกดอก", status: "done", priority: "medium" },
  ],
  finance: [
    { id: "f1", date: new Date(Date.now()-5*86400000).toISOString(), type: "income", category: "ขายผล", amount: 45000, description: "ขายทุเรียนหมอนทอง 300 กก.", plotId: "p1" },
    { id: "f2", date: new Date(Date.now()-3*86400000).toISOString(), type: "expense", category: "ปุ๋ย", amount: 3500, description: "ซื้อปุ๋ยเคมีและอินทรีย์", plotId: "p1" },
    { id: "f3", date: new Date(Date.now()-2*86400000).toISOString(), type: "expense", category: "แรงงาน", amount: 2400, description: "ค่าแรงงานตัดหญ้า 2 วัน", plotId: "p2" },
    { id: "f4", date: new Date(Date.now()-1*86400000).toISOString(), type: "expense", category: "ยา", amount: 1800, description: "ซื้อสารเคมีกำจัดแมลง", plotId: "p2" },
    { id: "f5", date: new Date().toISOString(), type: "income", category: "ขายผล", amount: 28000, description: "ขายทุเรียนชะนี 200 กก.", plotId: "p2" },
  ],
  users: seedUsers,
  articles: seedArticles,
  products: seedProducts,
  siteSettings: {
    siteName: "สวนทุเรียน",
    tagline: "Smart Orchard",
    logoUrl: "",
  },
}

// ---- Hook ----
const STORAGE_KEY = "durian_orchard_data"

async function hashPassword(email: string, password: string) {
  const payload = `${email.trim().toLowerCase()}:${password}`
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return payload
  }
  const bytes = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

function withoutPlainPasswords(users: AppUser[]) {
  return users.map(({ password: _password, ...user }) => ({
    ...user,
    passwordHash: user.passwordHash || LEGACY_SEED_PASSWORD_HASHES[user.email.toLowerCase()] || "",
  }))
}

function migrateArticleImagesToAvif(articles: Article[]) {
  const migrated = articles.map(article => ({
    ...article,
    image: article.image.replace(/^\/images\/articles\/(.+)\.png$/, "/images/articles/$1.avif"),
  }))
  const existingIds = new Set(migrated.map(article => article.id))
  return [
    ...migrated,
    ...seedArticles.filter(article => !existingIds.has(article.id)),
  ]
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    if (typeof window === "undefined") return SEED
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return SEED
      const parsed = JSON.parse(stored) as AppData
      // Ensure all trees have a batches array to prevent crashes with old data
      parsed.plots.forEach(p => {
        p.trees.forEach(t => {
          if (!t.batches) t.batches = []
        })
      })
      return {
        ...parsed,
        users: parsed.users?.length ? withoutPlainPasswords(parsed.users) : seedUsers,
        articles: parsed.articles?.length ? migrateArticleImagesToAvif(parsed.articles) : seedArticles,
        products: parsed.products?.length ? parsed.products : seedProducts,
        siteSettings: parsed.siteSettings ?? SEED.siteSettings,
      }
    } catch { return SEED }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => updater(prev))
  }, [])

  // Plots
  const addPlot = useCallback((plot: Omit<Plot, "id" | "trees">) => {
    updateData(d => ({ ...d, plots: [...d.plots, { ...plot, id: `p${Date.now()}`, trees: [] }] }))
  }, [updateData])

  const updatePlot = useCallback((plotId: string, changes: Partial<Plot>) => {
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, ...changes } : p) }))
  }, [updateData])

  const deletePlot = useCallback((plotId: string) => {
    updateData(d => ({ ...d, plots: d.plots.filter(p => p.id !== plotId) }))
  }, [updateData])

  // Trees
  const addTree = useCallback((plotId: string, tree: Omit<Tree, "id" | "lastUpdated" | "batches">) => {
    const newTree: Tree = { ...tree, id: `t${Date.now()}`, batches: [], lastUpdated: new Date().toISOString() }
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, trees: [...p.trees, newTree] } : p) }))
  }, [updateData])

  const updateTree = useCallback((plotId: string, treeId: string, changes: Partial<Tree>) => {
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => t.id === treeId ? { ...t, ...changes, lastUpdated: new Date().toISOString() } : t) }
        : p)
    }))
  }, [updateData])

  const deleteTree = useCallback((plotId: string, treeId: string) => {
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, trees: p.trees.filter(t => t.id !== treeId) } : p) }))
  }, [updateData])

  const bulkUpdateTrees = useCallback((plotId: string, stage: FlowerStage) => {
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => ({ ...t, stage, lastUpdated: new Date().toISOString() })) }
        : p)
    }))
  }, [updateData])

  // Activities
  const addActivity = useCallback((act: Omit<Activity, "id" | "createdAt">) => {
    updateData(d => ({ ...d, activities: [{ ...act, id: `a${Date.now()}`, createdAt: new Date().toISOString() }, ...d.activities] }))
  }, [updateData])

  const deleteActivity = useCallback((id: string) => {
    updateData(d => ({ ...d, activities: d.activities.filter(a => a.id !== id) }))
  }, [updateData])

  const updateActivity = useCallback((id: string, changes: Partial<Activity>) => {
    updateData(d => ({ ...d, activities: d.activities.map(a => a.id === id ? { ...a, ...changes } : a) }))
  }, [updateData])

  // Tasks
  const addTask = useCallback((task: Omit<Task, "id">) => {
    updateData(d => ({ ...d, tasks: [...d.tasks, { ...task, id: `tk${Date.now()}` }] }))
  }, [updateData])

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    updateData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...changes } : t) }))
  }, [updateData])

  const deleteTask = useCallback((id: string) => {
    updateData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))
  }, [updateData])

  // Finance
  const addFinance = useCallback((rec: Omit<FinanceRecord, "id">) => {
    updateData(d => ({ ...d, finance: [{ ...rec, id: `f${Date.now()}` }, ...d.finance] }))
  }, [updateData])

  const deleteFinance = useCallback((id: string) => {
    updateData(d => ({ ...d, finance: d.finance.filter(f => f.id !== id) }))
  }, [updateData])

  // Users
  const authenticateUser = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()
    const passwordHash = await hashPassword(normalized, password)
    return data.users.find(u => u.email.toLowerCase() === normalized && u.passwordHash === passwordHash && u.status === "active") ?? null
  }, [data.users])

  const addUser = useCallback(async (user: NewUserInput) => {
    const normalized = user.email.trim().toLowerCase()
    const exists = data.users.some(u => u.email.toLowerCase() === normalized)
    if (exists) return null
    const { password, ...safeUser } = user
    const newUser: AppUser = {
      ...safeUser,
      email: normalized,
      passwordHash: await hashPassword(normalized, password),
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    updateData(d => ({ ...d, users: [newUser, ...d.users] }))
    return newUser
  }, [data.users, updateData])

  const updateUser = useCallback((id: string, changes: Partial<AppUser>) => {
    updateData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, ...changes } : u) }))
  }, [updateData])

  const deleteUser = useCallback((id: string) => {
    updateData(d => ({ ...d, users: d.users.filter(u => u.id !== id) }))
  }, [updateData])

  // Articles
  const addArticle = useCallback((article: Omit<Article, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    updateData(d => ({ ...d, articles: [{ ...article, id: `art${Date.now()}`, createdAt: now, updatedAt: now }, ...d.articles] }))
  }, [updateData])

  const updateArticle = useCallback((id: string, changes: Partial<Article>) => {
    updateData(d => ({ ...d, articles: d.articles.map(a => a.id === id ? { ...a, ...changes, updatedAt: new Date().toISOString() } : a) }))
  }, [updateData])

  const deleteArticle = useCallback((id: string) => {
    updateData(d => ({ ...d, articles: d.articles.filter(a => a.id !== id) }))
  }, [updateData])

  // Products
  const addProduct = useCallback((product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    updateData(d => ({ ...d, products: [{ ...product, id: `prod${Date.now()}`, createdAt: now, updatedAt: now }, ...d.products] }))
  }, [updateData])

  const updateProduct = useCallback((id: string, changes: Partial<Product>) => {
    updateData(d => ({ ...d, products: d.products.map(p => p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p) }))
  }, [updateData])

  const deleteProduct = useCallback((id: string) => {
    updateData(d => ({ ...d, products: d.products.filter(p => p.id !== id) }))
  }, [updateData])

  const updateSiteSettings = useCallback((changes: Partial<SiteSettings>) => {
    updateData(d => ({ ...d, siteSettings: { ...d.siteSettings, ...changes } }))
  }, [updateData])

  // Batches
  const addBatch = useCallback((plotId: string, treeId: string, batchName: string) => {
    const newBatch: FlowerBatch = {
      id: `b${Date.now()}`,
      name: batchName,
      fruitCount: 0,
      stages: []
    }
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => t.id === treeId ? { ...t, batches: [...(t.batches || []), newBatch] } : t) }
        : p)
    }))
  }, [updateData])

  const addBatchStage = useCallback((plotId: string, treeId: string, batchId: string, stageData: Omit<BatchStage, "id">) => {
    const newStage: BatchStage = { ...stageData, id: `s${Date.now()}` }
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => t.id === treeId 
            ? { 
                ...t, 
                stage: stageData.stage, // Update main tree stage to latest
                batches: t.batches.map(b => b.id === batchId 
                  ? { 
                      ...b, 
                      stages: [newStage, ...b.stages],
                      bloomDate: stageData.stage === 'bloom' ? stageData.date : b.bloomDate // 'bloom' logic
                    } 
                  : b) 
              } 
            : t) 
          }
        : p)
    }))
  }, [updateData])

  const updateBatch = useCallback((plotId: string, treeId: string, batchId: string, changes: Partial<FlowerBatch>) => {
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => t.id === treeId 
            ? { ...t, batches: t.batches.map(b => b.id === batchId ? { ...b, ...changes } : b) } 
            : t) }
        : p)
    }))
  }, [updateData])

  const deleteBatch = useCallback((plotId: string, treeId: string, batchId: string) => {
    updateData(d => ({
      ...d,
      plots: d.plots.map(p => p.id === plotId
        ? { ...p, trees: p.trees.map(t => t.id === treeId ? { ...t, batches: t.batches.filter(b => b.id !== batchId) } : t) }
        : p)
    }))
  }, [updateData])

  return {
    data,
    addPlot, updatePlot, deletePlot,
    addTree, updateTree, deleteTree, bulkUpdateTrees,
    addActivity, deleteActivity, updateActivity,
    addTask, updateTask, deleteTask,
    addFinance, deleteFinance,
    addBatch, addBatchStage, updateBatch, deleteBatch,
    authenticateUser, addUser, updateUser, deleteUser,
    addArticle, updateArticle, deleteArticle,
    addProduct, updateProduct, deleteProduct,
    updateSiteSettings,
  }
}
