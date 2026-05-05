"use client"
import { useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import Dashboard from "./Dashboard"
import PlotManagement from "./PlotManagement"
import Operations from "./Operations"
import Finance from "./Finance"
import Articles from "./Articles"
import { LayoutDashboard, TreePine, CalendarDays, Coins, BookOpen, Leaf } from "lucide-react"

type Tab = "dashboard" | "plots" | "operations" | "finance" | "articles"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { id: "plots", label: "แปลง", icon: TreePine },
  { id: "operations", label: "งาน", icon: CalendarDays },
  { id: "finance", label: "การเงิน", icon: Coins },
  { id: "articles", label: "บทความ", icon: BookOpen },
]

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isMounted, setIsMounted] = useState(false)
  const store = useAppData()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-background flex flex-col relative" />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={store.data} onNavigate={setActiveTab} updateTask={store.updateTask} deleteTask={store.deleteTask} />
      case "plots":
        return (
          <PlotManagement
            data={store.data}
            addPlot={store.addPlot}
            updatePlot={store.updatePlot}
            deletePlot={store.deletePlot}
            addTree={store.addTree}
            updateTree={store.updateTree}
            deleteTree={store.deleteTree}
            bulkUpdateTrees={store.bulkUpdateTrees}
            addActivity={store.addActivity}
            addBatch={store.addBatch}
            addBatchStage={store.addBatchStage}
            updateBatch={store.updateBatch}
            deleteBatch={store.deleteBatch}
          />
        )
      case "operations":
        return <Operations 
          data={store.data} 
          addTask={store.addTask} updateTask={store.updateTask} deleteTask={store.deleteTask} 
          addActivity={store.addActivity} deleteActivity={store.deleteActivity} updateActivity={store.updateActivity}
        />
      case "finance":
        return <Finance data={store.data} addFinance={store.addFinance} deleteFinance={store.deleteFinance} />
      case "articles":
        return <Articles />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar (compact) */}
      <header className="relative z-20 bg-accent px-4 md:px-8 pt-3 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
            <Leaf size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">สวนทุเรียน</h1>
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Smart Orchard Management</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-lg">{store.data.plots.reduce((s, p) => s + p.trees.length, 0)} <span className="text-white/70 text-xs font-normal">ต้น</span></p>
          <p className="text-white/60 text-[10px] uppercase tracking-widest">{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</p>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border py-4 px-3 gap-1 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Main Content — full width, no extra card */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-6 bg-background">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Floating Pill style like the design) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl px-4 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-white/10 w-[90%] max-w-md">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive ? "text-accent scale-110" : "text-white/40 hover:text-white/70"
              }`}
            >
              <div className={`p-2 rounded-full transition-colors ${isActive ? "bg-accent/20" : ""}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
