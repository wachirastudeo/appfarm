"use client"

import { useState } from "react"
import { Download, X, Plus, Sparkles, Smartphone } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  isIos: boolean
  canInstallDirectly?: boolean
  onInstall?: () => Promise<void>
}

export default function PwaInstallModal({ isOpen, onClose, isIos, canInstallDirectly = false, onInstall }: Props) {
  const [installing, setInstalling] = useState(false)

  if (!isOpen) return null

  const handleInstall = async () => {
    if (!onInstall || installing) return
    setInstalling(true)
    try {
      await onInstall()
      onClose()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F1F17] border border-emerald-100 dark:border-emerald-950/60 rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Decorative background element */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-xl dark:bg-emerald-500/5" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone size={20} />
            </span>
            <div>
              <h3 className="text-base font-black text-foreground">ติดตั้งแอปพลิเคชัน</h3>
              <p className="text-xs font-bold text-muted-foreground">ติดตั้งบนมือถือหรือคอมพิวเตอร์เพื่อใช้งานสะดวกขึ้น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isIos ? (
            // iOS Instructions
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#146B3E] dark:text-[#72C08A] bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
                ระบบตรวจพบว่าคุณใช้ iPhone/iPad กรุณาทำตามขั้นตอนด้านล่างนี้:
              </p>
              
              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
                    1
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    แตะปุ่ม <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md font-black text-primary border border-border/80"><SafariShareIcon className="h-3.5 w-3.5 text-[#007AFF]" /> แชร์ (Share)</span> ที่แถบด้านล่างหรือด้านบนของ Safari
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
                    2
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    เลื่อนลงมาแล้วแตะเลือกเมนู <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md font-black text-primary border border-border/80"><Plus size={13} /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
                    3
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    แตะคำว่า <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-black">เพิ่ม (Add)</span> ที่มุมขวาบนของหน้าจอเพื่อเสร็จสิ้นขั้นตอน
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Browser install instructions
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#146B3E] dark:text-[#72C08A] bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
                {canInstallDirectly ? "เบราว์เซอร์นี้ติดตั้งได้ทันที:" : "วิธีติดตั้งบน Chrome, Edge หรือ Android:"}
              </p>

              {canInstallDirectly ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#146B3E] px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-[#0F5A34] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download size={16} />
                  {installing ? "กำลังเปิดหน้าติดตั้ง..." : "ติดตั้งทันที"}
                </button>
              ) : (
                <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
                    1
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    แตะหรือคลิกเมนู <span className="bg-muted px-2 py-0.5 rounded-md font-black border border-border/80">จุด 3 จุด (⋮)</span> ของเบราว์เซอร์
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
                    2
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    เลือกเมนู <span className="bg-muted px-2 py-0.5 rounded-md font-black border border-border/80">ติดตั้งแอป (Install App)</span> หรือ <span className="bg-muted px-2 py-0.5 rounded-md font-black border border-border/80">เพิ่มไปยังหน้าจอหลัก (Add to Home screen)</span>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Benefits Info */}
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 p-3.5 border border-amber-500/15">
            <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
              <Sparkles size={14} />
            </span>
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 leading-normal">
              เมื่อติดตั้งแล้ว คุณจะเปิดใช้งานได้เร็วขึ้นจากไอคอนบนหน้าจอมือถือหรือคอมพิวเตอร์ เหมือนเป็นแอปหนึ่งในเครื่อง
            </p>
          </div>

          {!canInstallDirectly && (
            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 bg-[#146B3E] hover:bg-[#0F5A34] text-white rounded-xl text-xs font-black shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              เข้าใจแล้ว
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// A beautiful custom Safari Share Icon component
function SafariShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5" y="9" width="14" height="11" rx="2" />
      <path d="M12 12V3" />
      <path d="M9 6l3-3 3 3" />
    </svg>
  )
}
