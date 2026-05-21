"use client"
import { useEffect } from "react"

export default function ClearLocalPage() {
  useEffect(() => {
    try {
      // remove any keys starting with the storage base used for per-user data
      const prefix = "durian_orchard_data"
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key === "farm_location_guest" || key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      // ignore
    }

    // give user a moment to see message, then redirect home
    const t = setTimeout(() => {
      window.location.href = "/"
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
