"use client"
import { useEffect } from "react"

export default function ClearLocalPage() {
  useEffect(() => {
    const clearStoredData = async () => {
      const prefix = "durian_orchard_data"

      try {
        const keysToRemove = Object.keys(localStorage).filter((key) => key === "farm_location_guest" || key.startsWith(prefix))
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key)
        })
        sessionStorage.clear()
      } catch (e) {
        // ignore
      }

      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        }
      } catch (e) {
        // ignore
      }

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map((registration) => registration.unregister()))
        }
      } catch (e) {
        // ignore
      }
    }

    clearStoredData()

    const t = setTimeout(() => {
      window.location.href = `/?refresh=${Date.now()}`
    }, 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="rounded-2xl border border-[#B9DCC8] bg-white p-6 text-center shadow">
        <h1 className="mb-2 text-lg font-black">ล้างข้อมูล local เรียบร้อย</h1>
        <p className="text-sm text-muted-foreground">จะกลับไปที่หน้าแรกในไม่กี่วินาที...</p>
        <p className="mt-3 text-xs text-[#527060]">ถ้าระบบยังเหมือนเดิม ให้รีเฟรชด้วยตนเอง</p>
      </div>
    </div>
  )
}
