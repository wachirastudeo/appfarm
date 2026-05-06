"use client"
import { useState } from "react"
import { Settings as SettingsIcon, X, Download, Upload, Trash2, Moon, Sun, Info, ChevronRight } from "lucide-react"

const STORAGE_KEY = "durian_orchard_data"
const APP_VERSION = "1.0.0"

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [farmName, setFarmName] = useState(() => {
    if (typeof window === "undefined") return "สวนทุเรียน"
    return localStorage.getItem("farm_name") || "สวนทุเรียน"
  })
  const [isEditingName, setIsEditingName] = useState(false)

  if (!isOpen) return null

  const handleExportData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        alert("ไม่พบข้อมูลที่จะสำรอง")
        return
      }
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `durian-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("เกิดข้อผิดพลาดในการสำรองข้อมูล")
    }
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result as string
          const parsed = JSON.parse(content)
          // Basic validation
          if (!parsed.plots || !parsed.activities || !parsed.tasks || !parsed.finance) {
            alert("ไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์สำรองที่ถูกต้อง")
            return
          }
          localStorage.setItem(STORAGE_KEY, content)
          alert("กู้คืนข้อมูลสำเร็จ! กรุณารีเฟรชหน้าเว็บ")
          window.location.reload()
        } catch {
          alert("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบไฟล์อีกครั้ง")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY)
    alert("ล้างข้อมูลสำเร็จ! กรุณารีเฟรชหน้าเว็บ")
    window.location.reload()
  }

  const handleSaveFarmName = () => {
    localStorage.setItem("farm_name", farmName)
    setIsEditingName(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    // Future: implement actual theme switching
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <SettingsIcon size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">ตั้งค่า</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-4 space-y-4">
          {/* Farm Name */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">ชื่อสวน</p>
                {isEditingName ? (
                  <input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">{farmName}</p>
                )}
              </div>
              {isEditingName ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingName(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                    ยกเลิก
                  </button>
                  <button onClick={handleSaveFarmName} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    บันทึก
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingName(true)} className="text-sm text-primary font-medium hover:underline">
                  แก้ไข
                </button>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="w-full bg-muted/50 rounded-xl p-4 flex items-center justify-between hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              {theme === "light" ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-400" />}
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">ธีม</p>
                <p className="text-sm text-muted-foreground">{theme === "light" ? "สว่าง" : "มืด"}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          {/* Data Management */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">จัดการข้อมูล</p>
            
            <button onClick={handleExportData} className="w-full bg-muted/50 rounded-xl p-4 flex items-center gap-3 hover:bg-muted transition-colors">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Download size={18} className="text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">สำรองข้อมูล</p>
                <p className="text-xs text-muted-foreground">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={handleImportData} className="w-full bg-muted/50 rounded-xl p-4 flex items-center gap-3 hover:bg-muted transition-colors">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload size={18} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">กู้คืนข้อมูล</p>
                <p className="text-xs text-muted-foreground">นำเข้าข้อมูลจากไฟล์สำรอง</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={() => setShowConfirmReset(true)} className="w-full bg-muted/50 rounded-xl p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors group">
              <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200">
                <Trash2 size={18} className="text-rose-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-destructive">ล้างข้อมูลทั้งหมด</p>
                <p className="text-xs text-muted-foreground">ลบข้อมูลทั้งหมดและเริ่มต้นใหม่</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* App Info */}
          <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Info size={18} className="text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">เกี่ยวกับแอป</p>
              <p className="text-xs text-muted-foreground">เวอร์ชัน {APP_VERSION} - Durian Smart Orchard</p>
            </div>
          </div>
        </div>

        {/* Confirm Reset Modal */}
        {showConfirmReset && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                  <Trash2 size={24} className="text-destructive" />
                </div>
                <h3 className="font-bold text-foreground">ยืนยันการล้างข้อมูล?</h3>
                <p className="text-sm text-muted-foreground mt-1">ข้อมูลทั้งหมดจะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleResetData} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:opacity-90">
                  ล้างข้อมูล
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
