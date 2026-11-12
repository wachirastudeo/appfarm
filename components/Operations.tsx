"use client"
import { useEffect, useState } from "react"
import { useAppData } from "@/lib/store"
import TaskPlanner from "./TaskPlanner"
import ActivityLog from "./ActivityLog"
import { CalendarDays, ClipboardList } from "lucide-react"

import { PrintReportData } from "./PrintReportView"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
  updateActivity: AppDataReturn["updateActivity"]
  addFinance?: AppDataReturn["addFinance"]
  onNavigate?: (tab: "dashboard" | "plots" | "operations" | "finance" | "articles" | "admin") => void
  onPrint?: (reportData: Omit<PrintReportData, "farmName" | "userName" | "plots">) => void
}

export default function Operations({ data, addTask, updateTask, deleteTask, addActivity, deleteActivity, updateActivity, addFinance, onNavigate, onPrint }: Props) {
  const [activeTab, setActiveTab] = useState<"tasks" | "activities">("tasks")

  useEffect(() => {
    if (localStorage.getItem("open_activity_form") === "1") {
      setActiveTab("activities")
    }
  }, [])

  return (
    <div data-page="operations" className="min-w-0 space-y-5">
      {/* Sub-Tab Switcher: plan ahead vs. record what was done */}
      <div role="tablist" aria-label="แผนงานและบันทึกสวน" className="grid min-w-0 grid-cols-2 gap-1 rounded-2xl p-1">
        {([
          ["tasks", "แผนงาน", "สิ่งที่ต้องทำ", CalendarDays],
          ["activities", "บันทึกสวน", "สิ่งที่ทำแล้ว", ClipboardList],
        ] as const).map(([id, label, hint, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 transition-all ${
              activeTab === id ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-card"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-sm font-black">{label}</span>
              <span className={`block truncate text-[11px] font-semibold ${activeTab === id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Content — no extra wrapper card */}
      {activeTab === "tasks" && (
        <TaskPlanner data={data} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} addActivity={addActivity} addFinance={addFinance} onNavigate={onNavigate} onPrint={onPrint} />
      )}
      {activeTab === "activities" && (
        <ActivityLog data={data} addActivity={addActivity} deleteActivity={deleteActivity} updateActivity={updateActivity} addFinance={addFinance} onPrint={onPrint} />
      )}
    </div>
  )
}
