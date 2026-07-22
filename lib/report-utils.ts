import { FinanceRecord, Task, Activity, Plot, Tree, ACTIVITY_LABELS, VARIETIES } from "./store"

/**
 * Escapes a string for use in CSV
 */
function escapeCSVField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  // If value contains comma, quotes or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Downloads a CSV file client-side
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.map(escapeCSVField).join(","),
    ...rows.map(row => row.map(escapeCSVField).join(","))
  ].join("\r\n")

  // Prefix UTF-8 BOM to make Excel support Thai correctly
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])
  const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" })
  
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Exports Finance Records to CSV
 */
export function exportFinanceToCSV(
  records: FinanceRecord[], 
  plotNameFn: (id?: string) => string
) {
  const headers = ["วันที่", "ประเภท", "หมวดหมู่", "จำนวนเงิน (บาท)", "แปลงทุเรียน", "รายละเอียด"]
  const rows = records.map(r => [
    r.date.split("T")[0],
    r.type === "income" ? "รายรับ" : "รายจ่าย",
    r.category,
    r.amount.toString(),
    plotNameFn(r.plotId),
    r.description
  ])
  
  const dateStr = new Date().toISOString().split("T")[0]
  downloadCSV(`รายงานการเงิน_${dateStr}.csv`, headers, rows)
}

/**
 * Exports Operations (Tasks and Activities) to CSV
 */
export function exportOperationsToCSV(
  tasks: Task[], 
  activities: Activity[], 
  plotNameFn: (id?: string) => string
) {
  const headers = ["วันที่", "ประเภทรายการ", "ประเภทงาน/กิจกรรม", "แปลงทุเรียน", "ชื่องาน/รายละเอียด", "สถานะ/ความเร่งด่วน"]
  
  const rows: string[][] = []

  // Add tasks
  tasks.forEach(t => {
    const statusLabel = t.status === "done" ? "เสร็จแล้ว" : t.status === "cancelled" ? "ยกเลิก" : "รอดำเนินการ"
    const priorityLabel = t.priority === "high" ? "ด่วนสุด" : t.priority === "medium" ? "ทั่วไป" : "รอง"
    rows.push([
      t.date.split("T")[0],
      "แผนงาน (Task)",
      t.title,
      plotNameFn(t.plotId),
      t.description || "-",
      `${statusLabel} (ความสำคัญ: ${priorityLabel})`
    ])
  })

  // Add activities
  activities.forEach(a => {
    const activityTypeLabel = ACTIVITY_LABELS[a.activityType] || a.activityType
    rows.push([
      a.date.split("T")[0],
      "บันทึกสวน (Activity)",
      activityTypeLabel,
      plotNameFn(a.plotId),
      a.description || "-",
      "บันทึกแล้ว"
    ])
  })

  // Sort rows by date descending
  rows.sort((a, b) => b[0].localeCompare(a[0]))

  const dateStr = new Date().toISOString().split("T")[0]
  downloadCSV(`รายงานแผนงานและกิจกรรม_${dateStr}.csv`, headers, rows)
}

/**
 * Exports Plot Registry and Tree Inventory to CSV
 */
export function exportPlotsToCSV(plots: Plot[]) {
  const headers = ["ชื่อแปลง", "พื้นที่แปลง (ไร่)", "หมายเลขต้น", "พันธุ์ทุเรียน", "อายุต้น (ปี)", "ระยะดอก/การเติบโต", "สถานะสุขภาพ", "จำนวนผลทุเรียนรวม", "บันทึก"]
  
  const rows: string[][] = []

  plots.forEach(plot => {
    if (plot.trees.length === 0) {
      rows.push([
        plot.name,
        plot.area.toString(),
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        plot.notes || "-"
      ])
    } else {
      plot.trees.forEach(t => {
        const totalFruit = t.batches?.reduce((sum, b) => sum + (b.fruitCount || 0), 0) ?? 0
        const healthLabel = t.health === "good" ? "แข็งแรงดี" : t.health === "fair" ? "ปานกลาง" : "ทรุดโทรม/เป็นโรค"
        
        // Translate flower stage
        const stageLabel = t.stage || "เจริญเติบโต"

        rows.push([
          plot.name,
          plot.area.toString(),
          t.treeNumber || "-",
          t.variety || "-",
          t.age.toString(),
          stageLabel,
          healthLabel,
          totalFruit.toString(),
          t.notes || "-"
        ])
      })
    }
  })

  const dateStr = new Date().toISOString().split("T")[0]
  downloadCSV(`รายงานทะเบียนแปลงและต้นไม้_${dateStr}.csv`, headers, rows)
}
