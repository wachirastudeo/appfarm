"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Check, Copy, HeartHandshake, Mail, MessageSquare, Phone, X } from "lucide-react"
import { useEscapeToClose } from "@/hooks/useEscapeToClose"
import { useToast } from "@/hooks/use-toast"

interface Props {
  isOpen: boolean
  onClose: () => void
  onOpenContact: () => void
}

const SUPPORT_EMAIL = "wachirastudeo@gmail.com"
const SUPPORT_PHONE = "092-4151449"
const PROMPTPAY_QR_SRC = "/images/promptpay-qr.jpeg"

export default function SupportModal({ isOpen, onClose, onOpenContact }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrLoadError, setQrLoadError] = useState(false)
  const { toast } = useToast()

  useEscapeToClose({ enabled: isOpen, onEscape: onClose, containerRef })

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      toast({
        title: "คัดลอกอีเมลแล้ว",
        description: SUPPORT_EMAIL,
      })
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({
        title: "คัดลอกไม่สำเร็จ",
        description: "กรุณาคัดลอกอีเมลด้วยตนเอง",
        variant: "destructive",
      })
    }
  }

  const handleOpenContact = () => {
    onClose()
    onOpenContact()
  }

  return (
    <div ref={containerRef} data-escapable-layer="true" className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain p-3 py-4 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-[#B9DCC8]/40 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-[#31533D]/45 dark:bg-[#0F1F17]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
          aria-label="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F3EC] text-[#146B3E] dark:bg-[#1D3A29] dark:text-[#72C08A]">
              <HeartHandshake size={26} />
            </div>
            <h3 className="space-y-1 text-xl font-black text-foreground">
              <span className="block">เลี้ยงกาแฟ</span>
              <span className="block text-sm font-semibold leading-snug text-muted-foreground">สแกน QR พร้อมเพย์เพื่อช่วยค่าใช้งานและการพัฒนาเว็บ</span>
            </h3>
          </div>

          <div className="rounded-2xl border border-[#B9DCC8]/55 bg-gradient-to-br from-[#F7FBF8] to-[#EAF5EE] p-4 dark:border-[#31533D]/45 dark:from-[#13251B] dark:to-[#102118]">
            <div className="grid gap-4 sm:grid-cols-[210px_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto w-full max-w-[230px] rounded-2xl border border-[#D7E6DC] bg-white p-2 shadow-sm dark:border-[#31533D]/45 dark:bg-[#163222]">
                {qrLoadError ? (
                  <div className="flex aspect-[1007/1561] items-center justify-center rounded-xl border border-dashed border-[#B9DCC8] bg-[#F4F9F6] p-4 text-center text-xs font-semibold leading-relaxed text-muted-foreground dark:border-[#31533D] dark:bg-[#13251B]">
                    ยังไม่มีไฟล์ QR
                    <br />
                    วางรูปไว้ที่
                    <br />
                    `public/images/promptpay-qr.jpeg`
                  </div>
                ) : (
                  <Image
                    src={PROMPTPAY_QR_SRC}
                    alt="QR พร้อมเพย์สำหรับสนับสนุน Durian Flow"
                    width={1007}
                    height={1561}
                    className="h-auto max-h-[60vh] w-full rounded-xl object-contain"
                    onError={() => setQrLoadError(true)}
                  />
                )}
              </div>
              <div className="space-y-3 text-sm font-semibold leading-relaxed text-muted-foreground">
                <p className="font-black text-[#143422] dark:text-[#D3E8DA]">สแกนเลี้ยงกาแฟได้ทันที</p>
                <div className="space-y-2">
                  <p><span className="font-black text-[#146B3E] dark:text-[#72C08A]">ค่าโฮสต์</span> ช่วยให้เว็บออนไลน์ได้ต่อเนื่อง</p>
                  <p><span className="font-black text-[#146B3E] dark:text-[#72C08A]">ฟีเจอร์ใหม่</span> ช่วยต่อยอดเครื่องมือที่เกษตรกรใช้งานจริง</p>
                  <p><span className="font-black text-[#146B3E] dark:text-[#72C08A]">บทความความรู้</span> ช่วยให้มีเนื้อหาและคำแนะนำใหม่เพิ่มขึ้น</p>
                </div>
                <p className="text-xs">สแกนจากรูป QR ด้านซ้ายได้โดยตรง</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#B9DCC8]/55 bg-gradient-to-br from-[#F7FBF8] to-[#EAF5EE] p-4 dark:border-[#31533D]/45 dark:from-[#13251B] dark:to-[#102118]">
            <p className="text-xs font-black uppercase tracking-wider text-[#527060] dark:text-[#B8D1C0]">ช่องทางติดต่อสนับสนุนและลงโฆษณา</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[#B9DCC8]/70 bg-white px-3.5 py-2 text-left text-xs font-extrabold text-[#146B3E] transition-all hover:bg-[#E7F3EC] active:scale-[0.98] dark:border-[#31533D]/60 dark:bg-[#163222] dark:text-[#72C08A] dark:hover:bg-[#1C3B29]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="min-w-0 truncate">{SUPPORT_EMAIL}</span>
                <span className="shrink-0">{copied ? "คัดลอกแล้ว" : "คัดลอกอีเมล"}</span>
              </button>
              <a
                href={`tel:${SUPPORT_PHONE.replaceAll("-", "")}`}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[#B9DCC8]/70 bg-white px-3.5 py-2 text-xs font-extrabold text-[#146B3E] transition-all hover:bg-[#E7F3EC] active:scale-[0.98] dark:border-[#31533D]/60 dark:bg-[#163222] dark:text-[#72C08A] dark:hover:bg-[#1C3B29]"
              >
                <Phone size={14} />
                <span className="min-w-0 truncate">{SUPPORT_PHONE}</span>
                <span className="shrink-0">โทรเลย</span>
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenContact}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#146B3E] px-4 py-3 text-sm font-black text-white transition-all hover:bg-[#0F5A34] active:scale-[0.98] dark:bg-[#72C08A] dark:text-[#0B1B12] dark:hover:bg-[#60B979]"
            >
              <MessageSquare size={16} />
              ติดต่อสนับสนุนหรือลงโฆษณา
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("สนับสนุนหรือสอบถามลงโฆษณา Durian Flow")}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#C9DACD] bg-white px-4 py-3 text-sm font-black text-[#143422] transition-all hover:border-[#146B3E] hover:text-[#146B3E] active:scale-[0.98] dark:border-[#31533D] dark:bg-[#163222] dark:text-[#D3E8DA] dark:hover:border-[#72C08A] dark:hover:text-[#72C08A]"
            >
              <Mail size={16} />
              ส่งอีเมลติดต่อ
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
