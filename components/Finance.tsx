"use client"
import { useState, useMemo } from "react"
import { FinanceRecord, FinanceType, FinanceCategory, INCOME_CATEGORIES, EXPENSE_CATEGORIES, useAppData } from "@/lib/store"
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addFinance: AppDataReturn["addFinance"]
  deleteFinance: AppDataReturn["deleteFinance"]
}

const PIE_COLORS = ["#d4a843","#3a9662","#55c985","#c6963a","#46b575","#b88232","#68db97"]

function formatCurrency(n: number) { return "฿" + n.toLocaleString("th-TH") }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) }

export default function Finance({ data, addFinance, deleteFinance }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<FinanceType | "all">("all")
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

  const handleAdd = () => {
    if (!form.description || form.amount <= 0) return
    addFinance({ ...form, date: new Date(form.date).toISOString() })
    setForm({ date: new Date().toISOString().split("T")[0], type: "expense", category: "ปุ๋ย", amount: 0, description: "", plotId: data.plots[0]?.id ?? "" })
    setShowForm(false)
  }

  const plotName = (id?: string) => id ? (data.plots.find(p => p.id === id)?.name ?? id) : "–"

  const stats = useMemo(() => {
    const income = data.finance.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0)
    const expense = data.finance.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0)
    return { income, expense, profit: income - expense }
  }, [data.finance])

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    data.finance.filter(f => f.type === "expense").forEach(f => { map[f.category] = (map[f.category] || 0) + f.amount })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [data.finance])

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {}
    data.finance.forEach(f => {
      const d = new Date(f.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
      if (!map[key]) map[key] = { month: MONTHS_TH[d.getMonth()], income: 0, expense: 0 }
      if (f.type === "income") map[key].income += f.amount
      else map[key].expense += f.amount
    })
    return Object.values(map).slice(-6)
  }, [data.finance])

  const filtered = data.finance
    .filter(f => typeFilter === "all" || f.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">การเงิน</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} />{showForm ? "ยกเลิก" : "บันทึก"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <TrendingUp size={16} className="mx-auto text-green-700 mb-1" />
          <p className="text-xs text-muted-foreground">รายรับ</p>
          <p className="text-sm font-bold text-green-700">{formatCurrency(stats.income)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <TrendingDown size={16} className="mx-auto text-red-700 mb-1" />
          <p className="text-xs text-muted-foreground">รายจ่าย</p>
          <p className="text-sm font-bold text-red-700">{formatCurrency(stats.expense)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Wallet size={16} className={`mx-auto mb-1 ${stats.profit >= 0 ? "text-primary" : "text-destructive"}`} />
          <p className="text-xs text-muted-foreground">กำไร</p>
          <p className={`text-sm font-bold ${stats.profit >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(stats.profit)}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">บันทึกรายการ</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
          </div>
          {/* Income / Expense Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button onClick={() => { set("type","income"); set("category","ขายผล") }} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === "income" ? "bg-green-100 text-green-700" : "text-muted-foreground"}`}>
              รายรับ
            </button>
            <button onClick={() => { set("type","expense"); set("category","ปุ๋ย") }} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === "expense" ? "bg-red-100 text-red-700" : "text-muted-foreground"}`}>
              รายจ่าย
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">วันที่</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">จำนวนเงิน (บาท)</label>
              <input type="number" value={form.amount || ""} onChange={e => set("amount", Number(e.target.value))} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" min={0} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">หมวดหมู่</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => set("category", c)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.category === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">แปลง</label>
            <select value={form.plotId} onChange={e => set("plotId", e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">– ไม่ระบุ –</option>
              {data.plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">รายละเอียด</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="รายละเอียด..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2.5 text-muted-foreground">ยกเลิก</button>
            <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:opacity-90">บันทึก</button>
          </div>
        </div>
      )}

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">รายรับ-รายจ่ายรายเดือน</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: "oklch(0.62 0.04 155)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.62 0.04 155)", fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                labelStyle={{ color: "#1f2937" }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="income" name="รายรับ" fill="#3a9662" radius={[3,3,0,0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#c0392b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {expenseByCategory.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">สัดส่วนรายจ่าย</h3>
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {expenseByCategory.map((e, i) => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground flex-1">{e.name}</span>
                  <span className="text-xs font-medium text-foreground">{formatCurrency(e.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter + List */}
      <div className="flex gap-2">
        {(["all","income","expense"] as (FinanceType | "all")[]).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t === "all" ? "ทั้งหมด" : t === "income" ? "รายรับ" : "รายจ่าย"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Wallet size={36} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">ยังไม่มีรายการ</p>
          </div>
        ) : filtered.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 group">
            <div className={`p-2 rounded-lg shrink-0 ${f.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {f.type === "income" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{f.description}</p>
              <p className="text-xs text-muted-foreground">{f.category} · {plotName(f.plotId)} · {formatDate(f.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${f.type === "income" ? "text-green-700" : "text-red-700"}`}>
                {f.type === "income" ? "+" : "-"}{formatCurrency(f.amount)}
              </span>
              <button onClick={() => deleteFinance(f.id)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
