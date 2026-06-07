"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createExcerpt, createGeoSummary, createSlug, uniqueKeywords } from "./seo"
import { appRuntimeConfig, isSupabaseConfigured } from "./runtime-config"
import { loadRemoteAppData, loadStructuredAppData, saveRemoteAppData, saveStructuredAppData } from "./supabase/app-data"
import {
  fetchArticles, upsertArticle, removeArticle,
  fetchProducts, upsertProduct, removeProduct,
} from "./supabase/articles"
import { findUserByEmail as findSupabaseUserByEmail, insertUser as insertSupabaseUser, updateUser as updateSupabaseUser } from "./supabase/queries"
import { normalizeAuthProvider, resolveOAuthProfileFromAuthUser } from "./oauth-profile"
import { createClient } from "./supabase/client"

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
  "vegetative", "egg_fish", "nail", "mouse_foot", "eggplant", "bracelet", "white_flower", "bloom", "rat_tail", "chicken_egg", "expanding", "harvest", "dormant"
]

export type DurianVariety = "หมอนทอง" | "ชะนี" | "กันยาว" | "พวงมณี" | "ก้านยาว" | "กระดุม" | "อื่นๆ"
export const VARIETIES: DurianVariety[] = ["หมอนทอง", "ชะนี", "กันยาว", "พวงมณี", "ก้านยาว", "กระดุม", "อื่นๆ"]

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
  userId?: string
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
  userId?: string
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
  userId?: string
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
export const EXPENSE_CATEGORIES: FinanceCategory[] = ["ปุ๋ย", "ยา", "แรงงาน", "น้ำ/ไฟ", "อุปกรณ์", "ขนส่ง", "อื่นๆ"]

export interface FinanceRecord {
  id: string
  userId?: string
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
  coverImage?: string
  coverPositionX?: number
  coverPositionY?: number
  farmName?: string
  farmLocation?: { lat: number; lon: number; label: string }
  savedArticleIds?: string[]
  createdAt: string
}

export type OAuthUserInput = {
  authId?: string
  email: string
  name?: string
  provider: string
  avatar?: string
}

export interface Article {
  id: string
  title: string
  category: string
  image: string
  imageAlt?: string
  content: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  geoSummary?: string
  authorName?: string
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
  imageAlt?: string
  priceLabel: string
  description: string
  affiliateUrl: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  geoSummary?: string
  brandName?: string
  sku?: string
  status: "active" | "draft"
  createdAt: string
  updatedAt: string
}

export interface SiteSettings {
  siteName: string
  tagline: string
  logoUrl: string
  googleVerification?: string
  googleAnalytics?: string
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
  { id: "art8", title: "เช็กความพร้อมสวนก่อนเข้าฤดูฝน", category: "การดูแลรักษา", image: "/images/articles/article_pruning_1778039300000_1778039722927.avif", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: "ก่อนเข้าฤดูฝนควรสำรวจทางน้ำ ร่องระบายน้ำ และพื้นที่ต่ำในสวนให้พร้อม เพราะน้ำขังเป็นปัจจัยสำคัญที่กระตุ้นโรครากเน่าโคนเน่าในทุเรียน โดยเฉพาะต้นที่มีแผลหรือระบบรากอ่อนแอ\n\nควรตัดแต่งกิ่งที่แน่นเกินไป เก็บเศษใบและผลร่วงออกจากโคนต้น และตรวจสภาพดินหลังฝนตกทุกครั้ง หากพบจุดที่น้ำไหลช้าหรือขังนาน ควรปรับร่องระบายทันทีเพื่อลดความเสี่ยงก่อนเกิดปัญหาใหญ่" },
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
    description: "ช่วยลดความเสี่ยงโรคจากเชื้อราในช่วงอากาศชื้นและหน้าฝน",
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
    description: "เหมาะกับช่วงบำรุงผล เน้นความสมบูรณ์และการเพิ่มน้ำหนักผล",
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
    description: "ใช้งานสะดวกสำหรับงานพ่นยา ดูแลทรงพุ่ม และจัดการงานในสวน",
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
    { id: "a1", date: new Date(Date.now() - 2 * 86400000).toISOString(), plotId: "p1", activityType: "fertilize", description: "ใส่ปุ๋ยเคมีสูตร 13-13-21 แปลง A", cost: 1200, createdAt: new Date().toISOString() },
    { id: "a2", date: new Date(Date.now() - 1 * 86400000).toISOString(), plotId: "p2", activityType: "spray", description: "พ่นยากำจัดแมลง แปลง B", cost: 800, createdAt: new Date().toISOString() },
    { id: "a3", date: new Date().toISOString(), plotId: "p1", activityType: "water", description: "รดน้ำแปลง A ช่วงออกดอก", cost: 0, createdAt: new Date().toISOString() },
  ],
  tasks: [
    { id: "tk1", date: new Date(Date.now() + 86400000).toISOString(), plotId: "p1", title: "พ่นยาป้องกันโรค", description: "ใช้สารป้องกันโรคราน้ำค้าง", status: "pending", priority: "high" },
    { id: "tk2", date: new Date(Date.now() + 2 * 86400000).toISOString(), plotId: "p2", title: "ใส่ปุ๋ยรองพื้น", description: "ปุ๋ยอินทรีย์ 50 กก./ต้น", status: "pending", priority: "medium" },
    { id: "tk3", date: new Date(Date.now() - 86400000).toISOString(), plotId: "p1", title: "ตรวจดูการออกดอก", description: "นับเปอร์เซ็นต์การออกดอก", status: "done", priority: "medium" },
  ],
  finance: [],
  users: seedUsers,
  articles: seedArticles,
  products: seedProducts,
  siteSettings: {
    siteName: "Durian Flow",
    tagline: "Smart Orchard",
    logoUrl: "",
    googleVerification: "",
    googleAnalytics: "",
  },
}

