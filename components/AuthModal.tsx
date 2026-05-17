"use client"
import { useState } from "react"
import type { AppUser } from "@/lib/store"
import { X, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: AppUser) => void
  authenticateUser: (email: string, password: string) => Promise<AppUser | null>
  addUser: (user: Omit<AppUser, "id" | "createdAt" | "passwordHash" | "password"> & { password: string }) => Promise<AppUser | null>
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, authenticateUser, addUser }: Props) {
  const [mode, setMode] = useState<"choose" | "email">("choose")
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSocialLogin = (provider: "google" | "line") => {
    setLoading(provider)
    setError("")
    setTimeout(() => {
      onLoginSuccess({
        id: `social-${provider}`,
        name: provider === "google" ? "ชาวสวน Google" : "ชาวสวน LINE",
        email: `demo@${provider}.com`,
        passwordHash: "",
        role: "user",
        status: "active",
        provider,
        createdAt: new Date().toISOString(),
      })
      setLoading(null)
      onClose()
    }, 1200)
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return }
    if (isSignUp && !name) { setError("กรุณากรอกชื่อของคุณ"); return }
    setLoading("email")
    setTimeout(async () => {
      const user = isSignUp
        ? addUser({ name, email, password, role: "user", status: "active", provider: "email" })
        : authenticateUser(email, password)
      const result = await user
      if (!result) {
        setError(isSignUp ? "อีเมลนี้มีผู้ใช้งานแล้ว" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        setLoading(null)
        return
      }
      onLoginSuccess(result)
      setLoading(null)
      onClose()
    }, 1000)
  }

  const reset = () => { setMode("choose"); setError(""); setEmail(""); setPassword(""); setName("") }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-emerald-950/10 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[560px] overflow-hidden bg-[#0B3B25] p-8 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(93,209,132,0.38),transparent_18rem),linear-gradient(145deg,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="mb-10 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-bold ring-1 ring-white/20">
                <Sparkles size={16} />
                Smart Orchard OS
              </div>
              <h2 className="max-w-sm text-4xl font-black leading-tight">จัดการสวนทุเรียนแบบทีมเดียวจบ</h2>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/72">
                เข้าสู่ระบบเพื่อดูข้อมูลสวน บทความ งานประจำวัน และหลังบ้านสำหรับผู้ดูแล
              </p>
            </div>
            <div className="grid gap-3">
              {[
                "Admin: admin@appfarm.test / admin1234",
                "User: user@appfarm.test / user1234",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/12 p-4 ring-1 ring-white/14">
                  <ShieldCheck size={18} className="text-emerald-200" />
                  <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={16} />
        </button>

        <div className="px-6 py-8 sm:px-8 md:py-10">
          <div className="mb-7">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-gray-900">Smart Orchard</span>
            </div>
            <h2 className="mt-5 text-2xl font-black text-gray-950">
              {mode === "email"
                ? (isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ")
                : "ยินดีต้อนรับ"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {mode === "email"
                ? (isSignUp ? "กรอกข้อมูลเพื่อเริ่มต้น" : "กรอกอีเมลและรหัสผ่าน")
                : "เลือกวิธีเข้าสู่ระบบ"}
            </p>
          </div>

          {mode === "choose" ? (
            <div className="space-y-2.5">
              {/* Google */}
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
              >
                {loading === "google" ? (
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className="text-sm font-semibold text-gray-700">
                  {loading === "google" ? "กำลังเชื่อมต่อ..." : "Google"}
                </span>
              </button>

              {/* LINE */}
              <button
                onClick={() => handleSocialLogin("line")}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
              >
                {loading === "line" ? (
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-[#06C755] rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                )}
                <span className="text-sm font-semibold text-gray-700">
                  {loading === "line" ? "กำลังเชื่อมต่อ..." : "LINE"}
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium">หรือ</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Email */}
              <button
                onClick={() => setMode("email")}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
              >
                <Mail size={18} className="text-gray-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-700">ใช้อีเมล</span>
              </button>

              <p className="text-center text-[11px] text-gray-300 pt-1">
                การเข้าสู่ระบบถือว่ายอมรับนโยบายความเป็นส่วนตัว
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 -mt-2 mb-1"
              >
                ← กลับ
              </button>

              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">ชื่อ</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ชื่อของคุณ"
                    className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading === "email"}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading === "email" && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isSignUp ? "สร้างบัญชี" : "เข้าสู่ระบบ"}
              </button>

              <button
                type="button"
                onClick={() => { setIsSignUp(v => !v); setError("") }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
              >
                {isSignUp ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครฟรี"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
