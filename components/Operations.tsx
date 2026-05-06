"use client"
import { useState } from "react"
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

  return (
    <div className="space-y-6">
      {/* Sub-Tab Switcher */}
      <div className="flex bg-muted p-1 rounded-xl border border-border">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "tasks"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays size={16} /> แผนงาน
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "activities"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={16} /> บันทึกกิจกรรม
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