// ---- Hook ----
const STORAGE_KEY_BASE = "durian_orchard_data"
function getStorageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY_BASE}_${userId}` : STORAGE_KEY_BASE
}
const STORAGE_WRITE_DELAY_MS = 250

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

function normalizeArticleSeo(article: Article): Article {
  return {
    ...article,
    image: article.image.replace(/^\/images\/articles\/(.+)\.png$/, "/images/articles/$1.avif"),
    imageAlt: article.imageAlt || article.title,
    slug: article.slug || createSlug(article.title),
    metaTitle: article.metaTitle || article.title,
    metaDescription: article.metaDescription || createExcerpt(article.content),
    keywords: uniqueKeywords([article.keywords, article.category, article.title, "ทุเรียน"]).join(", "),
    geoSummary: article.geoSummary || createGeoSummary(article.title, article.content),
    authorName: article.authorName || "ทีมสวนทุเรียน",
  }
}

function normalizeProductSeo(product: Product): Product {
  return {
    ...product,
    imageAlt: product.imageAlt || product.name,
    slug: product.slug || createSlug(product.name),
    metaTitle: product.metaTitle || product.name,
    metaDescription: product.metaDescription || createExcerpt(product.description),
    keywords: uniqueKeywords([product.keywords, product.category, product.name, "ปุ๋ยยา", "ทุเรียน"]).join(", "),
    geoSummary: product.geoSummary || createGeoSummary(product.name, product.description),
    brandName: product.brandName || "สวนทุเรียน",
  }
}

function migrateArticleImagesToAvif(articles: Article[]) {
  const migrated = articles.map(normalizeArticleSeo)
  const existingIds = new Set(migrated.map(article => article.id))
  return [
    ...migrated,
    ...seedArticles.filter(article => !existingIds.has(article.id)).map(normalizeArticleSeo),
  ]
}

function normalizeAppData(data: AppData): AppData {
  data.plots.forEach(p => {
    p.trees.forEach(t => {
      if (!t.batches) t.batches = []
    })
  })

  return {
    ...data,
    users: data.users?.length ? withoutPlainPasswords(data.users) : seedUsers,
    articles: data.articles?.length ? migrateArticleImagesToAvif(data.articles) : seedArticles.map(normalizeArticleSeo),
    products: data.products?.length ? data.products.map(normalizeProductSeo) : seedProducts.map(normalizeProductSeo),
    siteSettings: data.siteSettings ?? SEED.siteSettings,
  }
}

function getInitialAppData(userId?: string | null): AppData {
  if (typeof window === "undefined") return SEED
  try {
    const key = getStorageKey(userId)
    const stored = localStorage.getItem(key)
    if (!stored) {
      // New user: seed without finance records (finance is per-user)
      const seedWithoutFinance = {
        ...SEED,
        finance: [],
        articles: seedArticles.map(normalizeArticleSeo),
        products: seedProducts.map(normalizeProductSeo),
      }
      return normalizeAppData(seedWithoutFinance)
    }

    return normalizeAppData(JSON.parse(stored) as AppData)
  } catch {
    const seedWithoutFinance = {
      ...SEED,
      finance: [],
      articles: seedArticles.map(normalizeArticleSeo),
      products: seedProducts.map(normalizeProductSeo),
    }
    return normalizeAppData(seedWithoutFinance)
  }
}

export function useAppData(currentUserId?: string | null) {
  const [data, setData] = useState<AppData>(() => getInitialAppData(currentUserId))
  const [remoteReady, setRemoteReady] = useState(false)
  const initialDataRef = useRef(data)
  const lastRemoteJsonRef = useRef("")
  const isMockUser = useMemo(() => {
    if (!currentUserId) return true
    const user = data.users.find(u => u.id === currentUserId)
    if (user) return user.provider === "email"
    return currentUserId === "u-admin" || currentUserId === "u-user" || currentUserId === "u-staff" || !currentUserId.includes("-")
  }, [data.users, currentUserId])

  const isSupabaseMode = appRuntimeConfig.dataMode === "supabase" && isSupabaseConfigured

  const toRemoteResult = useCallback(async <T,>(promise: Promise<T>) => {
    try {
      return { data: await promise, ok: true }
    } catch {
      return { data: null, ok: false }
    }
  }, [])

  useEffect(() => {
    const key = getStorageKey(currentUserId)
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch {
        // ignore
      }
    }, STORAGE_WRITE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [data, currentUserId])

  // When the current user changes, reload their scoped local data (or seed if missing)
  useEffect(() => {
    try {
      const next = getInitialAppData(currentUserId)
      initialDataRef.current = next
      lastRemoteJsonRef.current = ""
      setData(next)
      setRemoteReady(false)
    } catch {
      // ignore
    }
  }, [currentUserId])

  // Load app_data (plots/activities/tasks/finance/users/settings) + articles + products from Supabase
  useEffect(() => {
    if (!isSupabaseMode) {
      setRemoteReady(false)
      return
    }

    let active = true

    const structuredDataPromise = currentUserId && !isMockUser
      ? toRemoteResult(loadStructuredAppData(currentUserId))
      : Promise.resolve({ data: null, ok: true })

    Promise.all([
      structuredDataPromise,
      currentUserId ? Promise.resolve({ data: null, ok: true }) : toRemoteResult(loadRemoteAppData()),
      toRemoteResult(fetchArticles()),
      toRemoteResult(fetchProducts()),
    ])
      .then(([structuredResult, remoteResult, articlesResult, productsResult]) => {
        if (!active) return

        const structuredData = structuredResult.data
        const remoteData = remoteResult.data
        const remoteArticles = articlesResult.data
        const remoteProducts = productsResult.data

        if (structuredData || remoteData) {
          const sourceData = structuredData ?? remoteData!
          const normalized = normalizeAppData({
            ...sourceData,
            // override with dedicated table data if available
            articles: remoteArticles?.length ? remoteArticles : sourceData.articles,
            products: remoteProducts?.length ? remoteProducts : sourceData.products,
          })
          lastRemoteJsonRef.current = JSON.stringify(normalized)
          setData(normalized)

          if (!structuredData && !isMockUser) {
            void saveStructuredAppData(normalized, currentUserId)
          }
        } else if ((currentUserId && !isMockUser ? structuredResult.ok : remoteResult.ok)) {
          // First run: seed app_data and push seed articles/products to their tables
          const initial = initialDataRef.current
          if (!isMockUser || !currentUserId) {
            void saveRemoteAppData(initial, currentUserId)
          }
        }

        setRemoteReady(true)
      })
      .catch(() => {
        if (active) setRemoteReady(true)
      })

    return () => {
      active = false
    }
  }, [currentUserId, isSupabaseMode, isMockUser, toRemoteResult])

  // Sync non-articles/products data back to app_data blob
  useEffect(() => {
    if (!isSupabaseMode || !remoteReady || !currentUserId || isMockUser) return

    const nextJson = JSON.stringify(data)
    if (lastRemoteJsonRef.current === nextJson) return

    const timeoutId = window.setTimeout(() => {
      saveRemoteAppData(data, currentUserId)
        .then(() => {
          lastRemoteJsonRef.current = nextJson
        })
        .catch(error => {
          const { message, code, details, hint } = error ?? {}
          if (code !== "42501") {
            console.error("Supabase data save failed", { message, code, details, hint }, error)
          }
        })
    }, STORAGE_WRITE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [currentUserId, data, isSupabaseMode, remoteReady, isMockUser])

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => updater(prev))
  }, [])

  // Plots
  const addPlot = useCallback((plot: Omit<Plot, "id" | "trees"> & { trees?: Tree[] }) => {
    updateData(d => ({ ...d, plots: [...d.plots, { ...plot, userId: currentUserId ?? plot.userId, id: `p${Date.now()}`, trees: plot.trees || [] }] }))
  }, [currentUserId, updateData])

  const updatePlot = useCallback((plotId: string, changes: Partial<Plot>) => {
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, ...changes } : p) }))
  }, [updateData])

  const deletePlot = useCallback((plotId: string) => {
    updateData(d => ({ ...d, plots: d.plots.filter(p => p.id !== plotId) }))
  }, [updateData])

  // Trees
  const addTree = useCallback((plotId: string, tree: Omit<Tree, "id" | "lastUpdated" | "batches">) => {
    const newTree: Tree = { ...tree, id: `t${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, batches: [], lastUpdated: new Date().toISOString() }
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, trees: [...p.trees, newTree] } : p) }))
  }, [updateData])

  const addTrees = useCallback((plotId: string, treesList: Omit<Tree, "id" | "lastUpdated" | "batches">[]) => {
    const nowStr = new Date().toISOString()
    const newTrees: Tree[] = treesList.map((t, idx) => ({
      ...t,
      id: `t${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      batches: [],
      lastUpdated: nowStr
    }))
    updateData(d => ({ ...d, plots: d.plots.map(p => p.id === plotId ? { ...p, trees: [...p.trees, ...newTrees] } : p) }))
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
    updateData(d => ({ ...d, activities: [{ ...act, userId: currentUserId ?? act.userId, id: `a${Date.now()}`, createdAt: new Date().toISOString() }, ...d.activities] }))
  }, [currentUserId, updateData])

  const deleteActivity = useCallback((id: string) => {
    updateData(d => ({ ...d, activities: d.activities.filter(a => a.id !== id) }))
  }, [updateData])

  const updateActivity = useCallback((id: string, changes: Partial<Activity>) => {
    updateData(d => ({ ...d, activities: d.activities.map(a => a.id === id ? { ...a, ...changes } : a) }))
  }, [updateData])

  // Tasks
  const addTask = useCallback((task: Omit<Task, "id">) => {
    updateData(d => ({ ...d, tasks: [...d.tasks, { ...task, userId: currentUserId ?? task.userId, id: `tk${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }] }))
  }, [currentUserId, updateData])

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    updateData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...changes } : t) }))
  }, [updateData])

  const deleteTask = useCallback((id: string) => {
    updateData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))
  }, [updateData])

  // Finance
  const addFinance = useCallback((rec: Omit<FinanceRecord, "id">) => {
    updateData(d => ({ ...d, finance: [{ ...rec, userId: currentUserId ?? rec.userId, id: `f${Date.now()}` }, ...d.finance] }))
  }, [currentUserId, updateData])

  const deleteFinance = useCallback((id: string) => {
    updateData(d => ({ ...d, finance: d.finance.filter(f => f.id !== id) }))
  }, [updateData])

  // Users
  const upsertOAuthUser = useCallback(async (input: OAuthUserInput) => {
    const normalized = input.email.trim().toLowerCase()
    if (!normalized) return null

    const provider = normalizeAuthProvider(input.provider)
    const nextAvatar = input.avatar?.trim() || undefined
    const remoteUser = isSupabaseMode ? await findSupabaseUserByEmail(normalized).catch(() => null) : null
    const existing = remoteUser ?? data.users.find(u => u.email.toLowerCase() === normalized)
    if (existing) {
      if (existing.status !== "active") return null
      const changes: Partial<AppUser> = {
        name: input.name?.trim() || existing.name,
        provider,
        avatar: nextAvatar || existing.avatar,
      }
      const nextUser = { ...existing, ...changes }
      updateData(d => ({
        ...d,
        users: d.users.some(u => u.id === existing.id)
          ? d.users.map(u => u.id === existing.id ? nextUser : u)
          : [nextUser, ...d.users.filter(u => u.email.toLowerCase() !== normalized)],
      }))
      if (isSupabaseMode) {
        await updateSupabaseUser(existing.id, changes).catch(() => undefined)
      }
      return nextUser
    }

    const providerSlug = provider || "oauth"
    const newUser: AppUser = {
      id: `u-${providerSlug}-${input.authId || Date.now()}`,
      name: input.name?.trim() || normalized.split("@")[0],
      email: normalized,
      passwordHash: "",
      role: "user",
      status: "active",
      provider,
      avatar: nextAvatar,
      createdAt: new Date().toISOString(),
    }

    updateData(d => ({ ...d, users: [newUser, ...d.users] }))
    if (isSupabaseMode) {
      await insertSupabaseUser(newUser).catch(() => undefined)
    }
    return newUser
  }, [data.users, isSupabaseMode, updateData])

  const authenticateUser = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()

    if (isSupabaseMode) {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      })
      if (authError) {
        throw new Error(authError.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : authError.message)
      }
      if (!authData.user) {
        throw new Error("เข้าสู่ระบบไม่สำเร็จ")
      }
      
      const identity = resolveOAuthProfileFromAuthUser(authData.user)
      if (!identity) {
        throw new Error("ดึงข้อมูลโปรไฟล์ล้มเหลว")
      }
      const appUser = await upsertOAuthUser(identity)
      if (!appUser) {
        throw new Error("บัญชีนี้ถูกระงับการใช้งาน")
      }
      return appUser
    }

    const passwordHash = await hashPassword(normalized, password)
    return data.users.find(u => u.email.toLowerCase() === normalized && u.passwordHash === passwordHash && u.status === "active") ?? null
  }, [data.users, isSupabaseMode, upsertOAuthUser])

  const addUser = useCallback(async (user: NewUserInput) => {
    const normalized = user.email.trim().toLowerCase()

    if (isSupabaseMode) {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalized,
        password: user.password,
        options: {
          data: {
            name: user.name,
          },
        },
      })
      if (authError) {
        if (authError.message.includes("already registered") || authError.status === 422) {
          throw new Error("อีเมลนี้มีผู้ใช้งานแล้ว")
        }
        throw new Error(authError.message)
      }
      
      // If email confirmation is enabled, session will be null
      if (authData.user && !authData.session) {
        throw new Error("confirmation_required")
      }
      
      if (authData.user) {
        const identity = resolveOAuthProfileFromAuthUser(authData.user)
        if (!identity) {
          throw new Error("สร้างบัญชีสำเร็จ แต่ไม่สามารถดึงข้อมูลโปรไฟล์ได้")
        }
        const appUser = await upsertOAuthUser(identity)
        if (!appUser) {
          throw new Error("สร้างบัญชีสำเร็จ แต่บัญชีถูกระงับ")
        }
        return appUser
      }
      throw new Error("ลงทะเบียนไม่สำเร็จ")
    }

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
  }, [data.users, isSupabaseMode, updateData, upsertOAuthUser])

  const resetPassword = useCallback(async (email: string, password: string) => {
    if (isSupabaseMode) {
      throw new Error("การเปลี่ยนรหัสผ่านโดยตรงไม่รองรับในโหมด Supabase กรุณาติดต่อผู้ดูแลระบบเพื่อขอรีเซ็ตรหัสผ่านผ่าน Supabase Dashboard")
    }

    const normalized = email.trim().toLowerCase()
    const user = data.users.find(u => u.email.toLowerCase() === normalized && u.provider === "email")
    if (!user) return null
    const passwordHash = await hashPassword(normalized, password)
    updateData(d => ({
      ...d,
      users: d.users.map(u => u.id === user.id ? { ...u, passwordHash } : u),
    }))
    return { ...user, passwordHash }
  }, [data.users, isSupabaseMode, updateData])

  const updateUser = useCallback(async (id: string, changes: Partial<AppUser>) => {
    updateData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, ...changes } : u) }))
    
    const userToUpdate = data.users.find(u => u.id === id)
    const targetIsMock = userToUpdate
      ? userToUpdate.provider === "email"
      : (id === "u-admin" || id === "u-user" || id === "u-staff" || !id.includes("-"))

    if (isSupabaseMode && !targetIsMock) {
      const updatedUser = await updateSupabaseUser(id, userToUpdate ? { ...userToUpdate, ...changes } : changes)
      updateData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, ...updatedUser } : u) }))
    }
  }, [isSupabaseMode, updateData, data.users])

  const deleteUser = useCallback((id: string) => {
    updateData(d => ({ ...d, users: d.users.filter(u => u.id !== id) }))
  }, [updateData])

  // Articles
  const addArticle = useCallback((article: Omit<Article, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const nextArticle = normalizeArticleSeo({ ...article, id: `art${Date.now()}`, createdAt: now, updatedAt: now })
    updateData(d => ({ ...d, articles: [nextArticle, ...d.articles] }))
    if (isSupabaseMode) void upsertArticle(nextArticle)
  }, [updateData, isSupabaseMode])

  const updateArticle = useCallback((id: string, changes: Partial<Article>) => {
    updateData(d => {
      const next = d.articles.map(a => a.id === id ? normalizeArticleSeo({ ...a, ...changes, updatedAt: new Date().toISOString() }) : a)
      if (isSupabaseMode) {
        const updated = next.find(a => a.id === id)
        if (updated) void upsertArticle(updated)
      }
      return { ...d, articles: next }
    })
  }, [updateData, isSupabaseMode])

  const deleteArticle = useCallback((id: string) => {
    updateData(d => ({ ...d, articles: d.articles.filter(a => a.id !== id) }))
    if (isSupabaseMode) void removeArticle(id)
  }, [updateData, isSupabaseMode])

  // Products
  const addProduct = useCallback((product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const nextProduct = normalizeProductSeo({ ...product, id: `prod${Date.now()}`, createdAt: now, updatedAt: now })
    updateData(d => ({ ...d, products: [nextProduct, ...d.products] }))
    if (isSupabaseMode) void upsertProduct(nextProduct)
  }, [updateData, isSupabaseMode])

  const updateProduct = useCallback((id: string, changes: Partial<Product>) => {
    updateData(d => {
      const next = d.products.map(p => p.id === id ? normalizeProductSeo({ ...p, ...changes, updatedAt: new Date().toISOString() }) : p)
      if (isSupabaseMode) {
        const updated = next.find(p => p.id === id)
        if (updated) void upsertProduct(updated)
      }
      return { ...d, products: next }
    })
  }, [updateData, isSupabaseMode])

  const deleteProduct = useCallback((id: string) => {
    updateData(d => ({ ...d, products: d.products.filter(p => p.id !== id) }))
    if (isSupabaseMode) void removeProduct(id)
  }, [updateData, isSupabaseMode])

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
        ? {
          ...p, trees: p.trees.map(t => t.id === treeId
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
        ? {
          ...p, trees: p.trees.map(t => t.id === treeId
            ? { ...t, batches: t.batches.map(b => b.id === batchId ? { ...b, ...changes } : b) }
            : t)
        }
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

  return useMemo(() => ({
    data,
    addPlot, updatePlot, deletePlot,
    addTree, addTrees, updateTree, deleteTree, bulkUpdateTrees,
    addActivity, deleteActivity, updateActivity,
    addTask, updateTask, deleteTask,
    addFinance, deleteFinance,
    addBatch, addBatchStage, updateBatch, deleteBatch,
    authenticateUser, addUser, resetPassword, upsertOAuthUser, updateUser, deleteUser,
    addArticle, updateArticle, deleteArticle,
    addProduct, updateProduct, deleteProduct,
    updateSiteSettings,
  }), [
    data,
    addPlot, updatePlot, deletePlot,
    addTree, addTrees, updateTree, deleteTree, bulkUpdateTrees,
    addActivity, deleteActivity, updateActivity,
    addTask, updateTask, deleteTask,
    addFinance, deleteFinance,
    addBatch, addBatchStage, updateBatch, deleteBatch,
    authenticateUser, addUser, resetPassword, upsertOAuthUser, updateUser, deleteUser,
    addArticle, updateArticle, deleteArticle,
    addProduct, updateProduct, deleteProduct,
    updateSiteSettings,
  ])
}
