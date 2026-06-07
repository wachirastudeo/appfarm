"use client"
import { useEffect, useMemo, useState } from "react"
import { Activity, ActivityType, ACTIVITY_LABELS, Plot, useAppData } from "@/lib/store"
import { validateText } from "@/lib/form-validation"
import { Plus, Trash2, Sprout, Droplets, Scissors, PackageSearch, Zap, ClipboardList, MoreHorizontal, Clock, ListFilter, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
  updateActivity: AppDataReturn["updateActivity"]
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  fertilize: Sprout, spray: Zap, water: Droplets, prune: Scissors,
  harvest: PackageSearch, inspect: ClipboardList, other: MoreHorizontal,
}
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  fertilize: "text-green-400", spray: "text-yellow-400", water: "text-blue-400",
  prune: "text-orange-400", harvest: "text-primary", inspect: "text-purple-400", other: "text-[#527060]",
}
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
}

function toInputDate(date: Date) {
  return date.toISOString().split("T")[0]
}

function toSafeActivityDate(value: string) {
  if (!value) return new Date().toISOString()
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function ActivityLog({ data, addActivity, deleteActivity, updateActivity }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ActivityType | "all">("all")
  const today = new Date()
  const [timeFilter, setTimeFilter] = useState<"month" | "year" | "all">("month")
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plotId: data.plots[0]?.id ?? "",
    activityType: "fertilize" as ActivityType,
    description: "",
    cost: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(20)

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, timeFilter, selectedMonth, selectedYear, selectedDay])

  useEffect(() => {
    if (localStorage.getItem("open_activity_form") === "1") {
      setShowForm(true)
      localStorage.removeItem("open_activity_form")
    }
  }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    const description = validateText("รายละเอียด", form.description, { maxLength: 500, allowMultiline: true })
    const invalid = [description].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      alert(invalid.message)
      return
    }
    const activityData = {
      ...form,
      plotId: form.plotId || "",
      description: description.value,
      cost: 0,
      date: toSafeActivityDate(form.date),
    }
    
    if (editingId) {
      updateActivity(editingId, activityData)
      setEditingId(null)
    } else {
      addActivity(activityData)
    }
    
    setForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "", cost: 0 })
    setShowForm(false)
  }

  const handleEdit = (act: Activity) => {
    setForm({
      date: act.date.split("T")[0],
      plotId: act.plotId,
      activityType: act.activityType,
      description: act.description,
      cost: 0,
    })
    setEditingId(act.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ date: new Date().toISOString().split("T")[0], plotId: data.plots[0]?.id ?? "", activityType: "fertilize", description: "", cost: 0 })
  }

  const plotName = (id: string) => id ? data.plots.find(p => p.id === id)?.name ?? id : "ไม่ระบุแปลง"

  const filtered = useMemo(() => {
    return data.activities
      .filter(a => filter === "all" || a.activityType === filter)
      .filter(a => {
        if (timeFilter === "all") return true
        const d = new Date(a.date)
        if (timeFilter === "month") {
          const inMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
          return inMonth && (!selectedDay || a.date.split("T")[0] === selectedDay)
        }
        return d.getFullYear() === selectedYear
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.activities, filter, timeFilter, selectedDay, selectedMonth, selectedYear])

  const totalItems = filtered.length
  const effectiveItemsPerPage = itemsPerPage === "all" ? totalItems : itemsPerPage
  const totalPages = effectiveItemsPerPage > 0 ? Math.ceil(totalItems / effectiveItemsPerPage) : 1
  const safeCurrentPage = Math.min(currentPage, totalPages || 1)
  const paginatedActivities = filtered.slice(
    (safeCurrentPage - 1) * effectiveItemsPerPage,
    safeCurrentPage * effectiveItemsPerPage
  )

  const activityCountByDate = useMemo(() => {
    const map: Record<string, number> = {}
    data.activities
      .filter(a => filter === "all" || a.activityType === filter)
      .forEach(a => {
        const d = new Date(a.date)
        if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return
        const date = a.date.split("T")[0]
        map[date] = (map[date] ?? 0) + 1
      })
    return map
  }, [data.activities, filter, selectedMonth, selectedYear])

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)
  const todayDate = toInputDate(today)

  const timeLabel = timeFilter === "month"
    ? `${MONTHS_TH[selectedMonth]} ${selectedYear + 543}`
    : timeFilter === "year"
      ? `${selectedYear + 543}`
      : "ทั้งหมด"

  const moveMonth = (delta: number) => {
    setSelectedDay(null)
    setSelectedMonth(m => {
      const next = m + delta
      if (next < 0) {
        setSelectedYear(y => y - 1)
        return 11
      }
      if (next > 11) {
        setSelectedYear(y => y + 1)
        return 0
      }
      return next
    })
  }

  const moveYear = (delta: number) => setSelectedYear(y => y + delta)
  const setTimeMode = (mode: typeof timeFilter) => {
    setTimeFilter(mode)
    if (mode !== "month") {
      setSelectedDay(null)
      setIsCalendarExpanded(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 lg:flex lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">บันทึกสวน</h2>
          <button onClick={() => { if(showForm) handleCancel(); else setShowForm(true); }} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(20,107,62,0.16)] transition-colors hover:bg-[#0F5A34] sm:hidden">
            <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#B9DCC8] bg-white p-1.5 shadow-[0_10px_24px_rgba(20,107,62,0.08)] scrollbar-hide sm:gap-2 sm:p-2">
            <select
              aria-label="ช่วงเวลาบันทึกสวน"
              value={timeFilter}
              onChange={e => setTimeMode(e.target.value as typeof timeFilter)}
              className="h-10 shrink-0 rounded-xl border border-[#B9DCC8] bg-[#F7FAF8] px-3 text-sm font-black text-[#146B3E] outline-none sm:hidden"
            >
              <option value="month">เดือน</option>
              <option value="year">ปี</option>
              <option value="all">ทั้งหมด</option>
            </select>
            <div className="hidden shrink-0 rounded-xl border border-[#B9DCC8] bg-[#F7FAF8] p-1 sm:flex">
              <button onClick={() => setTimeMode("month")} className={`rounded-lg px-2.5 py-1.5 text-sm font-black transition-all sm:px-3 ${timeFilter === "month" ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "text-[#146B3E] hover:bg-white"}`}>
                เดือน
              </button>
              <button onClick={() => setTimeMode("year")} className={`rounded-lg px-2.5 py-1.5 text-sm font-black transition-all sm:px-3 ${timeFilter === "year" ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "text-[#146B3E] hover:bg-white"}`}>
                ปี
              </button>
              <button onClick={() => setTimeMode("all")} className={`rounded-lg px-2.5 py-1.5 text-sm font-black transition-all sm:px-3 ${timeFilter === "all" ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "text-[#146B3E] hover:bg-white"}`}>
                ทั้งหมด
              </button>
            </div>

            <div className="flex min-h-10 shrink-0 items-center justify-between gap-0.5 rounded-xl bg-[#E7F3EC] px-0.5 text-[#146B3E] sm:min-w-44 sm:gap-1 sm:px-1">
              {timeFilter === "all" ? (
                <div className="flex w-full min-w-40 items-center justify-center gap-1.5 px-3 py-2 text-sm font-extrabold text-foreground sm:min-w-44">
                  <ListFilter size={15} className="text-[#146B3E]" />
                  ทั้งหมด
                </div>
              ) : (
                <>
                <button
                  aria-label={timeFilter === "month" ? "เดือนก่อน" : "ปีก่อน"}
                  onClick={() => timeFilter === "month" ? moveMonth(-1) : moveYear(-1)}
                  className="rounded-xl p-2 transition-all hover:bg-white hover:text-primary"
                >
                  <ChevronLeft size={18} />
                </button>
                {timeFilter === "month" ? (
                  <button
                    aria-expanded={isCalendarExpanded}
                    onClick={() => setIsCalendarExpanded(v => !v)}
                    className="flex min-w-20 items-center justify-center gap-1 rounded-xl px-1 py-2 text-sm font-extrabold text-foreground transition-all hover:bg-white sm:min-w-24 sm:px-2"
                  >
                    {timeLabel}
                    {isCalendarExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                ) : (
                  <span className="min-w-16 text-center text-sm font-extrabold text-foreground sm:min-w-20">{timeLabel}</span>
                )}
                <button
                  aria-label={timeFilter === "month" ? "เดือนถัดไป" : "ปีถัดไป"}
                  onClick={() => timeFilter === "month" ? moveMonth(1) : moveYear(1)}
                  className="rounded-xl p-2 transition-all hover:bg-white hover:text-primary"
                >
                  <ChevronRight size={18} />
                </button>
                </>
              )}
            </div>

            <span className="shrink-0 rounded-xl bg-[#E7F3EC] px-2 py-2 text-center text-xs font-bold text-[#527060]">{filtered.length} รายการ</span>
          </div>
          <button onClick={() => { if(showForm) handleCancel(); else setShowForm(true); }} className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-base font-black text-primary-foreground shadow-[0_10px_24px_rgba(20,107,62,0.16)] transition-colors hover:bg-[#0F5A34] sm:flex">
            <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
          </button>
        </div>
      </div>

      {timeFilter === "month" && isCalendarExpanded && (
        <div className="rounded-2xl border border-[#B9DCC8] bg-white p-4 shadow-[0_10px_24px_rgba(20,107,62,0.08)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-extrabold text-foreground">{MONTHS_TH[selectedMonth]} {selectedYear + 543}</span>
            <button
              onClick={() => setSelectedDay(null)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-all ${selectedDay ? "border-[#B9DCC8] bg-[#F7FAF8] text-[#146B3E] hover:bg-[#E7F3EC]" : "border-primary bg-primary text-primary-foreground"}`}
            >
              ทั้งเดือน
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAYS_TH.map(d => <div key={d} className="py-1 text-center text-xs font-black text-[#527060]">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const activityCount = activityCountByDate[date] ?? 0
              const isSelected = selectedDay === date
              const isToday = todayDate === date
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-md" : isToday ? "bg-primary/10 font-bold text-primary ring-1 ring-primary" : activityCount ? "bg-[#E7F3EC] text-foreground hover:bg-[#D8EEE2]" : "text-[#527060] hover:bg-[#E7F3EC] hover:text-foreground"}`}
                >
                  {day}
                  {activityCount > 0 && (
                    <span className={`absolute bottom-1 min-w-3 rounded-full px-1 text-[9px] font-black leading-3 ${isSelected ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                      {activityCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-[#E7F3EC] rounded-xl p-4 space-y-3 border border-[#B9DCC8]">
          <h3 className="font-bold text-foreground text-base">{editingId ? "แก้ไขบันทึกสวน" : "บันทึกสวนใหม่"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">วันที่</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">แปลง</label>
              <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="">ไม่ระบุแปลง</option>
                {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">ประเภทกิจกรรม</label>
            <select 
              value={form.activityType} 
              onChange={e => set("activityType", e.target.value)} 
              className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => (
                <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-base font-bold text-[#527060] mb-1.5 block uppercase tracking-wider">รายละเอียด</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl px-4 py-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="บันทึกรายละเอียดกิจกรรม..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCancel} className="flex-1 bg-[#F7FBF8] border border-[#B9DCC8] rounded-xl py-3 text-[#527060] font-bold hover:bg-[#E7F3EC] transition-colors">ยกเลิก</button>
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-bold hover:bg-[#0F5A34] shadow-lg shadow-primary/20 transition-all active:scale-95">{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:scrollbar-hide">
        <button onClick={() => setFilter("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${filter === "all" ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "border-[#B9DCC8] bg-white text-[#146B3E] hover:border-primary/50"}`}>
          <ListFilter size={14} /> ทั้งหมด
        </button>
        {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(t => {
          const Icon = ACTIVITY_ICONS[t]
          return (
            <button key={t} onClick={() => setFilter(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border transition-all ${filter === t ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(20,107,62,0.18)]" : "border-[#B9DCC8] bg-white text-[#146B3E] hover:border-primary/50"}`}>
              <Icon size={14} /> {ACTIVITY_LABELS[t]}
            </button>
          )
        })}
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-dashed border-[#B9DCC8]">
            <ClipboardList size={48} className="text-[#527060] mx-auto mb-3" />
            <p className="text-[#527060] font-medium">ยังไม่มีบันทึกสวนในรายการนี้</p>
          </div>
        ) : paginatedActivities.map(a => {
          const Icon = ACTIVITY_ICONS[a.activityType]
          return (
            <div key={a.id} className="flex items-start gap-4 rounded-2xl border border-[#B9DCC8] bg-white p-4 shadow-[0_10px_24px_rgba(20,107,62,0.08)] transition-all group hover:border-primary/50">
              <div className={`p-3 bg-[#F7FBF8] rounded-xl shrink-0 shadow-[0_10px_24px_rgba(20,107,62,0.10)] border border-[#B9DCC8] ${ACTIVITY_COLORS[a.activityType]}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-foreground">{ACTIVITY_LABELS[a.activityType]}</span>
                  <span className="text-base text-[#527060]">•</span>
                  <span className="text-base font-medium text-primary">{plotName(a.plotId)}</span>
                </div>
                <p className="text-base text-[#527060] leading-relaxed mb-2">{a.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-base font-medium text-[#527060] flex items-center gap-1">
                    <Clock size={12} /> {formatDate(a.date)}
                  </span>
                  {a.cost > 0 && (
                    <span className="text-base font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      ฿{a.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleEdit(a)} className="p-2 text-[#527060] hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <ClipboardList size={18} />
                </button>
                <button onClick={() => deleteActivity(a.id)} className="p-2 text-[#527060] hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pagination Controls ── */}
      {totalItems > 20 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#E7F3EC]/20 dark:bg-[#1D3A29]/10 rounded-2xl p-4 border border-[#B9DCC8]/30 dark:border-[#31533D]/25">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>แสดง</span>
            <span className="text-foreground font-black">
              {Math.min(totalItems, (safeCurrentPage - 1) * effectiveItemsPerPage + 1)}-{Math.min(totalItems, safeCurrentPage * effectiveItemsPerPage)}
            </span>
            <span>จาก</span>
            <span className="text-foreground font-black">{totalItems} รายการ</span>

            <span className="mx-2 text-muted-foreground/35">|</span>

            <span>ต่อหน้า:</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                const val = e.target.value
                setItemsPerPage(val === "all" ? "all" : Number(val))
                setCurrentPage(1)
              }}
              className="bg-white dark:bg-[#0B140F] border border-[#B9DCC8]/40 dark:border-[#31533D]/30 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#146B3E]/30"
            >
              <option value={20}>20</option>
              <option value={40}>40</option>
              <option value={80}>80</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 bg-white dark:bg-[#0B140F] border border-[#B9DCC8]/40 dark:border-[#31533D]/30 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
              .map((p, idx, arr) => {
                const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1
                return (
                  <div key={p} className="flex items-center gap-1">
                    {showEllipsisBefore && <span className="text-xs text-muted-foreground/50 px-1">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        p === safeCurrentPage
                          ? "bg-[#146B3E] text-white dark:bg-[#72C08A] dark:text-[#0B1B12]"
                          : "bg-white dark:bg-[#0B140F] border border-[#B9DCC8]/40 dark:border-[#31533D]/30 text-muted-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29]"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                )
              })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 bg-white dark:bg-[#0B140F] border border-[#B9DCC8]/40 dark:border-[#31533D]/30 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[#E7F3EC] dark:hover:bg-[#1D3A29] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
