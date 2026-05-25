"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { AppUser } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { validateEmail, validateText } from "@/lib/form-validation"
import { X, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, Sparkles } from "lucide-react"

const AUTH_SLIDES = [
  {
    image: "/images/durian-hero-new.png",
    alt: "สวนทุเรียนยามเช้า",
    title: "เห็นภาพรวมสวนทันที",
    description: "ติดตามแปลง งาน และสุขภาพต้นในที่เดียว",
  },
  {
    image: "/images/article-watering.png",
    alt: "ระบบน้ำในสวนทุเรียน",
    title: "วางแผนงานประจำวัน",
    description: "จัดคิวรดน้ำ ใส่ปุ๋ย และบันทึกกิจกรรมสวน",
  },
  {
    image: "/images/article-market.png",
    alt: "ตลาดทุเรียน",
    title: "อ่านความรู้ก่อนตัดสินใจ",
    description: "รวมบทความเรื่องโรค น้ำ ปุ๋ย และตลาดทุเรียน",
  },
]

const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod/i

function isMobileBrowser() {
  return MOBILE_USER_AGENT_PATTERN.test(window.navigator.userAgent)
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: AppUser) => void
  authenticateUser: (email: string, password: string) => Promise<AppUser | null>
  addUser: (user: Omit<AppUser, "id" | "createdAt" | "passwordHash" | "password"> & { password: string }) => Promise<AppUser | null>
  resetPassword: (email: string, password: string) => Promise<AppUser | null>
  initialError?: string
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, authenticateUser, addUser, resetPassword, initialError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"choose" | "email" | "forgot">("choose")
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [name, setName] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const emailInputId = "auth-email"
  const passwordInputId = "auth-password"
  const signupNameInputId = "auth-signup-name"
  const resetEmailInputId = "auth-reset-email"
  const resetPasswordInputId = "auth-reset-password"

  useEscapeToClose({ enabled: isOpen, onEscape: onClose, containerRef })

  useEffect(() => {
    if (isOpen && initialError) {
      setError(initialError)
      setSuccess("")
      setMode("choose")
    }
  }, [initialError, isOpen])

  if (!isOpen) return null

  const handleOAuthLogin = async (provider: "google" | "custom:line") => {
    const providerName = provider === "custom:line" ? "LINE" : "Google"
    const shouldOpenLineFromMobile = provider === "custom:line" && isMobileBrowser()
    setError("")
    setSuccess("")
    setLoading(provider)
    try {
      let supabase
      try {
        supabase = createClient()
      } catch {
        setError("ยังไม่ได้ตั้งค่า Supabase ใน .env.local (URL + publishable key) จึงใช้ LINE/Google บน localhost ไม่ได้")
        setLoading(null)
        return
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === "custom:line" ? "profile openid" : undefined,
          skipBrowserRedirect: shouldOpenLineFromMobile,
        },
      })
      if (error) {
        setError(error.message || `ไม่สามารถเข้าสู่ระบบด้วย ${providerName} ได้`)
        setLoading(null)
        return
      }
      if (shouldOpenLineFromMobile) {
        if (!data.url) {
          setError("ไม่พบ URL สำหรับเปิด LINE Login")
          setLoading(null)
          return
        }
        window.location.assign(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `ไม่สามารถเข้าสู่ระบบด้วย ${providerName} ได้`)
      setLoading(null)
    }
  }

  const handleUnavailablePasswordReset = () => {
    setError("การรีเซ็ตรหัสผ่านอัตโนมัติยังไม่พร้อมในโหมดนี้ กรุณาติดต่อผู้ดูแลระบบ")
    setSuccess("")
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const checkedEmail = validateEmail(email)
    const checkedPassword = validateText("รหัสผ่าน", password, { required: true, maxLength: 128 })
    const checkedName = validateText("ชื่อ", name, { required: isSignUp, maxLength: 120 })
    if (!checkedEmail.ok || !checkedPassword.ok || !checkedName.ok) {
      setError(!checkedEmail.ok ? checkedEmail.message : !checkedPassword.ok ? checkedPassword.message : checkedName.message)
      return
    }
    setLoading("email")
    setTimeout(async () => {
      const user = isSignUp
        ? addUser({ name: checkedName.value, email: checkedEmail.value, password: checkedPassword.value, role: "user", status: "active", provider: "email" })
        : authenticateUser(checkedEmail.value, checkedPassword.value)
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

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const checkedEmail = validateEmail(email)
    const checkedPassword = validateText("รหัสผ่านใหม่", newPassword, { required: true, maxLength: 128 })
    if (!checkedEmail.ok || !checkedPassword.ok) {
      setError(!checkedEmail.ok ? checkedEmail.message : checkedPassword.message)
      return
    }
    setLoading("reset")
    setTimeout(async () => {
      const result = await resetPassword(checkedEmail.value, checkedPassword.value)
      if (!result) {
        setError("ไม่พบบัญชีอีเมลนี้ในระบบ")
        setLoading(null)
        return
      }
      setPassword(checkedPassword.value)
      setNewPassword("")
      setIsSignUp(false)
      setMode("email")
      setSuccess("เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วยรหัสใหม่")
      setLoading(null)
    }, 700)
  }

  const openEmailMode = (signUp: boolean) => {
    setIsSignUp(signUp)
    setMode("email")
    setError("")
    setSuccess("")
  }

  const reset = () => { setMode("choose"); setError(""); setSuccess(""); setEmail(""); setPassword(""); setNewPassword(""); setName(""); setIsSignUp(false) }

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <style>{`
        @keyframes authSlideFade {
          0%, 27% { opacity: 1; transform: scale(1); }
          33%, 94% { opacity: 0; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        .auth-slide {
          animation: authSlideFade 12s ease-in-out infinite;
        }
      `}</style>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative grid w-full max-w-4xl max-h-[92dvh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-2xl ring-1 ring-emerald-950/10 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[520px] overflow-hidden bg-[#0B3B25] p-8 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(93,209,132,0.38),transparent_18rem),linear-gradient(145deg,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="relative flex h-full flex-col justify-center gap-7">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-bold ring-1 ring-white/20">
                <Sparkles size={16} />
                Durian Flow OS
              </div>
              <h2 className="max-w-sm text-4xl font-black leading-tight">จัดการสวนทุเรียนแบบทีมเดียวจบ</h2>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/72">
                เข้าสู่ระบบเพื่อดูข้อมูลสวน บทความ งานประจำวัน และหลังบ้านสำหรับผู้ดูแล
              </p>
            </div>
            <div aria-hidden="true" className="relative h-[min(34dvh,18rem)] min-h-56 overflow-hidden rounded-[1.5rem] bg-white/10 shadow-2xl shadow-black/20 ring-1 ring-white/16">
              {AUTH_SLIDES.map((slide, index) => (
                <div
                  key={slide.title}
                  className="auth-slide absolute inset-0 opacity-0"
                  style={{ animationDelay: `${index * 4}s` }}
                >
                  <Image src={slide.image} alt="" fill sizes="(min-width: 768px) 28rem, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-lg font-black leading-tight">{slide.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/76">{slide.description}</p>
                  </div>
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

        <div className="px-5 py-7 sm:px-8 md:py-10">
          <div className="mb-7 pt-6 text-center md:pt-0">
            <div className="mb-1 flex items-center justify-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-gray-900">Durian Flow</span>
            </div>
            <h2 className="mt-5 text-2xl font-black text-gray-950">
              {mode === "forgot"
                ? "ตั้งรหัสผ่านใหม่"
                : mode === "email"
                  ? (isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ")
                  : "ยินดีต้อนรับ"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {mode === "forgot"
                ? "กรอกอีเมลบัญชีและรหัสผ่านใหม่"
                : mode === "email"
                  ? (isSignUp ? "กรอกข้อมูลเพื่อเริ่มต้น" : "กรอกอีเมลและรหัสผ่าน")
                  : "เลือกวิธีเข้าสู่ระบบ"}
            </p>
          </div>

          {mode === "choose" ? (
            <div className="space-y-2.5">
              {/* Google */}
              <button
                onClick={() => handleOAuthLogin("google")}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 rounded-xl px-4 py-3.5 transition-all active:scale-[0.99] shadow-sm"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-bold text-gray-800">
                  {loading === "google" ? "กำลังไปที่ Google..." : "เข้าสู่ระบบด้วย Google"}
                </span>
              </button>

              {/* LINE */}
              <button
                onClick={() => handleOAuthLogin("custom:line")}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-[#06C755] hover:bg-green-50 disabled:opacity-50 rounded-xl px-4 py-3.5 transition-all active:scale-[0.99] shadow-sm"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span className="text-sm font-bold text-gray-800">
                  {loading === "custom:line" ? "กำลังไปที่ LINE..." : "เข้าสู่ระบบด้วย LINE"}
                </span>
              </button>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
                  <p className="whitespace-pre-wrap text-xs leading-5 text-red-500">{error}</p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium">หรือ</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Email */}
              <button
                onClick={() => openEmailMode(false)}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl px-4 py-3.5 transition-all active:scale-[0.99] shadow-sm"
              >
                <Mail size={18} className="text-gray-500 shrink-0" />
                <span className="text-sm font-bold text-gray-800">เข้าสู่ระบบด้วยอีเมล</span>
              </button>

              <button
                onClick={() => openEmailMode(true)}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99]"
              >
                <Mail size={18} className="shrink-0" />
                <span className="text-sm font-semibold">สมัครด้วยอีเมล</span>
              </button>

              <p className="text-center text-[11px] text-gray-300 pt-1">
                การเข้าสู่ระบบถือว่ายอมรับนโยบายความเป็นส่วนตัว
              </p>
            </div>
          ) : mode === "forgot" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("email"); setError(""); setSuccess("") }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 -mt-2 mb-1"
              >
                ← กลับ
              </button>

              <div className="space-y-1.5">
                <label htmlFor={resetEmailInputId} className="text-xs font-semibold text-gray-500">อีเมล</label>
                <input
                  id={resetEmailInputId}
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={resetPasswordInputId} className="text-xs font-semibold text-gray-500">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    id={resetPasswordInputId}
                    name="new-password"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
                  <p className="whitespace-pre-wrap text-xs leading-5 text-red-500">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading === "reset"}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading === "reset" && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                เปลี่ยนรหัสผ่าน
              </button>
            </form>
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
                  <label htmlFor={signupNameInputId} className="text-xs font-semibold text-gray-500">ชื่อ</label>
                  <input
                    id={signupNameInputId}
                    name="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ชื่อของคุณ"
                    autoComplete="name"
                    className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor={emailInputId} className="text-xs font-semibold text-gray-500">อีเมล</label>
                <input
                  id={emailInputId}
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={passwordInputId} className="text-xs font-semibold text-gray-500">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    id={passwordInputId}
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
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

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />
                  <p className="whitespace-pre-wrap text-xs leading-5 text-red-500">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-600">{success}</p>
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
                onClick={() => { setIsSignUp(v => !v); setError(""); setSuccess("") }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
              >
                {isSignUp ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครฟรี"}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleUnavailablePasswordReset}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
                >
                  ลืมรหัสผ่าน?
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
