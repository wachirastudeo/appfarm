"use client"
import { useState, useEffect } from "react"
import { useAppData } from "@/lib/store"
import Dashboard from "./Dashboard"
import PlotManagement from "./PlotManagement"
import Operations from "./Operations"
import Finance from "./Finance"
import Articles from "./Articles"
import AdminPanel from "./AdminPanel"
import type { AppUser } from "@/lib/store"
import { TreePine, CalendarDays, Coins, BookOpen, Leaf, Settings as SettingsIcon, User, AlertTriangle, ShieldCheck } from "lucide-react"
import Settings from "./Settings"
import AuthModal from "./AuthModal"
import ProfileModal from "./ProfileModal"
import DurianIcon from "./DurianIcon"

type Tab = "dashboard" | "plots" | "operations" | "finance" | "articles" | "admin"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "หน้าหลัก", icon: DurianIcon },
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
  const [user, setUser] = useState<AppUser | null>(null)
  const [farmLocation, setFarmLocation] = useState<{ lat: number; lon: number; label: string } | null>(null)
  const store = useAppData()
  const todayTaskCount = store.data.tasks.filter(task => {
    if (task.status !== "pending") return false
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.getFullYear() === today.getFullYear()
      && taskDate.getMonth() === today.getMonth()
      && taskDate.getDate() === today.getDate()
  }).length

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
    const savedUserId = localStorage.getItem("durian_current_user")
    if (savedUserId) {
      const savedUser = store.data.users.find(u => u.id === savedUserId && u.status === "active")
      if (savedUser) setUser(savedUser)
    }

    const onLocationChange = () => readFarmLocation()
    window.addEventListener("farm_location_changed", onLocationChange)
    return () => window.removeEventListener("farm_location_changed", onLocationChange)
  }, [store.data.users])

  const handleLoginSuccess = (nextUser: AppUser) => {
    setUser(nextUser)
    localStorage.setItem("durian_current_user", nextUser.id)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("durian_current_user")
    setUser(null)
    if (activeTab === "admin") setActiveTab("dashboard")
  }

  const visibleTabs = user?.role === "admin"
    ? [...TABS, { id: "admin" as const, label: "Admin", icon: ShieldCheck }]
    : TABS

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
        return <Articles articles={store.data.articles} />
      case "admin":
        if (user?.role !== "admin") return <Dashboard data={store.data} onNavigate={setActiveTab} onOpenSettings={() => setShowSettings(true)} updateTask={store.updateTask} deleteTask={store.deleteTask} addTask={store.addTask} farmLocation={farmLocation} />
        return (
          <AdminPanel
            users={store.data.users}
            articles={store.data.articles}
            siteSettings={store.data.siteSettings}
            currentUser={user}
            addUser={store.addUser}
            updateUser={store.updateUser}
            deleteUser={store.deleteUser}
            addArticle={store.addArticle}
            updateArticle={store.updateArticle}
            deleteArticle={store.deleteArticle}
            updateSiteSettings={store.updateSiteSettings}
          />
        )
    }
  }

  const siteName = store.data.siteSettings.siteName || "สวนทุเรียน"
  const tagline = store.data.siteSettings.tagline || "Smart Orchard"
  const logoUrl = store.data.siteSettings.logoUrl

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <header className="relative z-20 bg-[#146B3E] px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex items-center justify-between gap-2 shrink-0 shadow-[0_12px_36px_rgba(15,59,37,0.22)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(223,240,228,0.28),transparent_20rem)]" />
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative flex min-w-0 items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity active:scale-95"
        >
          <div className="shrink-0 p-2 sm:p-2.5 bg-white/18 backdrop-blur-md rounded-xl shadow-inner ring-1 ring-white/20">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg object-cover" />
            ) : (
              <Leaf size={22} className="text-white drop-shadow" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <h1 className="truncate font-black text-white text-base sm:text-xl tracking-tight leading-none drop-shadow">{siteName}</h1>
            <p className="truncate text-white/70 text-[10px] sm:text-sm font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5">{tagline}</p>
          </div>
        </button>
        <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("operations")}
            className="relative flex items-center gap-1.5 rounded-xl bg-white/12 px-2 sm:px-3 py-2 text-white/78 ring-1 ring-white/15 transition-colors hover:bg-white/22"
            title={todayTaskCount > 0 ? `วันนี้มีงาน ${todayTaskCount} งาน` : "วันนี้ไม่มีงาน"}
          >
            <AlertTriangle size={14} />
            <span className="font-bold text-sm leading-none">{todayTaskCount}</span>
            <span className="hidden sm:inline text-xs font-medium opacity-80">งานวันนี้</span>
            {todayTaskCount > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />}
          </button>
          <div className="hidden min-[390px]:flex items-center gap-1.5 bg-white/12 backdrop-blur-md rounded-xl px-3 py-2 ring-1 ring-white/15">
            <DurianIcon className="h-4 w-4 text-[#E7F3EC]" />
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
        <nav className="hidden lg:flex flex-col w-72 bg-[#146B3E] border-r border-white/20 py-5 px-4 gap-2 shrink-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.16),14px_0_36px_rgba(47,170,98,0.18)] relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.28),transparent_14rem),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(22,138,75,0.16)_48%,rgba(22,138,75,0.24))]" />
          <p className="relative px-3 pt-2 text-xs font-black text-white/72 uppercase tracking-wider mb-1">เมนูหลัก</p>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-black transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-white text-[#146B3E] shadow-[0_16px_30px_rgba(20,52,34,0.18)]"
                    : "text-white/92 hover:bg-white/18 hover:text-white"
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${activeTab === tab.id ? "bg-[#E7F3EC] text-[#146B3E]" : "bg-white/18 text-white group-hover:bg-white/26"}`}>
                  <Icon size={20} strokeWidth={2.4} />
                </span>
                <span className="flex-1">{tab.label}</span>
                {activeTab === tab.id && <span className="h-2 w-2 rounded-full bg-[#146B3E]" />}
              </button>
            )
          })}
        </nav>

        {/* Main Content — full width, no extra card */}
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-6 bg-transparent">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Clean pill style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#146B3E]/96 backdrop-blur-xl px-2 py-2 flex items-center gap-1 w-full overflow-x-auto border-t border-white/10 safe-area-bottom scrollbar-hide">
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[4.25rem] flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                isActive ? "bg-white text-[#146B3E] shadow-sm" : "text-white/72 hover:bg-white/16 hover:text-white"
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
        onLoginSuccess={handleLoginSuccess}
        authenticateUser={store.authenticateUser}
        addUser={store.addUser}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onLogout={handleLogout}
        onLogin={() => { setShowProfile(false); setShowAuth(true) }}
      />
    </div>
  )
}
