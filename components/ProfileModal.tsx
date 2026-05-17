"use client"
import { useState } from "react"
import type { AppUser } from "@/lib/store"
import { X, User, LogOut, ChevronRight, Shield, Bell, Leaf, Camera } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  user: AppUser | null
  onLogout: () => void
  onLogin: () => void
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  line: "LINE",
  email: "อีเมล",
}

const PROVIDER_COLOR: Record<string, string> = {
  google: "bg-blue-100 text-blue-700",
  line: "bg-green-100 text-green-700",
  email: "bg-orange-100 text-orange-700",
}

export default function ProfileModal({ isOpen, onClose, user, onLogout, onLogin }: Props) {
  const [editName, setEditName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name ?? "")

  if (!isOpen) return null

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet / Modal */}
      <div className="relative w-full max-w-sm mx-0 sm:mx-4 bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Handle for mobile sheet */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors">
          <X size={18} className="text-muted-foreground" />
        </button>

        {user ? (
          /* Logged in view */
          <div className="px-6 pt-4 pb-8 space-y-5">
            {/* Avatar + info */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{initials}</span>
                  </div>
                )}
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
                  <Camera size={11} className="text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                {editName ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && setEditName(false)}
                      className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button onClick={() => setEditName(false)} className="text-xs text-primary font-semibold">บันทึก</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditName(true); setNameInput(user.name) }} className="text-left group">
                    <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                    <p className="text-xs text-muted-foreground group-hover:underline">แก้ไขชื่อ</p>
                  </button>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${PROVIDER_COLOR[user.provider] ?? "bg-muted text-muted-foreground"}`}>
                  เข้าสู่ระบบด้วย {PROVIDER_LABEL[user.provider] ?? user.provider}
                </span>
                {user.role === "admin" && (
                  <span className="ml-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Menu items */}
            <div className="space-y-1">
              {[
                { icon: Leaf, label: "ข้อมูลสวนของฉัน", sub: "แปลง · ต้นไม้ · การเงิน" },
                { icon: Bell, label: "การแจ้งเตือน", sub: "ตั้งค่าการแจ้งเตือน" },
                { icon: Shield, label: "ความปลอดภัย", sub: "รหัสผ่าน · อุปกรณ์" },
              ].map(item => (
                <button key={item.label} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={() => { onLogout(); onClose() }}
              className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              ออกจากระบบ
            </button>
          </div>
        ) : (
          /* Not logged in */
          <div className="px-6 pt-4 pb-8 space-y-5">
            <div className="flex items-center gap-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <User size={28} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">ยังไม่ได้เข้าสู่ระบบ</h2>
                <p className="text-xs text-muted-foreground mt-0.5">เข้าสู่ระบบเพื่อซิงค์ข้อมูลสวน</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              {[
                "ซิงค์ข้อมูลสวนทุกอุปกรณ์",
                "สำรองข้อมูลอัตโนมัติ",
                "แชร์ข้อมูลกับทีมงาน",
              ].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <p className="text-xs text-foreground font-medium">{b}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => { onClose(); onLogin() }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            >
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
            <p className="text-center text-xs text-muted-foreground">ฟรี ไม่มีค่าใช้จ่าย</p>
          </div>
        )}
      </div>
    </div>
  )
}
