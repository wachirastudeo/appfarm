import type { Task, Plot } from "@/lib/store"
import { FLOWER_STAGE_LABELS } from "@/lib/store"

export const NOTIFICATION_KEY = "durian_notifications_enabled"
const SENT_KEY = "durian_notifications_sent"

// Durian fruit is typically ready ~110-140 days after full bloom.
const HARVEST_MIN_DAYS = 110
const HARVEST_MAX_DAYS = 140

export interface Reminder {
  /** Unique per-day key used for de-duplication (prevents repeat notifications). */
  key: string
  title: string
  body: string
  /** Notification tag so the OS coalesces repeats of the same kind. */
  tag: string
  url: string
}

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(NOTIFICATION_KEY) === "true"
}

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

// ---- de-dup storage (resets each calendar day) ----

interface SentState {
  date: string
  keys: string[]
}

function loadSent(today: string): SentState {
  if (typeof window === "undefined") return { date: today, keys: [] }
  try {
    const raw = localStorage.getItem(SENT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SentState
      if (parsed && parsed.date === today && Array.isArray(parsed.keys)) return parsed
    }
  } catch {
    // ignore malformed state
  }
  return { date: today, keys: [] }
}

function markSent(today: string, key: string) {
  if (typeof window === "undefined") return
  const state = loadSent(today)
  if (!state.keys.includes(key)) {
    state.keys.push(key)
    localStorage.setItem(SENT_KEY, JSON.stringify(state))
  }
}

// ---- reminder builders ----

export function buildReminders(tasks: Task[], plots: Plot[], now: Date = new Date()): Reminder[] {
  const today = localDateStr(now)
  const reminders: Reminder[] = []

  // 1) Tasks due today / overdue (pending only)
  let dueToday = 0
  let overdue = 0
  let dueSample = ""
  let overdueSample = ""
  for (const task of tasks) {
    if (task.status !== "pending") continue
    const taskDay = localDateStr(new Date(task.date))
    if (taskDay === today) {
      dueToday++
      if (!dueSample) dueSample = task.title
    } else if (taskDay < today) {
      overdue++
      if (!overdueSample) overdueSample = task.title
    }
  }
  if (overdue > 0) {
    reminders.push({
      key: `overdue-${today}-${overdue}`,
      tag: "tasks-overdue",
      title: `งานเลยกำหนด ${overdue} รายการ`,
      body: overdue === 1 ? overdueSample : `เช่น "${overdueSample}" และอีก ${overdue - 1} งาน`,
      url: "/",
    })
  }
  if (dueToday > 0) {
    reminders.push({
      key: `due-${today}-${dueToday}`,
      tag: "tasks-due",
      title: `งานครบกำหนดวันนี้ ${dueToday} รายการ`,
      body: dueToday === 1 ? dueSample : `เช่น "${dueSample}" และอีก ${dueToday - 1} งาน`,
      url: "/",
    })
  }

  // 2) Batches approaching harvest window (from bloomDate)
  for (const plot of plots) {
    for (const tree of plot.trees) {
      if (tree.stage === "harvest") continue
      for (const batch of tree.batches) {
        if (!batch.bloomDate) continue
        const bloom = new Date(batch.bloomDate)
        if (Number.isNaN(bloom.getTime())) continue
        const age = daysBetween(bloom, now)
        if (age >= HARVEST_MIN_DAYS && age <= HARVEST_MAX_DAYS) {
          const stageLabel = FLOWER_STAGE_LABELS[tree.stage] ?? ""
          reminders.push({
            key: `harvest-${batch.id}-${today}`,
            tag: `harvest-${batch.id}`,
            title: `ใกล้ถึงช่วงเก็บเกี่ยว: ${plot.name}`,
            body: `ต้น ${tree.treeNumber}${stageLabel ? ` (${stageLabel})` : ""} รุ่น "${batch.name}" บานมาแล้ว ${age} วัน`,
            url: "/",
          })
        }
      }
    }
  }

  return reminders
}

// ---- presentation ----

async function showReminder(reminder: Reminder): Promise<void> {
  if (typeof window === "undefined") return
  if (!("Notification" in window) || Notification.permission !== "granted") return

  const options: NotificationOptions = {
    body: reminder.body,
    icon: "/durian-logo.png",
    badge: "/durian-logo.png",
    tag: reminder.tag,
    data: { url: reminder.url },
  }

  try {
    const registration =
      "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null
    if (registration) {
      await registration.showNotification(reminder.title, options)
      return
    }
  } catch {
    // fall through to the basic Notification API
  }
  new Notification(reminder.title, options)
}

/**
 * Evaluate reminders and fire any not yet shown today. Safe to call repeatedly
 * (de-duplicated per calendar day). No-op when notifications are disabled or
 * permission is not granted.
 */
export async function runScheduledNotifications(tasks: Task[], plots: Plot[]): Promise<void> {
  if (!notificationsEnabled()) return
  if (typeof window === "undefined") return
  if (!("Notification" in window) || Notification.permission !== "granted") return

  const now = new Date()
  const today = localDateStr(now)
  for (const reminder of buildReminders(tasks, plots, now)) {
    if (loadSent(today).keys.includes(reminder.key)) continue
    await showReminder(reminder)
    markSent(today, reminder.key)
  }
}
