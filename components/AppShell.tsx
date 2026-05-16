"use client"
import { useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import Dashboard from "./Dashboard"
import PlotManagement from "./PlotManagement"
import Operations from "./Operations"
import Finance from "./Finance"
import Articles from "./Articles"
import { LayoutDashboard, TreePine, CalendarDays, Coins, BookOpen, Leaf, Settings as SettingsIcon, User, Sparkles } from "lucide-react"
import Settings from "./Settings"
import AuthModal from "./AuthModal"
import ProfileModal from "./ProfileModal"

type Tab = "dashboard" | "plots" | "operations" | "finance" | "articles" | "settings"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { id: "plots", label: "แปลง", icon: TreePine },
  { id: "operations", label: "งาน", icon: CalendarDays },
  { id: "finance", label: "การเงิน", icon: Coins },
  { id: "articles", label: "บทความ", icon: BookOpen },
]

const MOBILE_TABS = TABS.slice(0, 4) // Show only 4 tabs on mobile

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isMounted, setIsMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; provider: string } | null>(null)
  const [farmLocation, setFarmLocation] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const store = useAppData()

  const readFarmLocation = () => {
    const saved = localStorage.getItem("farm_location")
    if (saved) {
      setFarmLocation(JSON.parse(saved))
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      // No saved location → silently try browser geolocation as fallback
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFarmLocation({
            lat: parseFloat(pos.coords.latitude.toFixed(4)),
            lon: parseFloat(pos.coords.longitude.toFixed(4)),
            label: "ตำแหน่งปัจจุบัน",
          })
        },
        () => {
          // Permission denied or unavailable — use null, Dashboard will use default
          setFarmLocation(null)
        },
        { enableHighAccuracy: false, timeout: 8000 }
      )
    }
  }

  const handleCloseSettings = () => {
    readFarmLocation() // re-read location when settings closes
    setShowSettings(false)
  }

  useEffect(() => {
    setIsMounted(true)
    readFarmLocation()

    const onLocationChange = () => readFarmLocation()
    window.addEventListener("farm_location_changed", onLocationChange)
    return () => window.removeEventListener("farm_location_changed", onLocationChange)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-background flex flex-col relative" />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenSettings={() => setShowSettings(true)} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} />
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
      {/* Top Header Bar */}
      <header className="relative z-20 bg-[#1f5a35] px-4 md:px-8 pt-4 pb-4 flex items-center justify-between shrink-0 shadow-[0_12px_36px_rgba(15,59,37,0.22)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(223,240,228,0.28),transparent_20rem)]" />
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-95"
        >
          <div className="p-2.5 bg-white/18 backdrop-blur-md rounded-xl shadow-inner ring-1 ring-white/20">
            <Leaf size={24} className="text-white drop-shadow" />
          </div>
          <div className="text-left">
            <h1 className="font-black text-white text-xl tracking-tight leading-none drop-shadow">สวนทุเรียน</h1>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mt-0.5">Smart Orchard</p>
          </div>
        </button>
        <div className="relative flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-white/12 backdrop-blur-md rounded-xl px-3 py-2 ring-1 ring-white/15">
            <Sparkles size={14} className="text-[#dff0e4]" />
            <span className="text-white/75 text-xs font-medium">พร้อมดูแลสวน</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/12 backdrop-blur-md rounded-xl px-3 py-2 ring-1 ring-white/15">
            <TreePine size={14} className="text-[#dff0e4]" />
            <span className="text-white font-bold text-sm leading-none">{store.data.plots.reduce((s, p) => s + p.trees.length, 0)}</span>
            <span className="text-white/60 text-xs font-medium">ต้น</span>
          </div>
          {/* Profile / Login button */}
          <button
            onClick={() => user ? setShowProfile(true) : setShowAuth(true)}
            className="p-2 bg-white/12 hover:bg-white/22 backdrop-blur-md rounded-xl transition-colors ring-1 ring-white/15"
          >
            {user ? (
              user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                : <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{user.name[0]}</span>
                  </div>
            ) : (
              <User size={20} className="text-white" />
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white/12 hover:bg-white/22 backdrop-blur-md rounded-xl transition-colors ring-1 ring-white/15"
          >
            <SettingsIcon size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border py-6 px-3 gap-1.5 shrink-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <div className="mx-2 mb-5 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
            <p className="text-xs font-bold text-[#dff0e4] uppercase tracking-wider">Orchard Control</p>
            <p className="mt-1 text-sm text-white/62 leading-snug">จัดการสวน งาน และการเงินในที่เดียว</p>
          </div>
          <p className="px-4 text-xs font-bold text-white/45 uppercase tracking-wider mb-2">เมนูหลัก</p>
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-[#dff0e4] text-[#0f3b25] shadow-md"
                    : "text-white/78 hover:bg-[#174629] hover:text-white"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeTab === tab.id ? "bg-white/70" : "bg-white/8 group-hover:bg-white/12"}`}>
                  <Icon size={18} />
                </span>
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Main Content — full width, no extra card */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-6 bg-transparent">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Clean pill style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f3b25]/96 backdrop-blur-xl px-2 py-2 flex items-center gap-1 w-full border-t border-white/10 safe-area-bottom">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                isActive ? "bg-[#dff0e4] text-[#0f3b25] shadow-sm" : "text-white/58 hover:bg-[#174629] hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={handleCloseSettings} />

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={(u) => { setUser(u); setShowAuth(false) }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onLogout={() => setUser(null)}
        onLogin={() => { setShowProfile(false); setShowAuth(true) }}
      />
    </div>
  )
}
