"use client"
import React from "react"
import { FinanceRecord, Task, Activity, Plot, ACTIVITY_LABELS } from "@/lib/store"

export type PrintReportType = "finance" | "operations" | "plots"

export interface PrintReportData {
  type: PrintReportType
  title: string
  dateRange: string
  farmName: string
  userName: string
  financeRecords?: FinanceRecord[]
  tasks?: Task[]
  activities?: Activity[]
  plots?: Plot[]
}

interface Props {
  printData: PrintReportData | null
  onClose: () => void
}

export default function PrintReportView({ printData, onClose }: Props) {
  if (!printData) return null

  const generatedDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <div id="print-area-root" className="hidden print:block min-h-screen bg-white text-black p-8 font-sans">
      {/* Print Controls (Only visible on screen in case layout leaks, but globals.css will hide this) */}
      <div className="no-print mb-6 flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-sm font-bold text-gray-500">โหมดพรีวิวการพิมพ์</span>
          <h2 className="text-lg font-black text-gray-800">กรุณาใช้ฟังก์ชัน Print ของเบราว์เซอร์เพื่อบันทึก PDF</h2>
        </div>
        <button
          onClick={onClose}
          className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-700"
        >
          ปิดพรีวิว
        </button>
      </div>

      {/* Report Header */}
      <div className="border-b-4 border-emerald-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-emerald-800 tracking-tight">{printData.farmName || "สวนทุเรียน"}</h1>
            <p className="text-sm font-bold text-gray-600 mt-1">เจ้าของสวน: {printData.userName || "สมชาย"}</p>
          </div>
          <div className="text-right text-xs text-gray-500 font-medium">
            <p>วันที่พิมพ์: {generatedDate}</p>
            <p className="mt-1">ช่วงเวลา: {printData.dateRange}</p>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-black text-gray-800">{printData.title}</h2>
        </div>
      </div>

      {/* Render based on report type */}
      {printData.type === "finance" && printData.financeRecords && (
        <FinancePrintReport records={printData.financeRecords} plots={printData.plots || []} />
      )}

      {printData.type === "operations" && (printData.tasks || printData.activities) && (
        <OperationsPrintReport 
          tasks={printData.tasks || []} 
          activities={printData.activities || []} 
          plots={printData.plots || []} 
        />
      )}

      {printData.type === "plots" && printData.plots && (
        <PlotsPrintReport plots={printData.plots} />
      )}

      {/* Report Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400 print-page-break-avoid">
        <p>เอกสารนี้ออกโดยระบบจัดการสวนทุเรียนอัจฉริยะ DurianFlow</p>
        <div className="mt-8 flex justify-around">
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-gray-400 h-10 mb-2"></div>
            <p className="text-gray-500 font-bold">ผู้รายงาน / เจ้าของสวน</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-40 border-b border-gray-400 h-10 mb-2"></div>
            <p className="text-gray-500 font-bold">ผู้ตรวจสอบ</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   Finance Print Report Layout
   ========================================================================== */
function FinancePrintReport({ records, plots }: { records: FinanceRecord[]; plots: Plot[] }) {
  const plotNameMap = new Map(plots.map(p => [p.id, p.name]))
  const getPlotName = (id?: string) => id ? plotNameMap.get(id) ?? "ไม่ระบุแปลง" : "ไม่ระบุแปลง"

  // Calculate summaries
  const income = records.filter(r => r.type === "income").reduce((sum, r) => sum + r.amount, 0)
  const expense = records.filter(r => r.type === "expense").reduce((sum, r) => sum + r.amount, 0)
  const profit = income - expense
  const margin = income > 0 ? Math.round((profit / income) * 100) : 0

  // Category breakdown
  const categoryMap: Record<string, { income: number; expense: number }> = {}
  records.forEach(r => {
    if (!categoryMap[r.category]) categoryMap[r.category] = { income: 0, expense: 0 }
    if (r.type === "income") categoryMap[r.category].income += r.amount
    else categoryMap[r.category].expense += r.amount
  })

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-4 gap-4 print-card">
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">รายรับรวม</p>
          <p className="text-lg font-black text-emerald-700 mt-1">฿{income.toLocaleString("th-TH")}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">รายจ่ายรวม</p>
          <p className="text-lg font-black text-rose-700 mt-1">฿{expense.toLocaleString("th-TH")}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">กำไรสุทธิ</p>
          <p className={`text-lg font-black mt-1 ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            ฿{profit.toLocaleString("th-TH")}
          </p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">อัตรากำไร (Margin)</p>
          <p className="text-lg font-black text-gray-800 mt-1">{margin}%</p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="print-page-break-avoid">
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">สรุปตามหมวดหมู่</h3>
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-black">หมวดหมู่</th>
              <th className="border border-gray-300 p-2 text-right font-black">รายรับ (บาท)</th>
              <th className="border border-gray-300 p-2 text-right font-black">รายจ่าย (บาท)</th>
              <th className="border border-gray-300 p-2 text-right font-black">ยอดรวมสุทธิ (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryMap).map(([cat, val]) => (
              <tr key={cat}>
                <td className="border border-gray-300 p-2 font-bold">{cat}</td>
                <td className="border border-gray-300 p-2 text-right">{val.income > 0 ? `+฿${val.income.toLocaleString()}` : "-"}</td>
                <td className="border border-gray-300 p-2 text-right text-rose-700">{val.expense > 0 ? `-฿${val.expense.toLocaleString()}` : "-"}</td>
                <td className={`border border-gray-300 p-2 text-right font-black ${val.income - val.expense >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  ฿{(val.income - val.expense).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Table */}
      <div>
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">รายการธุรกรรมอย่างละเอียด</h3>
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-black w-24">วันที่</th>
              <th className="border border-gray-300 p-2 text-left font-black w-20">ประเภท</th>
              <th className="border border-gray-300 p-2 text-left font-black w-28">หมวดหมู่</th>
              <th className="border border-gray-300 p-2 text-left font-black w-28">แปลงทุเรียน</th>
              <th className="border border-gray-300 p-2 text-right font-black w-32">จำนวนเงิน</th>
              <th className="border border-gray-300 p-2 text-left font-black">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="print-page-break-avoid">
                <td className="border border-gray-300 p-2">{r.date.split("T")[0]}</td>
                <td className={`border border-gray-300 p-2 font-bold ${r.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                  {r.type === "income" ? "รายรับ" : "รายจ่าย"}
                </td>
                <td className="border border-gray-300 p-2 font-semibold">{r.category}</td>
                <td className="border border-gray-300 p-2">{getPlotName(r.plotId)}</td>
                <td className={`border border-gray-300 p-2 text-right font-black ${r.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                  ฿{r.amount.toLocaleString("th-TH")}
                </td>
                <td className="border border-gray-300 p-2 text-gray-600">{r.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ==========================================================================
   Operations Print Report Layout (Tasks & Activities)
   ========================================================================== */
function OperationsPrintReport({ 
  tasks, 
  activities, 
  plots 
}: { 
  tasks: Task[]
  activities: Activity[]
  plots: Plot[] 
}) {
  const plotNameMap = new Map(plots.map(p => [p.id, p.name]))
  const getPlotName = (id?: string) => id ? plotNameMap.get(id) ?? "ไม่ระบุแปลง" : "ไม่ระบุแปลง"

  const doneTasks = tasks.filter(t => t.status === "done").length
  const pendingTasks = tasks.filter(t => t.status === "pending").length
  const cancelledTasks = tasks.filter(t => t.status === "cancelled").length

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-4 gap-4 print-card">
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">งานเสร็จแล้ว</p>
          <p className="text-lg font-black text-emerald-700 mt-1">{doneTasks} งาน</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">งานรอดำเนินการ</p>
          <p className="text-lg font-black text-amber-600 mt-1">{pendingTasks} งาน</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">งานยกเลิก</p>
          <p className="text-lg font-black text-gray-500 mt-1">{cancelledTasks} งาน</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">บันทึกกิจกรรมสวน</p>
          <p className="text-lg font-black text-emerald-800 mt-1">{activities.length} รายการ</p>
        </div>
      </div>

      {/* Combined Schedule & Activities List */}
      <div>
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">ตารางรายการปฏิบัติงานสวน</h3>
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-black w-24">วันที่</th>
              <th className="border border-gray-300 p-2 text-left font-black w-28">ประเภทรายการ</th>
              <th className="border border-gray-300 p-2 text-left font-black w-32">ประเภทงาน/กิจกรรม</th>
              <th className="border border-gray-300 p-2 text-left font-black w-32">แปลงทุเรียน</th>
              <th className="border border-gray-300 p-2 text-left font-black">ชื่องาน/บันทึกการทำงาน</th>
              <th className="border border-gray-300 p-2 text-left font-black w-32">สถานะ/ความเร่งด่วน</th>
            </tr>
          </thead>
          <tbody>
            {/* Merge and sort tasks + activities */}
            {[
              ...tasks.map(t => ({
                id: t.id,
                date: t.date,
                itemType: "แผนงาน (Task)",
                typeLabel: t.title,
                plotId: t.plotId,
                detail: t.description,
                status: t.status === "done" ? "เสร็จแล้ว" : t.status === "cancelled" ? "ยกเลิก" : "รอดำเนินการ",
                badgeColor: t.status === "done" ? "text-emerald-700" : t.status === "cancelled" ? "text-gray-500" : "text-amber-600 font-bold",
                priority: t.priority
              })),
              ...activities.map(a => ({
                id: a.id,
                date: a.date,
                itemType: "บันทึกสวน (Activity)",
                typeLabel: ACTIVITY_LABELS[a.activityType] || a.activityType,
                plotId: a.plotId,
                detail: a.description,
                status: "บันทึกแล้ว",
                badgeColor: "text-emerald-800",
                priority: ""
              }))
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(item => (
                <tr key={item.id} className="print-page-break-avoid">
                  <td className="border border-gray-300 p-2">{item.date.split("T")[0]}</td>
                  <td className="border border-gray-300 p-2 text-gray-500 font-medium">{item.itemType}</td>
                  <td className="border border-gray-300 p-2 font-bold">{item.typeLabel}</td>
                  <td className="border border-gray-300 p-2">{getPlotName(item.plotId)}</td>
                  <td className="border border-gray-300 p-2 text-gray-600 font-medium">{item.detail || "-"}</td>
                  <td className={`border border-gray-300 p-2 ${item.badgeColor}`}>
                    {item.status}
                    {item.priority && ` (${item.priority === "high" ? "ด่วนสุด" : item.priority === "medium" ? "ทั่วไป" : "รอง"})`}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ==========================================================================
   Plots & Trees Print Report Layout
   ========================================================================== */
function PlotsPrintReport({ plots }: { plots: Plot[] }) {
  const totalPlots = plots.length
  const totalArea = plots.reduce((acc, p) => acc + p.area, 0)
  const totalTrees = plots.reduce((acc, p) => acc + p.trees.length, 0)
  const goodTrees = plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "good").length, 0)
  const fairTrees = plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "fair").length, 0)
  const poorTrees = plots.reduce((acc, p) => acc + p.trees.filter(t => t.health === "poor").length, 0)
  const healthyPercent = totalTrees > 0 ? Math.round((goodTrees / totalTrees) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-5 gap-4 print-card">
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">แปลงทั้งหมด</p>
          <p className="text-lg font-black text-emerald-800 mt-1">{totalPlots} แปลง</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">พื้นที่รวม (ไร่)</p>
          <p className="text-lg font-black text-emerald-800 mt-1">{totalArea.toFixed(1)} ไร่</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ต้นทุเรียนรวม</p>
          <p className="text-lg font-black text-emerald-800 mt-1">{totalTrees} ต้น</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-xl text-center bg-gray-50 col-span-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">สุขภาพดีเฉลี่ย</p>
          <p className="text-lg font-black text-emerald-700 mt-1">
            {healthyPercent}% <span className="text-xs text-gray-400 font-bold">(ดี: {goodTrees} / กลาง: {fairTrees} / เสื่อม: {poorTrees})</span>
          </p>
        </div>
      </div>

      {/* Plot Registry Table */}
      <div className="print-page-break-avoid">
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">สรุปภาพรวมรายแปลง</h3>
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-black">ชื่อแปลง</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">พื้นที่ (ไร่)</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">ต้นทุเรียนรวม</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">แข็งแรงดี</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">ปานกลาง</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">ทรุดโทรม/โรค</th>
              <th className="border border-gray-300 p-2 text-left font-black">หมายเหตุแปลง</th>
            </tr>
          </thead>
          <tbody>
            {plots.map(p => {
              const treesCount = p.trees.length
              const goodCount = p.trees.filter(t => t.health === "good").length
              const fairCount = p.trees.filter(t => t.health === "fair").length
              const poorCount = p.trees.filter(t => t.health === "poor").length

              return (
                <tr key={p.id}>
                  <td className="border border-gray-300 p-2 font-bold">{p.name}</td>
                  <td className="border border-gray-300 p-2 text-right">{p.area}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{treesCount}</td>
                  <td className="border border-gray-300 p-2 text-right text-emerald-700">{goodCount}</td>
                  <td className="border border-gray-300 p-2 text-right text-amber-600">{fairCount}</td>
                  <td className="border border-gray-300 p-2 text-right text-rose-700">{poorCount}</td>
                  <td className="border border-gray-300 p-2 text-gray-500">{p.notes || "-"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Tree Registry Table */}
      <div>
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-2">บัญชีทะเบียนต้นทุเรียนรายต้น</h3>
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-black w-28">ชื่อแปลง</th>
              <th className="border border-gray-300 p-2 text-left font-black w-24">หมายเลขต้น</th>
              <th className="border border-gray-300 p-2 text-left font-black w-28">พันธุ์ทุเรียน</th>
              <th className="border border-gray-300 p-2 text-right font-black w-24">อายุต้น (ปี)</th>
              <th className="border border-gray-300 p-2 text-left font-black w-36">ระยะดอก/การเจริญเติบโต</th>
              <th className="border border-gray-300 p-2 text-left font-black w-28">สุขภาพ</th>
              <th className="border border-gray-300 p-2 text-left font-black">บันทึก</th>
            </tr>
          </thead>
          <tbody>
            {plots.flatMap(p => 
              p.trees.map(t => ({
                plotName: p.name,
                ...t
              }))
            )
              .sort((a, b) => a.plotName.localeCompare(b.plotName) || a.treeNumber.localeCompare(b.treeNumber))
              .map(tree => (
                <tr key={tree.id} className="print-page-break-avoid">
                  <td className="border border-gray-300 p-2 font-semibold">{tree.plotName}</td>
                  <td className="border border-gray-300 p-2 font-bold">ต้นที่ {tree.treeNumber}</td>
                  <td className="border border-gray-300 p-2">{tree.variety}</td>
                  <td className="border border-gray-300 p-2 text-right">{tree.age} ปี</td>
                  <td className="border border-gray-300 p-2 font-medium">{tree.stage || "เจริญเติบโต"}</td>
                  <td className={`border border-gray-300 p-2 font-bold ${tree.health === "good" ? "text-emerald-700" : tree.health === "fair" ? "text-amber-600" : "text-rose-700"}`}>
                    {tree.health === "good" ? "แข็งแรงดี" : tree.health === "fair" ? "ปานกลาง" : "ทรุดโทรม/โรค"}
                  </td>
                  <td className="border border-gray-300 p-2 text-gray-500">{tree.notes || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
