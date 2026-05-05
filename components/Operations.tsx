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
}

export default function Operations({ data, addTask, updateTask, deleteTask, addActivity, deleteActivity }: Props) {
  const [activeTab, setActiveTab] = useState<"tasks" | "activities">("tasks")

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex bg-white/20 backdrop-blur-lg p-1.5 rounded-[2rem] border border-white/30 shadow-lg mb-8 relative z-10">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeTab === "tasks" ? "bg-white text-primary shadow-md scale-[1.02]" : "text-white/90 hover:text-white hover:bg-white/10"}`}
        >
          <CalendarDays size={18} /> แผนงาน
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeTab === "activities" ? "bg-white text-primary shadow-md scale-[1.02]" : "text-white/90 hover:text-white hover:bg-white/10"}`}
        >
          <ClipboardList size={18} /> บันทึกกิจกรรม
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-card rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 shadow-xl border border-border relative z-10">
        {activeTab === "tasks" && (
          <TaskPlanner data={data} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />
        )}
        {activeTab === "activities" && (
          <ActivityLog data={data} addActivity={addActivity} deleteActivity={deleteActivity} />
        )}
      </div>
    </div>
  )
}
