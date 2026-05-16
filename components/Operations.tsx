"use client"
import { useEffect, useState } from "react"
import { useAppData } from "@/lib/store"
import TaskPlanner from "./TaskPlanner"
import ActivityLog from "./ActivityLog"
import { CalendarDays, ClipboardList } from "lucide-react"

type AppDataReturn = ReturnType<typeof useAppData>
interface Props {
  data: AppDataReturn["data"]
  addTask: AppDataReturn["addTask"]
  updateTask: AppDataReturn["updateTask"]
  deleteTask: AppDataReturn["deleteTask"]
  addActivity: AppDataReturn["addActivity"]
  deleteActivity: AppDataReturn["deleteActivity"]
  updateActivity: AppDataReturn["updateActivity"]
}

export default function Operations({ data, addTask, updateTask, deleteTask, addActivity, deleteActivity, updateActivity }: Props) {
  const [activeTab, setActiveTab] = useState<"tasks" | "activities">("tasks")

  useEffect(() => {
    if (localStorage.getItem("open_activity_form") === "1") {
      setActiveTab("activities")
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Sub-Tab Switcher */}
      <div className="flex bg-[#E7F3EC] p-1.5 rounded-2xl border-2 border-[#B9DCC8] shadow-[0_10px_24px_rgba(20,107,62,0.10)]">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(20,107,62,0.24)]"
              : "bg-white/70 text-[#146B3E] hover:bg-white"
          }`}
        >
          <CalendarDays size={16} /> แผนงาน
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === "activities"
              ? "bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(20,107,62,0.24)]"
              : "bg-white/70 text-[#146B3E] hover:bg-white"
          }`}
        >
          <ClipboardList size={16} /> บันทึกสวน
        </button>
      </div>

      {/* Content — no extra wrapper card */}
      {activeTab === "tasks" && (
        <TaskPlanner data={data} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
      )}
      {activeTab === "activities" && (
        <ActivityLog data={data} addActivity={addActivity} deleteActivity={deleteActivity} updateActivity={updateActivity} />
      )}
    </div>
  )
}
