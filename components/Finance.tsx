"use client"
import { useEffect, useMemo, useState } from "react"
import { FinanceType, FinanceCategory, INCOME_CATEGORIES, EXPENSE_CATEGORIES, useAppData } from "@/lib/store"
import { validateDate, validateNumber, validateText } from "@/lib/form-validation"
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X, Search, Filter, CalendarDays, ReceiptText, Tags, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addFinance: AppDataReturn["addFinance"]
  deleteFinance: AppDataReturn["deleteFinance"]
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
const PIE_COLORS = ["#146B3E", "#45A96B", "#F59E0B", "#D97706", "#7FB58D", "#64748B", "#94A3B8"]

function formatCurrency(n: number) { return "฿" + n.toLocaleString("th-TH") }
function formatShort(n: number) {
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`
  return `${n}`
}
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) }

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export default function Finance({ data, addFinance, deleteFinance }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<FinanceType | "all">("all")
  const [plotFilter, setPlotFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState<FinanceCategory | "all">("all")
  const [rangeFilter, setRangeFilter] = useState<"all" | "thisMonth" | "3m" | "6m">("6m")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(20)

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, plotFilter, categoryFilter, rangeFilter, search])
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense" as FinanceType,
    category: "ปุ๋ย" as FinanceCategory,
    amount: 0,
    description: "",
    plotId: data.plots[0]?.id ?? "",
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].filter((v, i, arr) => arr.indexOf(v) === i)

  const handleAdd = () => {
    const description = validateText("รายละเอียด", form.description, { required: true, maxLength: 240 })
    const amount = validateNumber("จำนวนเงิน", form.amount, { min: 0.01, max: 100000000 })
    const date = validateDate("วันที่", form.date)
    const invalid = [description, amount, date].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      alert(invalid.message)
      return
    }
    addFinance({ ...form, description: description.value, amount: amount.value, date: new Date(date.value).toISOString() })
    setForm({ date: new Date().toISOString().split("T")[0], type: "expense", category: "ปุ๋ย", amount: 0, description: "", plotId: data.plots[0]?.id ?? "" })
    setShowForm(false)
  }

  const plotName = (id?: string) => id ? (data.plots.find(p => p.id === id)?.name ?? id) : "ไม่ระบุ"

  const filtered = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (rangeFilter === "thisMonth") start.setDate(1)
    if (rangeFilter === "3m") start.setMonth(now.getMonth() - 2, 1)
    if (rangeFilter === "6m") start.setMonth(now.getMonth() - 5, 1)

    return data.finance
      .map(f => ({ ...f, simulated: false }))
      .filter(f => typeFilter === "all" || f.type === typeFilter)
      .filter(f => plotFilter === "all" || f.plotId === plotFilter)
      .filter(f => categoryFilter === "all" || f.category === categoryFilter)
      .filter(f => rangeFilter === "all" || new Date(f.date) >= start)
      .filter(f => {
        if (!search.trim()) return true
        const plotLabel = f.plotId ? (data.plots.find(p => p.id === f.plotId)?.name ?? f.plotId) : "ไม่ระบุ"
        return `${f.description} ${f.category} ${plotLabel}`.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.finance, data.plots, typeFilter, plotFilter, categoryFilter, rangeFilter, search])

  const totalItems = filtered.length
  const effectiveItemsPerPage = itemsPerPage === "all" ? totalItems : itemsPerPage
  const totalPages = effectiveItemsPerPage > 0 ? Math.ceil(totalItems / effectiveItemsPerPage) : 1
  const safeCurrentPage = Math.min(currentPage, totalPages || 1)
  const paginatedFinance = useMemo(() => {
    return filtered.slice(
      (safeCurrentPage - 1) * effectiveItemsPerPage,
      safeCurrentPage * effectiveItemsPerPage
    )
  }, [filtered, safeCurrentPage, effectiveItemsPerPage])

  const stats = useMemo(() => {
    const income = filtered.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0)
    const expense = filtered.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0)
    const profit = income - expense
    const margin = income > 0 ? Math.round((profit / income) * 100) : 0
    return { income, expense, profit, margin }
  }, [filtered])

  const monthlyData = useMemo(() => {
    const map: Record<string, { key: string; month: string; income: number; expense: number; profit: number }> = {}
    filtered.forEach(f => {
      const d = new Date(f.date)
      const key = monthKey(d)
      if (!map[key]) map[key] = { key, month: MONTHS_TH[d.getMonth()], income: 0, expense: 0, profit: 0 }
      if (f.type === "income") map[key].income += f.amount
      else map[key].expense += f.amount
      map[key].profit = map[key].income - map[key].expense
    })
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-8)
  }, [filtered])

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.filter(f => f.type === "expense").forEach(f => { map[f.category] = (map[f.category] || 0) + f.amount })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const incomeByPlot = useMemo(() => {
    return data.plots.map(p => {
      const income = filtered.filter(f => f.plotId === p.id && f.type === "income").reduce((s, f) => s + f.amount, 0)
      const expense = filtered.filter(f => f.plotId === p.id && f.type === "expense").reduce((s, f) => s + f.amount, 0)
      return { name: p.name, income, expense, profit: income - expense }
    }).filter(p => p.income || p.expense).sort((a, b) => b.profit - a.profit)
  }, [filtered, data.plots])

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#146B3E] p-4 sm:p-5 text-white shadow-[0_18px_42px_rgba(20,107,62,0.2)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.22),transparent_16rem)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/70">Orchard Finance</p>
            <h2 className="text-2xl font-black leading-tight">การเงินสวน</h2>
            <p className="mt-1 text-sm font-medium text-white/70">ติดตามรายรับ รายจ่าย กำไร และต้นทุนแยกตามแปลง</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#146B3E] shadow-lg hover:bg-[#E7F3EC]">
            <Plus size={17} />{showForm ? "ยกเลิก" : "บันทึกรายการ"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "รายรับ", value: stats.income, icon: TrendingUp, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
          { label: "รายจ่าย", value: stats.expense, icon: TrendingDown, tone: "text-rose-700 bg-rose-50 border-rose-100" },
          { label: "กำไรสุทธิ", value: stats.profit, icon: Wallet, tone: stats.profit >= 0 ? "text-[#146B3E] bg-[#E7F3EC] border-[#B9DCC8]" : "text-rose-700 bg-rose-50 border-rose-100" },
          { label: "Margin", value: `${stats.margin}%`, icon: ReceiptText, tone: "text-slate-700 bg-white border-[#B9DCC8]" },
        ].map(item => (
          <div key={item.label} className={`min-w-0 rounded-2xl border p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)] ${item.tone}`}>
            <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white">
              <item.icon size={20} />
            </div>
            <p className="text-sm font-bold opacity-90">{item.label}</p>
            <p className="mt-1 text-[11px] min-[360px]:text-xs sm:text-base md:text-xl font-black leading-tight break-all">{typeof item.value === "number" ? formatCurrency(item.value) : item.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#B9DCC8] bg-white p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-foreground">บันทึกรายการ</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-[#527060]" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-[#B9DCC8] bg-[#E7F3EC] p-1.5">
            <button
              onClick={() => { set("type", "income"); set("category", "ขายผล") }}
              className={`rounded-xl py-3 text-sm font-black transition-all ${form.type === "income" ? "bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,0.28)]" : "bg-white/70 text-[#146B3E] hover:bg-white"}`}
            >
              รายรับ
            </button>
            <button
              onClick={() => { set("type", "expense"); set("category", "ปุ๋ย") }}
              className={`rounded-xl py-3 text-sm font-black transition-all ${form.type === "expense" ? "bg-rose-600 text-white shadow-[0_12px_28px_rgba(225,29,72,0.26)]" : "bg-white/70 text-[#7A3F52] hover:bg-white"}`}
            >
              รายจ่าย
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="number" value={form.amount || ""} onChange={e => set("amount", Number(e.target.value))} className="rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40" min={0} max={100000000} step="0.01" placeholder="จำนวนเงิน" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => set("category", c)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${form.category === c ? "border-primary bg-primary text-primary-foreground" : "border-[#B9DCC8] text-[#527060]"}`}>{c}</button>
            ))}
          </div>
          <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">ไม่ระบุแปลง</option>
            {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40" placeholder="รายละเอียด..." />
          <button onClick={handleAdd} className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-[#0F5A34]">บันทึกรายการ</button>
        </div>
      )}

      <div className="rounded-2xl border border-[#B9DCC8] bg-white p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#527060]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหารายการ หมวดหมู่ หรือแปลง..." className="w-full rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <select value={rangeFilter} onChange={e => setRangeFilter(e.target.value as typeof rangeFilter)} className="rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-3 py-2.5 text-sm font-bold outline-none">
            <option value="thisMonth">เดือนนี้</option>
            <option value="3m">3 เดือน</option>
            <option value="6m">6 เดือน</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <select value={plotFilter} onChange={e => setPlotFilter(e.target.value)} className="rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-3 py-2.5 text-sm font-bold outline-none">
            <option value="all">ทุกแปลง</option>
            {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as FinanceCategory | "all")} className="rounded-xl border border-[#B9DCC8] bg-[#F7FBF8] px-3 py-2.5 text-sm font-bold outline-none">
            <option value="all">ทุกหมวด</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1 sm:scrollbar-hide">
          {(["all", "income", "expense"] as (FinanceType | "all")[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-[#B9DCC8] text-[#527060] hover:text-foreground"}`}>
              <Filter size={13} />{t === "all" ? "ทั้งหมด" : t === "income" ? "รายรับ" : "รายจ่าย"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="min-w-0 xl:col-span-3 rounded-2xl border border-[#B9DCC8] bg-white p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            <h3 className="font-black text-foreground">รายรับ-รายจ่ายรายเดือน</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E7F3EC" />
              <XAxis dataKey="month" tick={{ fill: "#527060", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#527060", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #c9dacd" }} />
              <Bar dataKey="income" name="รายรับ" fill="#146B3E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#E06A5F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 xl:col-span-2 rounded-2xl border border-[#B9DCC8] bg-white p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
          <div className="mb-3 flex items-center gap-2">
            <Tags size={18} className="text-primary" />
            <h3 className="font-black text-foreground">สัดส่วนรายจ่าย</h3>
          </div>
          {expenseByCategory.length > 0 ? (
            <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center">
              <PieChart width={130} height={130}>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={3} dataKey="value">
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
              <div className="min-w-0 flex-1 space-y-2">
                {expenseByCategory.slice(0, 5).map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 truncate font-bold text-[#527060]">{e.name}</span>
                    <span className="font-black text-foreground">{formatCurrency(e.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="py-10 text-center text-sm text-[#527060]">ไม่มีรายจ่าย</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="min-w-0 xl:col-span-2 rounded-2xl border border-[#B9DCC8] bg-white p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <h3 className="font-black text-foreground">กำไรแยกตามแปลง</h3>
          </div>
          <div className="space-y-3">
            {incomeByPlot.length === 0 ? <p className="text-sm text-[#527060]">ไม่มีข้อมูลแปลง</p> : incomeByPlot.map(p => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">{p.name}</span>
                  <span className={`font-black ${p.profit >= 0 ? "text-primary" : "text-rose-700"}`}>{formatCurrency(p.profit)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E7F3EC]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(8, (Math.abs(p.profit) / Math.max(...incomeByPlot.map(x => Math.abs(x.profit)), 1)) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 xl:col-span-3 rounded-2xl border border-[#B9DCC8] bg-white p-3 sm:p-4 shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
          <h3 className="mb-3 font-black text-foreground">แนวโน้มกำไร</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E7F3EC" />
              <XAxis dataKey="month" tick={{ fill: "#527060", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#527060", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #c9dacd" }} />
              <Line type="monotone" dataKey="profit" name="กำไร" stroke="#146B3E" strokeWidth={3} dot={{ r: 4, fill: "#146B3E" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#B9DCC8] bg-white shadow-[0_12px_30px_rgba(20,107,62,0.10)]">
        <div className="flex items-center justify-between border-b border-[#B9DCC8] p-4">
          <h3 className="font-black text-foreground">รายการล่าสุด</h3>
          <span className="text-sm font-bold text-[#527060]">{filtered.length} รายการ</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet size={36} className="mx-auto mb-2 text-[#527060]" />
              <p className="text-[#527060]">ยังไม่มีรายการ</p>
            </div>
          ) : paginatedFinance.map(f => (
            <div key={f.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 transition-colors hover:bg-[#E7F3EC]/65">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {f.type === "income" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-foreground">{f.description}</p>
                <p className="text-xs font-medium text-[#527060]">{f.category} · {plotName(f.plotId)} · {formatDate(f.date)}{f.simulated ? " · จำลอง" : ""}</p>
              </div>
              <span className={`shrink-0 text-sm font-black ${f.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                {f.type === "income" ? "+" : "-"}{formatCurrency(f.amount)}
              </span>
              {!f.simulated && (
                <button onClick={() => deleteFinance(f.id)} className="rounded-lg p-2 text-[#527060] hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
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
