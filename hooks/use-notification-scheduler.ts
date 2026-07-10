import { useEffect } from "react"
import type { Task, Plot } from "@/lib/store"
import { runScheduledNotifications } from "@/lib/notifications"

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // re-check every 30 min while the app is open
const INITIAL_DELAY_MS = 4000 // let the service worker settle on first load

/**
 * Fires local reminders (due/overdue tasks, near-harvest batches) while the app
 * is open. De-duplication lives in lib/notifications, so this can run freely on
 * mount, on an interval, and whenever the tab becomes visible.
 *
 * Note: client-side only — reminders show while the PWA is open/foreground, not
 * when fully closed. Closed-app delivery needs Web Push + a backend (not wired).
 */
export function useNotificationScheduler(tasks: Task[], plots: Plot[]) {
  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false

    const run = () => {
      if (!cancelled) void runScheduledNotifications(tasks, plots)
    }

    const initial = window.setTimeout(run, INITIAL_DELAY_MS)
    const interval = window.setInterval(run, CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") run()
    }
    document.addEventListener("visibilitychange", onVisible)
    // Fired by Settings when the user toggles notifications on.
    window.addEventListener("durian:notifications-changed", run)

    return () => {
      cancelled = true
      window.clearTimeout(initial)
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("durian:notifications-changed", run)
    }
  }, [tasks, plots])
}
