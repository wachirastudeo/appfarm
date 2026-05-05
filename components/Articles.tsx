"use client"
import { useState, useMemo } from "react"
import { BookOpen, Clock, Search, X } from "lucide-react"

const ARTICLES = [
  { id: 1, title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", readTime: "5 นาที", color: "from-emerald-400 to-teal-600", content: "ระยะเตรียมทำใบเป็นช่วงสำคัญที่ต้องเพิ่มการให้น้ำให้สม่ำเสมอ เพื่อให้ใบออกสวยงามและสม่ำเสมอ การให้น้ำแบบเคาะหรือหยดน้ำ 2-3 ครั้งต่อสัปดาห์จะช่วยให้พืชมีความชื้นเพียงพอ" },
  { id: 2, title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", readTime: "8 นาที", color: "from-amber-400 to-orange-500", content: "โรคไฟทอปธอร่าเป็นโรคร้ายแรงที่อาจทำให้สูญเสียผลผลิตได้ 50-80% วิธีป้องกันคือการใช้ปุ๋ยสมดุล เพิ่มการระบายอากาศ และใช้สารเคมีป้องกันอย่างถูกต้องตามคำแนะนำของเกษตรศาสตร์" },
  { id: 3, title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", readTime: "3 นาที", color: "from-blue-400 to-indigo-600", content: "ราคาทุเรียนปี 2026 คาดว่าจะสูงขึ้นจากปีที่แล้ว เนื่องจากอุปสงค์จากตลาดเอเชียและจีนที่เพิ่มขึ้น ราคาประมาณ 100-150 บาทต่อกิโลกรัมสำหรับคุณภาพเกรด A" },
  { id: 4, title: "วิธีสังเกตดอกทุเรียนระยะไข่ปลา", category: "การสังเกต", readTime: "4 นาที", color: "from-pink-400 to-rose-600", content: "ระยะไข่ปลาเป็นช่วงที่ดอกเข้าชิดกันเหมือนไข่ปลา ลักษณะเพศเริ่มแตกต่างชัดเจน ควรเน้นการให้น้ำและปุ๋ยให้สม่ำเสมอในช่วงนี้" },
  { id: 5, title: "ปุ๋ยสูตรไหนเหมาะกับระยะขยายขนาดผล", category: "การให้ปุ๋ย", readTime: "6 นาที", color: "from-purple-400 to-fuchsia-600", content: "ในระยะขยายขนาดผล ควรใช้ปุ๋ยที่มีแคลเซียมและโพแทสเซียมสูง เช่น NPK 5:10:20 หรือสูตรเฉพาะสำหรับผลไม้ให้ 2-3 ครั้งต่อเดือน" },
  { id: 6, title: "การตัดแต่งกิ่งเตรียมพร้อมสำหรับฤดูกาลใหม่", category: "การดูแลรักษา", readTime: "7 นาที", color: "from-cyan-400 to-blue-500", content: "การตัดแต่งกิ่งช่วยกระตุ้นการออกใบและดอกใหม่ ตัดกิ่งที่อ่อนแอหรือเก่า และปล่อยให้พืชมีรูปทรงสวยงาม ลักษณะปิรามิด" }
]

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<typeof ARTICLES[0] | null>(null)

  const filteredArticles = useMemo(() => {
    if (!searchTerm) return ARTICLES
    const term = searchTerm.toLowerCase()
    return ARTICLES.filter(article => 
      article.title.toLowerCase().includes(term) || 
      article.category.toLowerCase().includes(term)
    )
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground flex items-center gap-2">
          <BookOpen className="text-primary" /> คลังบทความ
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="ค้นหาบทความ ความรู้การเกษตร..." 
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
        />
      </div>

      {selectedArticle ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[10px] text-primary font-bold mb-2 uppercase tracking-wider">{selectedArticle.category}</p>
                <h2 className="text-2xl font-black text-foreground">{selectedArticle.title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium mt-2">
                  <Clock size={14} /> {selectedArticle.readTime}
                </p>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={24} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-6">
              <div className={`w-full h-48 bg-gradient-to-br ${selectedArticle.color} rounded-2xl mb-6 flex items-center justify-center`}>
                <BookOpen size={64} className="text-white/40" />
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{selectedArticle.content}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen size={48} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">ไม่พบบทความที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          filteredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="flex bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/40 group hover:-translate-y-1 text-left"
            >
              <div className="w-28 sm:w-36 bg-muted relative shrink-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${article.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen size={28} className="text-white/60 group-hover:text-white transition-colors group-hover:scale-110 duration-300" />
                </div>
              </div>
              <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                <p className="text-[10px] text-primary font-bold mb-1.5 uppercase tracking-wider">{article.category}</p>
                <h4 className="font-bold text-[15px] text-foreground line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">{article.title}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mt-auto">
                  <Clock size={12} /> {article.readTime}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
