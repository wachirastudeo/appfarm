"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/runtime-config"
import { validateText } from "@/lib/form-validation"
import { Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"

type Status = "checking" | "ready" | "invalid"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("checking")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("invalid")
      return
    }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "invalid")
    }).catch(() => setStatus("invalid"))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const checkedPassword = validateText("รหัสผ่านใหม่", password, { required: true, maxLength: 128 })
    if (!checkedPassword.ok) {
      setError(checkedPassword.message)
      return
    }
    if (password !== confirm) {
      setError("รหัสผ่านยืนยันไม่ตรงกัน")
      return
    }
    setLoading(true)
    void (async () => {
      try {
        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({ password: checkedPassword.value })
        if (updateError) {
          setError(updateError.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้")
          setLoading(false)
          return
        }
        setSuccess("ตั้งรหัสผ่านใหม่สำเร็จ กำลังพาไปหน้าหลัก...")
        setTimeout(() => router.replace("/"), 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถตั้งรหัสผ่านใหม่ได้")
        setLoading(false)
      }
    })()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl shadow-emerald-900/5 px-6 py-8 sm:px-8">
        <div className="mb-7 text-center">
          <div className="mb-1 flex items-center justify-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">Durian Flow</span>
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-950">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-gray-400 mt-0.5">กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
        </div>

        {status === "checking" && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
            กำลังตรวจสอบลิงก์...
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
              <p className="text-xs leading-5 text-red-500">
                ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99]"
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-semibold text-gray-500">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  id="new-password"
                  name="new-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-500">ยืนยันรหัสผ่านใหม่</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
                <p className="whitespace-pre-wrap text-xs leading-5 text-red-500">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                <ShieldCheck size={14} className="mt-0.5 text-emerald-500 shrink-0" />
                <p className="text-xs leading-5 text-emerald-600">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              บันทึกรหัสผ่านใหม่
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
