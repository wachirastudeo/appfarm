"use client"

import { useState, useEffect } from "react"
import { Chrome, Compass, X, AlertTriangle, ExternalLink } from "lucide-react"

export default function InAppBrowserBanner() {
  const [isInApp, setIsInApp] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera
    
    // Detect FBAN, FBAV (Facebook/Messenger), Instagram, LINE, WeChat, or general in-app
    const isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua)
    const isInstagram = /Instagram/i.test(ua)
    const isLine = /Line/i.test(ua)
    const isMobileInApp = isFacebook || isInstagram || isLine
    const isAndroidDevice = /android/i.test(ua)
    const isIosDevice = /iphone|ipad|ipod/i.test(ua)

    setIsInApp(isMobileInApp)
    setIsIos(isIosDevice)
    setIsAndroid(isAndroidDevice)

    // Trigger automatic redirect to external browser on mount
    if (isMobileInApp) {
      const currentUrl = window.location.href
      const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, "")
      
      if (isAndroidDevice) {
        const fallbackUrl = encodeURIComponent(currentUrl)
        const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`
        window.location.replace(intentUrl)
      } else if (isIosDevice) {
        // Attempt redirecting to Chrome on iOS
        window.location.replace(`googlechromes://${urlWithoutProtocol}`)
      }
    }
  }, [])

  if (!isInApp || !isVisible) return null

  const handleOpenAndroidChrome = () => {
    const currentUrl = window.location.href
    const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, "")
    const fallbackUrl = encodeURIComponent(currentUrl)
    // Try opening Google Chrome first using intent, fallback to default browser if Chrome is missing
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`
    window.location.href = intentUrl
  }

  const handleOpenIosChrome = () => {
    const currentUrl = window.location.href
    const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, "")
    // Try opening Google Chrome on iOS
    window.location.href = `googlechromes://${urlWithoutProtocol}`
  }

  return (
    <div className="w-full bg-[#FFFBEB] dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/30 p-4 transition-all duration-300 animate-in slide-in-from-top-4 duration-500">
      <div className="mx-auto max-w-7xl flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-300">
              เปิดผ่านแอปโซเชียลมีเดีย (In-App Browser)
            </h4>
            <p className="mt-1 text-xs font-semibold text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
              ฟังก์ชันการใช้งานบางอย่าง (เช่น การเข้าสู่ระบบด้วย Google หรือการบันทึกรูปภาพ) อาจทำงานไม่สมบูรณ์บนเบราว์เซอร์ของแอปนี้ แนะนำให้เปิดด้วยเบราว์เซอร์ปกติของเครื่องเพื่อประสิทธิภาพที่ดีที่สุด
            </p>

            <div className="mt-3 flex flex-wrap gap-2.5 items-center">
              {isAndroid && (
                <button
                  onClick={handleOpenAndroidChrome}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#146B3E] hover:bg-[#0F5A34] text-white px-3.5 py-1.5 text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Chrome size={14} />
                  เปิดด้วย Google Chrome
                  <ExternalLink size={12} className="opacity-80" />
                </button>
              )}

              {isIos && (
                <>
                  <button
                    onClick={handleOpenIosChrome}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#146B3E] hover:bg-[#0F5A34] text-white px-3.5 py-1.5 text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Chrome size={14} />
                    เปิดด้วย Google Chrome (ถ้ามี)
                    <ExternalLink size={12} className="opacity-80" />
                  </button>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400/90 py-1 bg-amber-100/50 dark:bg-amber-950/20 px-2.5 rounded-xl border border-amber-200/30">
                    <Compass size={13} className="shrink-0" />
                    <span>หากไม่มี Chrome: แตะที่ปุ่มเมนู <b className="text-sm font-black leading-none">⋯</b> หรือปุ่มแชร์ แล้วเลือก <b>&quot;เปิดในเบราว์เซอร์ภายนอก&quot;</b> หรือ <b>&quot;เปิดใน Safari&quot;</b></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="shrink-0 text-amber-800/60 hover:text-amber-900 dark:text-amber-400/60 dark:hover:text-amber-300 p-1 rounded-lg hover:bg-amber-100/40 dark:hover:bg-amber-950/40 transition-colors"
          aria-label="ปิดแจ้งเตือน"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
