"use client"
import { BookOpen, Clock, Search } from "lucide-react"

const ARTICLES = [
  { id: 1, title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", category: "การดูแลรักษา", readTime: "5 นาที", color: "from-emerald-400 to-teal-600" },
  { id: 2, title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", category: "โรคและแมลง", readTime: "8 นาที", color: "from-amber-400 to-orange-500" },
  { id: 3, title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", category: "การตลาด", readTime: "3 นาที", color: "from-blue-400 to-indigo-600" },
  { id: 4, title: "วิธีสังเกตดอกทุเรียนระยะไข่ปลา", category: "การสังเกต", readTime: "4 นาที", color: "from-pink-400 to-rose-600" },
  { id: 5, title: "ปุ๋ยสูตรไหนเหมาะกับระยะขยายขนาดผล", category: "การให้ปุ๋ย", readTime: "6 นาที", color: "from-purple-400 to-fuchsia-600" },
  { id: 6, title: "การตัดแต่งกิ่งเตรียมพร้อมสำหรับฤดูกาลใหม่", category: "การดูแลรักษา", readTime: "7 นาที", color: "from-cyan-400 to-blue-500" }
]

export default function Articles() {
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
          placeholder="ค้นหาบทความ ความรู้การเกษตร..." 
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ARTICLES.map(article => (
          <div key={article.id} className="flex bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/40 group hover:-translate-y-1">
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
          </div>
        ))}
      </div>
    </div>
  )
}
