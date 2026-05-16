"use client"
import { useState, useRef } from "react"
import { Settings as SettingsIcon, Download, Upload, Trash2, Moon, Sun, Info, ChevronRight, Smartphone, Bell, Shield, X, ImageIcon, MapPin, CheckCircle2 } from "lucide-react"

const STORAGE_KEY = "durian_orchard_data"
const APP_VERSION = "1.0.0"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function Settings({ isOpen, onClose }: Props) {
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [farmName, setFarmName] = useState(() => {
    if (typeof window === "undefined") return "สวนทุเรียน"
    return localStorage.getItem("farm_name") || "สวนทุเรียน"
  })
  const [isEditingName, setIsEditingName] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("farm_cover_image") || null
  })
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [location, setLocation] = useState<{ lat: number; lon: number; label: string } | null>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("farm_location")
    return saved ? JSON.parse(saved) : null
  })

  const [locationSaved, setLocationSaved] = useState(false)
  const [placeSearch, setPlaceSearch] = useState("")
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [searching, setSearching] = useState(false)

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

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่า 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setCoverImage(result)
      localStorage.setItem("farm_cover_image", result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCover = () => {
    setCoverImage(null)
    localStorage.removeItem("farm_cover_image")
    if (coverInputRef.current) coverInputRef.current.value = ""
  }



  const handlePlaceSearch = async () => {
    if (!placeSearch.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeSearch + " ประเทศไทย")}` +
        `&format=json&limit=5&addressdetails=1&accept-language=th`,
        { headers: { "User-Agent": "DurianOrchardApp/1.0" } }
      )
      const data = await res.json()
      setSearchResults(data)
    } catch {
      alert("ไม่สามารถค้นหาได้ กรุณาลองใหม่")
    } finally {
      setSearching(false)
    }
  }

  const handleSelectPlace = (result: { display_name: string; lat: string; lon: string }) => {
    const parts = result.display_name.split(",")
    const shortLabel = parts.slice(0, 2).join(",").trim()
    const loc = {
      lat: parseFloat(parseFloat(result.lat).toFixed(4)),
      lon: parseFloat(parseFloat(result.lon).toFixed(4)),
      label: shortLabel,
    }
    setLocation(loc)
    localStorage.setItem("farm_location", JSON.stringify(loc))
    window.dispatchEvent(new Event("farm_location_changed"))
    setSearchResults([])
    setPlaceSearch("")
    setLocationSaved(true)
    setTimeout(() => setLocationSaved(false), 2500)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-h-[92dvh] sm:max-h-none sm:h-full sm:w-full bg-background rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <SettingsIcon size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">ตั้งค่า</h2>
              <p className="text-xs text-muted-foreground">จัดการข้อมูลและการตั้งค่าแอป</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

      {/* Farm Info Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">ข้อมูลสวน</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">ชื่อสวน</p>
              {isEditingName ? (
                <input
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="mt-2 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">{farmName}</p>
              )}
            </div>
            {isEditingName ? (
              <div className="flex gap-2 ml-4">
                <button onClick={() => setIsEditingName(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
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

          {/* Cover Image Upload */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Preview */}
            {coverImage ? (
              <div className="relative h-36 w-full">
                <img src={coverImage} alt="ภาพปกสวน" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
                <span className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">ภาพปกสวน</span>
              </div>
            ) : null}
            <button
              onClick={() => coverInputRef.current?.click()}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon size={18} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {coverImage ? "เปลี่ยนภาพปก" : "เพิ่มภาพปกสวน"}
                  </p>
                  <p className="text-xs text-muted-foreground">รองรับ JPG, PNG ไม่เกิน 5MB</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverImage}
            />
          </div>
      </div>

      {/* Location Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">ตำแหน่งสวน</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {/* Current saved */}
          {location && (
            <div className="bg-primary/8 rounded-lg px-3 py-2.5 space-y-0.5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                <p className="text-sm text-primary font-semibold flex-1">{location.label}</p>
                {locationSaved && <CheckCircle2 size={16} className="text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground pl-5 font-mono">
                lat {location.lat} · lon {location.lon}
              </p>
            </div>
          )}


          {/* Place search */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">ค้นหาชื่อสถานที่</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={placeSearch}
                onChange={e => setPlaceSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePlaceSearch()}
                placeholder="เช่น ตำบลพลวง จันทบุรี"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handlePlaceSearch}
                disabled={searching || !placeSearch.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
              >
                {searching ? "⏳" : "ค้น"}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPlace(r)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    <p className="font-medium text-foreground line-clamp-1">{r.display_name.split(",").slice(0, 2).join(",")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">การแสดงผล</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <button onClick={toggleTheme} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                {theme === "light" ? <Sun size={18} className="text-amber-600" /> : <Moon size={18} className="text-indigo-500" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">ธีม</p>
                <p className="text-xs text-muted-foreground">{theme === "light" ? "โหมดสว่าง" : "โหมดมืด"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">เร็วๆ นี้</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </button>
          
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">การแจ้งเตือน</p>
                <p className="text-xs text-muted-foreground">แจ้งเตือนงานและกิจกรรม</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">เร็วๆ นี้</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-b-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone size={18} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">ติดตั้งแอป</p>
                <p className="text-xs text-muted-foreground">เพิ่มไปยังหน้าจอหลัก</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">จัดการข้อมูล</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <button onClick={handleExportData} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Download size={18} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">สำรองข้อมูล</p>
                <p className="text-xs text-muted-foreground">ดาวน์โหลดข้อมูลเป็นไฟล์ JSON</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          <button onClick={handleImportData} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">กู้คืนข้อมูล</p>
                <p className="text-xs text-muted-foreground">นำเข้าข้อมูลจากไฟล์สำรอง</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          <button onClick={() => setShowConfirmReset(true)} className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors rounded-b-xl group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                <Trash2 size={18} className="text-rose-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground group-hover:text-destructive transition-colors">ล้างข้อมูลทั้งหมด</p>
                <p className="text-xs text-muted-foreground">ลบข้อมูลและเริ่มต้นใหม่</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">เกี่ยวกับ</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info size={18} className="text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Durian Smart Orchard</p>
              <p className="text-xs text-muted-foreground">เวอร์ชัน {APP_VERSION}</p>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Shield size={18} className="text-muted-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">ความเป็นส่วนตัว</p>
              <p className="text-xs text-muted-foreground">ข้อมูลถูกเก็บไว้ในเครื่องของคุณเท่านั้น</p>
            </div>
          </div>
        </div>
      </div>

        </div>
      </div>

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center p-4 rounded-t-3xl sm:rounded-2xl">
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
  )
}
