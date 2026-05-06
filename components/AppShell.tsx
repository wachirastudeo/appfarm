"use client"
import { useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import Dashboard from "./Dashboard"
import PlotManagement from "./PlotManagement"
import Operations from "./Operations"
import Finance from "./Finance"
import Articles from "./Articles"
import { LayoutDashboard, TreePine, CalendarDays, Coins, BookOpen, Leaf, Settings as SettingsIcon } from "lucide-react"
import Settings from "./Settings"

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
  const [showSettings, setShowSettings] = useState(false)
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
      {/* Top Header Bar (Premium Gradient) */}
      <header className="relative z-20 bg-gradient-to-r from-primary via-primary to-emerald-700 px-4 md:px-8 pt-4 pb-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
            <Leaf size={24} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="font-black text-white text-xl tracking-tight leading-none drop-shadow">สวนทุเรียน</h1>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mt-0.5">Smart Orchard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right bg-white/10 backdrop-blur-md rounded-xl px-4 py-2">
            <p className="text-white font-black text-lg leading-none">{store.data.plots.reduce((s, p) => s + p.trees.length, 0)} <span className="text-white/80 text-sm font-bold">ต้น</span></p>
            <p className="text-white/60 text-sm font-semibold mt-0.5">{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors"
          >
            <SettingsIcon size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border py-6 px-3 gap-1.5 shrink-0">
          <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">เมนูหลัก</p>
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                <Icon size={20} />
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

      {/* Mobile Bottom Navigation (Clean pill style) */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-xl px-2 py-2 rounded-2xl flex items-center gap-1 shadow-xl border border-border w-[92%] max-w-md">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
