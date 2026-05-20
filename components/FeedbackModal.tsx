"use client"
import { useState } from "react"
import { X, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อและข้อความที่ต้องการส่ง",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    // Simulate network delay
    setTimeout(() => {
      try {
        const stored = localStorage.getItem("appfarm_feedback")
        const currentFeedbacks = stored ? JSON.parse(stored) : []
        const newFeedback = {
          id: `fb-${Date.now()}`,
          name: name.trim(),
          contact: contact.trim(),
          message: message.trim(),
          date: new Date().toISOString()
        }
        localStorage.setItem("appfarm_feedback", JSON.stringify([newFeedback, ...currentFeedbacks]))

        toast({
          title: "ส่งข้อมูลสำเร็จ",
          description: "ส่งข้อความ/ข้อเสนอแนะของคุณไปยังผู้พัฒนาแล้ว ขอบคุณครับ/ค่ะ!",
        })

        // Clear fields and close
        setName("")
        setContact("")
        setMessage("")
        onClose()
      } catch (err) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-[2rem] border border-[#B9DCC8]/40 dark:border-[#31533D]/45 bg-white dark:bg-[#0F1F17] shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-6 sm:p-8 w-full">
          {/* Modal Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F3EC] dark:bg-[#1D3A29] text-[#146B3E] dark:text-[#72C08A]">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-black text-foreground">ติดต่อผู้พัฒนา / ส่งข้อมูล</h3>
            <p className="mt-1 text-xs font-semibold text-muted-foreground leading-relaxed">
              มีข้อสงสัย ข้อเสนอแนะ หรือรายงานปัญหา? ส่งหาพวกเรา Wachira Studio ได้เลยครับ
            </p>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-black text-[#527060] dark:text-[#B8D1C0] uppercase tracking-wider">ชื่อของคุณ *</span>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full rounded-xl border border-[#B9DCC8]/65 dark:border-[#31533D]/65 bg-background px-3 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black text-[#527060] dark:text-[#B8D1C0] uppercase tracking-wider">ช่องทางติดต่อกลับ</span>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="เบอร์โทรศัพท์, LINE ID หรืออีเมล"
                className="w-full rounded-xl border border-[#B9DCC8]/65 dark:border-[#31533D]/65 bg-background px-3 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-black text-[#527060] dark:text-[#B8D1C0] uppercase tracking-wider">ข้อความ / ข้อเสนอแนะ *</span>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                className="w-full resize-none rounded-xl border border-[#B9DCC8]/65 dark:border-[#31533D]/65 bg-background px-3 py-2.5 text-sm font-semibold leading-relaxed outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#146B3E] dark:bg-[#72C08A] hover:bg-[#0f522f] dark:hover:bg-[#5bb076] py-3 text-sm font-bold text-white dark:text-[#0a1410] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>ส่งข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
