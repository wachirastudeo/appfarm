"use client"

import { useState, useRef, useEffect } from "react"
import { X, ClipboardCheck, MapPinned, CalendarDays, Coins, CloudRain, Sparkles, ArrowRight, Check, Plus, AlertCircle, Sun, Wind } from "lucide-react"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"

interface Props {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
  initialTab?: "tasks" | "plots" | "activities" | "finance"
}

export default function SandboxModal({ isOpen, onClose, onLogin, initialTab = "tasks" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<"tasks" | "plots" | "activities" | "finance">(initialTab)

  useEscapeToClose({ enabled: isOpen, onEscape: onClose, containerRef })

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // --- Sandbox State: Tasks ---
  const [tasks, setTasks] = useState([
    { id: "tk1", title: "พ่นยากำจัดโรคใบจุด (เมทาแลกซิล)", priority: "high", done: false },
    { id: "tk2", title: "ใส่ปุ๋ยบำรุงดอกระยะมะเขือพวง (สูตร 8-24-24)", priority: "high", done: true },
    { id: "tk3", title: "ตรวจสอบการระบายน้ำ แปลงหมอนทองหลังเนิน", priority: "medium", done: false },
    { id: "tk4", title: "ตรวจวัดความชื้นดินด้วยเซนเซอร์ไฟฟ้า", priority: "low", done: false },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium")

  // --- Sandbox State: Tree Growth ---
  const [growthStage, setGrowthStage] = useState<"nail" | "eggplant" | "bloom" | "rat_tail" | "expanding" | "harvest">("eggplant")

  // --- Sandbox State: Activity Log ---
  const [activities, setActivities] = useState([
    { id: "a1", type: "water", desc: "รดน้ำแปลง A โซนหมอนทอง ช่วงเช้า 40 นาที", cost: 0, date: "วันนี้ 08:30 น." },
    { id: "a2", type: "fertilize", desc: "ใส่ปุ๋ยบำรุงทางใบ เร่งการฟอร์มตาดอก", cost: 1200, date: "เมื่อวานนี้" },
    { id: "a3", type: "inspect", desc: "เดินตรวจโรคใบไหม้พบ 2 ต้น ทำการพ่นยากลุ่มคอปเปอร์", cost: 450, date: "2 วันที่แล้ว" }
  ])
  const [newActType, setNewActType] = useState<"water" | "fertilize" | "prune" | "harvest" | "inspect">("water")
  const [newActDesc, setNewActDesc] = useState("")
  const [newActCost, setNewActCost] = useState("")

  // --- Sandbox State: Finance ---
  const [financeRecords, setFinanceRecords] = useState([
    { id: "f1", type: "expense", desc: "ซื้อปุ๋ยอินทรีย์เคมี ตราค้างคาว 5 กระสอบ", amount: 3750, date: "25 พ.ค. 2026" },
    { id: "f2", type: "expense", desc: "ค่าน้ำมันปั๊มน้ำระบบสปริงเกอร์รายสัปดาห์", amount: 800, date: "24 พ.ค. 2026" },
    { id: "f3", type: "income", desc: "ขายผลทุเรียนล่วงหน้า มัดจำเหมาแปลง B", amount: 20000, date: "20 พ.ค. 2026" }
  ])
  const [finDesc, setFinDesc] = useState("")
  const [finAmount, setFinAmount] = useState("")
  const [finType, setFinType] = useState<"income" | "expense">("expense")



  if (!isOpen) return null

  // --- Handlers: Tasks ---
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setTasks(prev => [
      ...prev,
      { id: `tk-${Date.now()}`, title: newTaskTitle.trim(), priority: newTaskPriority, done: false }
    ])
    setNewTaskTitle("")
  }

  // --- Handlers: Activity Log ---
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActDesc.trim()) return
    const cost = parseFloat(newActCost) || 0
    setActivities(prev => [
      {
        id: `a-${Date.now()}`,
        type: newActType,
        desc: newActDesc.trim(),
        cost,
        date: "เมื่อสักครู่นี้"
      },
      ...prev
    ])
    setNewActDesc("")
    setNewActCost("")
  }

  // --- Handlers: Finance ---
  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!finDesc.trim() || !finAmount.trim()) return
    const amount = parseFloat(finAmount) || 0
    setFinanceRecords(prev => [
      {
        id: `f-${Date.now()}`,
        type: finType,
        desc: finDesc.trim(),
        amount,
        date: "25 พ.ค. 2026"
      },
      ...prev
    ])
    setFinDesc("")
    setFinAmount("")
  }

  // --- Calculations ---
  const completedTasksCount = tasks.filter(t => t.done).length
  const progressPercent = Math.round((completedTasksCount / tasks.length) * 100) || 0

  const totalIncome = financeRecords.filter(r => r.type === "income").reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = financeRecords.filter(r => r.type === "expense").reduce((acc, curr) => acc + curr.amount, 0)
  const netProfit = totalIncome - totalExpense

  // --- Text Translators ---
  const getActTypeLabel = (type: string) => {
    switch (type) {
      case "water": return "รดน้ำ"
      case "fertilize": return "ใส่ปุ๋ย"
      case "prune": return "ตัดแต่ง"
      case "harvest": return "เก็บเกี่ยว"
      case "inspect": return "สำรวจสวน"
      default: return "อื่นๆ"
    }
  }

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-all duration-300" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white border border-[#B9DCC8]/40 shadow-2xl dark:border-[#31533D]/60 dark:bg-[#0F1F17] transition-all animate-fade-in-up md:grid md:grid-cols-[240px_1fr]">
        
        {/* Custom animations block */}
        <style>{`
          @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-spin-slow {
            animation: spinSlow 12s linear infinite;
          }
          .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .particle-glow {
            box-shadow: 0 0 15px 2px rgba(114, 192, 138, 0.4);
          }
        `}</style>

        {/* Sidebar Navigation */}
        <aside className="border-b border-[#E7F3EC] bg-[#F7FCF9] p-4 dark:border-[#1D3A29] dark:bg-[#12281D] md:border-b-0 md:border-r md:p-6 flex md:flex-col justify-between shrink-0">
          <div className="w-full flex md:flex-col items-center md:items-start justify-between md:justify-start gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#146B3E] shadow-md dark:bg-[#72C08A]">
                <Sparkles size={16} className="text-white dark:text-[#0B1B12] animate-pulse" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black tracking-wider text-[#146B3E] dark:text-[#72C08A] uppercase">Playground</p>
                <h2 className="text-sm font-black text-foreground -mt-0.5 leading-none">ทดลองใช้งาน</h2>
              </div>
            </div>

            {/* Tab Links - Horizontal on mobile, vertical on desktop */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-hide w-auto md:w-full py-1 md:py-0 md:mt-6">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                  activeTab === "tasks"
                    ? "bg-[#146B3E] text-white shadow-md shadow-[#146B3E]/20 dark:bg-[#72C08A] dark:text-[#0B1B12]"
                    : "text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50"
                }`}
              >
                <ClipboardCheck size={16} />
                <span className="hidden sm:inline md:inline">วางแผนงาน</span>
              </button>
              <button
                onClick={() => setActiveTab("plots")}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                  activeTab === "plots"
                    ? "bg-[#146B3E] text-white shadow-md shadow-[#146B3E]/20 dark:bg-[#72C08A] dark:text-[#0B1B12]"
                    : "text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50"
                }`}
              >
                <MapPinned size={16} />
                <span className="hidden sm:inline md:inline">จัดการแปลง</span>
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                  activeTab === "activities"
                    ? "bg-[#146B3E] text-white shadow-md shadow-[#146B3E]/20 dark:bg-[#72C08A] dark:text-[#0B1B12]"
                    : "text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50"
                }`}
              >
                <CalendarDays size={16} />
                <span className="hidden sm:inline md:inline">จดกิจกรรม</span>
              </button>
              <button
                onClick={() => setActiveTab("finance")}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                  activeTab === "finance"
                    ? "bg-[#146B3E] text-white shadow-md shadow-[#146B3E]/20 dark:bg-[#72C08A] dark:text-[#0B1B12]"
                    : "text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]/50"
                }`}
              >
                <Coins size={16} />
                <span className="hidden sm:inline md:inline">ภาพรวมการเงิน</span>
              </button>

            </nav>
          </div>

          {/* Close button on sidebar (only visible on large viewports) */}
          <div className="hidden md:block">
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
              *ข้อมูลจำลองในแซนด์บ็อกซ์จะไม่ถูกบันทึก
            </p>
          </div>
        </aside>

        {/* Sandbox Content Screen */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#FAFAF9] dark:bg-[#0B140F]">
          
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#E7F3EC] px-6 py-4 dark:border-[#1D3A29] shrink-0">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-[#146B3E] dark:bg-emerald-950/40 dark:text-[#72C08A]">
                Sandbox Active
              </span>
              <h1 className="text-lg font-black text-[#143422] dark:text-[#EAF6ED] -mt-0.5 leading-snug">
                {activeTab === "tasks" && "วางแผนงานสวน"}
                {activeTab === "plots" && "จัดการแปลงทุเรียนรายต้น"}
                {activeTab === "activities" && "บันทึกกิจกรรมประจำวัน"}
                {activeTab === "finance" && "จดบัญชีรายรับ-รายจ่าย"}
              </h1>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-muted p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-white/12"
            >
              <X size={16} />
            </button>
          </header>

          {/* Tab Pages Wrapper */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            
            {/* PAGE 1: TASK PLANNER */}
            {activeTab === "tasks" && (
              <div className="space-y-6 animate-slide-up">
                
                {/* Progress bar card */}
                <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-black text-foreground">ความคืบหน้าของงานวันนี้</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">เมื่อทำงานสำเร็จ แถบวัดผลจะอัปเดตแบบเรียลไทม์</p>
                    </div>
                    <span className="text-base font-black text-[#146B3E] dark:text-[#72C08A]">{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted dark:bg-[#12281D]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#146B3E] dark:from-emerald-400 dark:to-[#72C08A] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
                  
                  {/* Task list list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider mb-3">รายการงานที่ต้องปฏิบัติ</h4>
                    {tasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTask(t.id)}
                        className={`group/item flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                          t.done
                            ? "border-emerald-200 bg-emerald-50/20 text-[#54745f] dark:border-emerald-950/30 dark:bg-emerald-950/10"
                            : "border-border bg-white text-foreground hover:border-[#146B3E]/30 dark:bg-[#14291E] dark:hover:border-emerald-400/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            t.done
                              ? "bg-[#146B3E] border-[#146B3E] text-white dark:bg-[#72C08A] dark:border-[#72C08A] dark:text-[#0B1B12]"
                              : "border-gray-300 bg-white dark:border-white/12 dark:bg-[#0B140F] group-hover/item:scale-105"
                          }`}>
                            {t.done && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={`text-sm font-bold leading-tight ${t.done ? "line-through opacity-70" : ""}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          t.priority === "high"
                            ? "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400"
                            : t.priority === "medium"
                              ? "bg-amber-50 text-amber-500 dark:bg-amber-950/30 dark:text-amber-400"
                              : "bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {t.priority === "high" ? "ด่วนสุด" : t.priority === "medium" ? "ทั่วไป" : "รอง"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add form */}
                  <form onSubmit={handleAddTask} className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E] h-fit">
                    <h4 className="text-xs font-black text-foreground mb-3 flex items-center gap-1.5">
                      <Plus size={14} /> เพิ่มรายการจำลอง
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">ชื่องานที่ต้องการทำ</label>
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          placeholder="เช่น พ่นแคลเซียมโบรอน..."
                          className="w-full border border-gray-200 focus:border-[#146B3E] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:border-white/12 dark:bg-[#0B140F] dark:focus:border-emerald-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">ระดับความสำคัญ</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["low", "medium", "high"] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setNewTaskPriority(p)}
                              className={`rounded-lg py-1.5 text-[10px] font-black transition-all ${
                                newTaskPriority === p
                                  ? "bg-[#146B3E] text-white dark:bg-[#72C08A] dark:text-[#0B1B12]"
                                  : "bg-muted text-muted-foreground hover:bg-[#E7F3EC] dark:bg-white/8"
                              }`}
                            >
                              {p === "high" ? "ด่วน" : p === "medium" ? "ทั่วไป" : "เบา"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-all disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                      >
                        เพิ่มงาน
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* PAGE 2: TREE GROWTH */}
            {activeTab === "plots" && (
              <div className="space-y-6 animate-slide-up">
                <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E]">
                  <h3 className="text-sm font-black text-foreground">เลือกช่วงจำลองการเติบโต (ดอกและผลทุเรียน)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">กดสลับระยะดอก/ผลทุเรียนด้านล่าง เพื่อดูการจำลองภาพแบบสดๆ</p>
                  
                  {/* Selector list */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                    {[
                      { id: "nail", label: "ตาปู" },
                      { id: "eggplant", label: "มะเขือพวง" },
                      { id: "bloom", label: "ดอกบาน" },
                      { id: "rat_tail", label: "หางแย้" },
                      { id: "expanding", label: "ขยายผล" },
                      { id: "harvest", label: "เก็บเกี่ยว" }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setGrowthStage(st.id as any)}
                        className={`rounded-xl py-2 px-1 text-[11px] font-black transition-all text-center leading-tight shadow-sm border ${
                          growthStage === st.id
                            ? "bg-[#146B3E] border-[#146B3E] text-white dark:bg-[#72C08A] dark:border-[#72C08A] dark:text-[#0B1B12]"
                            : "bg-white text-muted-foreground border-border hover:bg-[#E7F3EC] dark:bg-[#0B140F] dark:border-white/10"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
                  
                  {/* Tree Visualization Card */}
                  <div className="relative rounded-[2rem] border border-white/60 bg-gradient-to-br from-emerald-50/40 via-white to-lime-50/20 p-6 shadow-sm dark:border-[#1D3A29] dark:from-[#14291E] dark:to-[#12281D] flex flex-col items-center justify-center min-h-[300px]">
                    
                    {/* SVG graphics representations */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl particle-glow" />
                      
                      {growthStage === "nail" && (
                        <div className="relative flex flex-col items-center animate-bounce">
                          {/* Sprout branches */}
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            {/* Sprout nodes */}
                            <div className="absolute left-[-6px] top-6 w-3 h-3 bg-lime-400 rounded-full border border-lime-600" />
                            <div className="absolute right-[-6px] top-12 w-3 h-3 bg-lime-400 rounded-full border border-lime-600" />
                            <div className="absolute left-[-6px] top-18 w-3 h-3 bg-lime-400 rounded-full border border-lime-600" />
                          </div>
                          <span className="text-[10px] font-black text-[#146B3E] bg-[#E7F3EC] px-2 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-[#72C08A]">ระยะตาปู</span>
                        </div>
                      )}

                      {growthStage === "eggplant" && (
                        <div className="relative flex flex-col items-center animate-pulse">
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            {/* Flower buds hangings */}
                            <div className="absolute left-[-24px] top-8 flex gap-1">
                              <div className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-700" />
                              <div className="w-3.5 h-3.5 rounded-full bg-green-400 border border-green-700" />
                            </div>
                            <div className="absolute right-[-24px] top-14 flex gap-1">
                              <div className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-700" />
                              <div className="w-3.5 h-3.5 rounded-full bg-green-400 border border-green-700" />
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-[#146B3E] bg-[#E7F3EC] px-2 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-[#72C08A]">มะเขือพวง</span>
                        </div>
                      )}

                      {growthStage === "bloom" && (
                        <div className="relative flex flex-col items-center">
                          <div className="absolute top-0 animate-pulse w-full text-center">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping absolute top-0" />
                            <span className="inline-block w-1 h-1 rounded-full bg-yellow-400 animate-ping absolute right-12" />
                          </div>
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            {/* Blossomed flowers */}
                            <div className="absolute left-[-20px] top-6 flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 border-2 border-yellow-400 animate-spin-slow">
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            </div>
                            <div className="absolute right-[-20px] top-12 flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 border-2 border-yellow-400 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-[#72C08A]">ดอกบานสะพรั่ง</span>
                        </div>
                      )}

                      {growthStage === "rat_tail" && (
                        <div className="relative flex flex-col items-center">
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            {/* Thin durians hanging */}
                            <div className="absolute left-[-16px] top-8 flex flex-col items-center">
                              <div className="w-1.5 h-6 bg-lime-600" />
                              <div className="w-3.5 h-5 rounded-b-full bg-lime-700" />
                            </div>
                            <div className="absolute right-[-16px] top-14 flex flex-col items-center">
                              <div className="w-1.5 h-6 bg-lime-600" />
                              <div className="w-3.5 h-5 rounded-b-full bg-lime-700" />
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-[#146B3E] bg-[#E7F3EC] px-2 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-[#72C08A]">ระยะหางแย้</span>
                        </div>
                      )}

                      {growthStage === "expanding" && (
                        <div className="relative flex flex-col items-center animate-pulse">
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            {/* Spiky durian shape */}
                            <div className="absolute left-[-26px] top-10 flex flex-col items-center">
                              <div className="w-2.5 h-6 bg-[#607D3B]" />
                              <div className="w-9 h-11 bg-[#50722D] rounded-full border-2 border-dashed border-[#84CC16]" />
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-[#50722D] bg-lime-50 px-2 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-[#72C08A]">ผลทุเรียนโต (1.8 กก.)</span>
                        </div>
                      )}

                      {growthStage === "harvest" && (
                        <div className="relative flex flex-col items-center">
                          {/* Sparkles particles */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent)] animate-ping" />
                          <div className="w-4 h-24 bg-amber-800 rounded-full relative">
                            <div className="absolute left-[-28px] top-8 flex flex-col items-center">
                              <div className="w-3 h-8 bg-amber-700" />
                              <div className="w-11 h-14 bg-gradient-to-b from-[#E7B822] to-[#B0860A] rounded-2xl flex items-center justify-center shadow-lg border border-yellow-300">
                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">Gold</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full mt-2 dark:bg-[#1D3A29] dark:text-yellow-400">ตัดเกี่ยวผลผลิตสำเร็จ!</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Dynamic Information Card */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E]">
                      <h4 className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider mb-2">ประมาณการวันตัดผลผลิต</h4>
                      <p className="text-2xl font-black text-foreground">
                        {growthStage === "nail" && "อีกประมาณ 110 - 120 วัน"}
                        {growthStage === "eggplant" && "อีกประมาณ 95 - 100 วัน"}
                        {growthStage === "bloom" && "อีกประมาณ 85 - 90 วัน"}
                        {growthStage === "rat_tail" && "อีกประมาณ 75 - 80 วัน"}
                        {growthStage === "expanding" && "อีกประมาณ 30 - 45 วัน"}
                        {growthStage === "harvest" && "พร้อมตัดขายแล้ววันนี้!"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E]">
                      <h4 className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider mb-2">คำแนะนำด้านชลประทานและการดูแล</h4>
                      <p className="text-xs font-semibold leading-6 text-foreground">
                        {growthStage === "nail" && "💧 การให้น้ำ: รดน้ำรอบโคนต้นในปริมาณสม่ำเสมอ แต่อย่าแฉะ เพื่อกระตุ้นตาดอกให้พัฒนาสมบูรณ์ และฉีดสารป้องกันโรคราและเพลี้ยไฟ"}
                        {growthStage === "eggplant" && "💧 การให้น้ำ: รดน้ำในปริมาณ 60% ของปกติ คุมความชื้นดินให้เหมาะสมเพื่อไม่ให้ดอกฝัดหรือร่วง และเริ่มพ่นปุ๋ยแคลเซียมโบรอน"}
                        {growthStage === "bloom" && "🚨 ข้อระวัง: ช่วงดอกบานสะพรั่งให้ 'ลดน้ำลง 70-80%' รดน้ำบางๆ แค่โคนต้นเพื่อป้องกันไม่ให้ดอกร่วงหล่นจากการช็อคน้ำ"}
                        {growthStage === "rat_tail" && "💧 การให้น้ำ: ค่อยๆ ทยอยเพิ่มน้ำขึ้นวันละ 10% จนเข้าสู่อัตราปกติหลังหางแย้แห้ง ป้องกันเพลี้ยหอยเพลี้ยแป้งระบาดรุนแรง"}
                        {growthStage === "expanding" && "💧 การให้น้ำ: ต้องให้น้ำเพียงพอและสม่ำเสมอ หากดินแห้งสลับแฉะจะส่งผลให้ผลทุเรียนแตกและรูปทรงบิดเบี้ยวได้"}
                        {growthStage === "harvest" && "✨ การเก็บเกี่ยว: ตรวจสอบระดับเปอร์เซ็นต์แป้งเคาะเช็คความแก่ (เช่น หมอนทอง 32% ขึ้นไป) งดให้น้ำและพ่นสารเคมี 15 วันก่อนตัด"}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* PAGE 3: ACTIVITY LOGGER */}
            {activeTab === "activities" && (
              <div className="space-y-6 animate-slide-up">
                <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                  
                  {/* Logger Form */}
                  <form onSubmit={handleAddActivity} className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E] h-fit">
                    <h4 className="text-xs font-black text-foreground mb-4 uppercase tracking-wider">จดบันทึกงานดูแลประจำวัน</h4>
                    <div className="space-y-4">
                      
                      {/* Activity icon selectors */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">ประเภทงาน</label>
                        <div className="grid grid-cols-5 gap-1">
                          {[
                            { type: "water", label: "💧" },
                            { type: "fertilize", label: "🧪" },
                            { type: "prune", label: "🍂" },
                            { type: "inspect", label: "🔍" },
                            { type: "harvest", label: "📦" }
                          ].map(opt => (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => setNewActType(opt.type as any)}
                              className={`rounded-xl py-2.5 text-center text-lg transition-all border ${
                                newActType === opt.type
                                  ? "bg-[#146B3E] border-[#146B3E] text-white dark:bg-[#72C08A] dark:border-[#72C08A]"
                                  : "bg-white border-border hover:bg-[#E7F3EC] dark:bg-[#0B140F] dark:border-white/10"
                              }`}
                              title={getActTypeLabel(opt.type)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <span className="block text-[10px] font-black text-[#146B3E] dark:text-[#72C08A] mt-1 text-center">
                          งานที่จะเลือก: {getActTypeLabel(newActType)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">คำอธิบายรายละเอียด</label>
                        <textarea
                          rows={2}
                          value={newActDesc}
                          onChange={e => setNewActDesc(e.target.value)}
                          placeholder="เช่น ใส่ปุ๋ยคอกรอบโคนต้นแปลง A..."
                          className="w-full border border-gray-200 focus:border-[#146B3E] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:border-white/12 dark:bg-[#0B140F] dark:focus:border-emerald-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">ค่าใช้จ่ายเพิ่มเติม (บาท)</label>
                        <input
                          type="number"
                          value={newActCost}
                          onChange={e => setNewActCost(e.target.value)}
                          placeholder="0"
                          className="w-full border border-gray-200 focus:border-[#146B3E] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:border-white/12 dark:bg-[#0B140F] dark:focus:border-emerald-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!newActDesc.trim()}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-all disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                      >
                        บันทึกลงสมุดบันทึก
                      </button>
                    </div>
                  </form>

                  {/* Activity Timeline Feed */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider mb-2">ไทม์ไลน์กิจกรรมสวนทุเรียน</h4>
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {activities.map(act => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-[#14291E] dark:border-white/5 transition-all hover:-translate-y-0.5 duration-300"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F3EC] text-base dark:bg-[#1D3A29]">
                            {act.type === "water" && "💧"}
                            {act.type === "fertilize" && "🧪"}
                            {act.type === "prune" && "🍂"}
                            {act.type === "inspect" && "🔍"}
                            {act.type === "harvest" && "📦"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-black text-[#146B3E] dark:text-[#72C08A]">{getActTypeLabel(act.type)}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{act.date}</span>
                            </div>
                            <p className="text-xs font-bold text-foreground leading-relaxed break-words">{act.desc}</p>
                            {act.cost > 0 && (
                              <p className="mt-1 text-[10px] font-black text-red-500">ค่าใช้จ่าย: {act.cost.toLocaleString()} บาท</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* PAGE 4: FINANCE TRACKER */}
            {activeTab === "finance" && (
              <div className="space-y-6 animate-slide-up">
                
                {/* Stats board overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-sm dark:border-emerald-950/20 dark:bg-emerald-950/10">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">รายรับสะสม</span>
                    <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">+{totalIncome.toLocaleString()} ฿</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50/20 p-4 shadow-sm dark:border-red-950/20 dark:bg-red-950/10">
                    <span className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase">รายจ่ายสะสม</span>
                    <p className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 mt-1">-{totalExpense.toLocaleString()} ฿</p>
                  </div>
                  <div className={`rounded-2xl border p-4 shadow-sm ${
                    netProfit >= 0
                      ? "border-lime-100 bg-lime-50/20 dark:border-lime-950/20 dark:bg-lime-950/10"
                      : "border-orange-100 bg-orange-50/20 dark:border-orange-950/20 dark:bg-orange-950/10"
                  }`}>
                    <span className="text-[10px] font-black text-foreground opacity-60 uppercase">กำไรสุทธิ</span>
                    <p className={`text-lg sm:text-xl font-black mt-1 ${netProfit >= 0 ? "text-[#146B3E] dark:text-[#72C08A]" : "text-orange-600"}`}>
                      {netProfit.toLocaleString()} ฿
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                  
                  {/* Ledger form */}
                  <form onSubmit={handleAddFinance} className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm dark:border-[#1D3A29] dark:bg-[#14291E] h-fit">
                    <h4 className="text-xs font-black text-foreground mb-4 uppercase tracking-wider">บันทึกธุรกรรมบัญชี</h4>
                    <div className="space-y-4">
                      
                      {/* Type switcher */}
                      <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl dark:bg-[#0B140F]">
                        <button
                          type="button"
                          onClick={() => setFinType("expense")}
                          className={`rounded-lg py-1.5 text-center text-xs font-black transition-all ${
                            finType === "expense"
                              ? "bg-[#146B3E] text-white dark:bg-[#72C08A] dark:text-[#0B1B12]"
                              : "text-muted-foreground hover:bg-[#E7F3EC]/50"
                          }`}
                        >
                          รายจ่าย
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinType("income")}
                          className={`rounded-lg py-1.5 text-center text-xs font-black transition-all ${
                            finType === "income"
                              ? "bg-[#146B3E] text-white dark:bg-[#72C08A] dark:text-[#0B1B12]"
                              : "text-muted-foreground hover:bg-[#E7F3EC]/50"
                          }`}
                        >
                          รายรับ
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">รายการบัญชี</label>
                        <input
                          type="text"
                          value={finDesc}
                          onChange={e => setFinDesc(e.target.value)}
                          placeholder={finType === "income" ? "เช่น ขายทุเรียนเกรด A แปลง 1..." : "เช่น ซื้อปุ๋ยชีวภาพ..."}
                          className="w-full border border-gray-200 focus:border-[#146B3E] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:border-white/12 dark:bg-[#0B140F] dark:focus:border-emerald-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground">จำนวนเงิน (บาท)</label>
                        <input
                          type="number"
                          value={finAmount}
                          onChange={e => setFinAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-200 focus:border-[#146B3E] rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30 dark:border-white/12 dark:bg-[#0B140F] dark:focus:border-emerald-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!finDesc.trim() || !finAmount.trim()}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-all disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                      >
                        บันทึกรายการ
                      </button>
                    </div>
                  </form>

                  {/* Transaction History Log list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#146B3E] dark:text-[#72C08A] uppercase tracking-wider mb-2">ประวัติการทำรายการล่าสุด</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {financeRecords.map(rec => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-[#14291E] dark:border-white/5 transition-all hover:-translate-y-0.5 duration-300"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">{rec.desc}</p>
                            <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">{rec.date}</span>
                          </div>
                          <span className={`text-sm font-black shrink-0 ml-3 ${rec.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {rec.type === "income" ? "+" : "-"}{rec.amount.toLocaleString()} ฿
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}


          </main>

          {/* persistent banner for guest */}
          <footer className="border-t border-[#E7F3EC] bg-[#F2F8F4] px-6 py-4 dark:border-[#1D3A29] dark:bg-[#12281D] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Sparkles size={16} className="text-[#F59E0B] shrink-0" />
              <p className="text-xs font-bold text-foreground">
                ชอบทดลองใช้งานหรือไม่? สมัครสมาชิกฟรีเพื่อเริ่มบันทึกข้อมูลสวนทุเรียนของคุณอย่างถาวร!
              </p>
            </div>
            <button
              onClick={() => {
                onClose()
                onLogin()
              }}
              className="inline-flex min-h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#146B3E] px-4 py-2 text-xs font-black text-white hover:bg-[#0F5A34] transition-all dark:bg-[#72C08A] dark:text-[#0B1B12] dark:hover:bg-[#8ae4a3]"
            >
              สมัครสมาชิกฟรี
              <ArrowRight size={14} />
            </button>
          </footer>

        </div>

      </div>
    </div>
  )
}
