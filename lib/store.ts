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

export interface AppData {
  plots: Plot[]
  activities: Activity[]
  tasks: Task[]
  finance: FinanceRecord[]
}

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
}

// ---- Hook ----
const STORAGE_KEY = "durian_orchard_data"

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
      return parsed
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
    addActivity, deleteActivity,
    addTask, updateTask, deleteTask,
    addFinance, deleteFinance,
    addBatch, addBatchStage, updateBatch, deleteBatch
  }
}
