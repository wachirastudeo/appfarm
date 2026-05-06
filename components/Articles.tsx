"use client"
import { useState, useMemo } from "react"
import { BookOpen, Search, X, ArrowRight, Share2, Bookmark, ArrowLeft } from "lucide-react"

const ARTICLES = [
  { 
    id: 1, 
    title: "เทคนิคการให้น้ำทุเรียนช่วงเตรียมทำใบ", 
    category: "การดูแลรักษา", 
    image: "/images/articles/article_watering_1778037948644.png",
    content: "ระยะเตรียมทำใบเป็นช่วงสำคัญที่ต้องเพิ่มการให้น้ำให้สม่ำเสมอ เพื่อให้ใบออกสวยงามและสม่ำเสมอ การให้น้ำแบบเคาะหรือหยดน้ำ 2-3 ครั้งต่อสัปดาห์จะช่วยให้พืชมีความชื้นเพียงพอ\n\nการให้น้ำในช่วงนี้ควรเน้นที่ความชื้นของดินเป็นหลัก ไม่ควรปล่อยให้ดินแห้งแตกระแหง เพราะจะทำให้การแตกใบอ่อนไม่สม่ำเสมอ นอกจากนี้ควรมีการเสริมปุ๋ยทางใบร่วมด้วยเพื่อให้ใบมีความสมบูรณ์สูงสุด" 
  },
  { 
    id: 2, 
    title: "รับมือโรคไฟทอปธอร่า หน้าฝนนี้ต้องรอด", 
    category: "โรคและแมลง", 
    image: "/images/articles/article_disease_1778037967060.png",
    content: "โรคไฟทอปธอร่าเป็นโรคร้ายแรงที่อาจทำให้สูญเสียผลผลิตได้ 50-80% วิธีป้องกันคือการใช้ปุ๋ยสมดุล เพิ่มการระบายอากาศ และใช้สารเคมีป้องกันอย่างถูกต้อง\n\nหัวใจสำคัญคือการจัดการน้ำในสวนไม่ให้ท่วมขัง และการตรวจสอบแผลตามลำต้นอย่างสม่ำเสมอ หากพบแผลควรทำการถากเนื้อไม้ที่เสียออกและทาด้วยสารป้องกันเชื้อราทันที" 
  },
  { 
    id: 3, 
    title: "แนวโน้มราคาทุเรียนส่งออก ปี 2026", 
    category: "การตลาด", 
    image: "/images/articles/article_market_1778038017547.png",
    content: "ราคาทุเรียนปี 2026 คาดว่าจะสูงขึ้นจากปีที่แล้ว เนื่องจากอุปสงค์จากตลาดเอเชียและจีนที่เพิ่มขึ้น ราคาประมาณ 100-150 บาทต่อกิโลกรัมสำหรับคุณภาพเกรด A\n\nเกษตรกรควรเน้นการทำทุเรียนคุณภาพพรีเมียมและมีการรับรองมาตรฐาน GAP เพื่อให้ได้ราคาสูงสุดและเป็นที่ต้องการของตลาดส่งออก" 
  },
  { 
    id: 4, 
    title: "วิธีสังเกตดอกทุเรียนระยะไข่ปลา", 
    category: "การสังเกต", 
    image: "/images/articles/article_flowering_1778039300000_1778039688657.png",
    content: "ระยะไข่ปลาเป็นช่วงที่ดอกเข้าชิดกันเหมือนไข่ปลา ลักษณะเพศเริ่มแตกต่างชัดเจน ควรเน้นการให้น้ำและปุ๋ยให้สม่ำเสมอในช่วงนี้\n\nระวังอย่าให้น้ำมากเกินไปเพราะอาจทำให้ดอกหลุดร่วงได้ ควรให้น้ำในปริมาณที่พอเหมาะเพื่อให้ดอกพัฒนาไปสู่ระยะมะเขือพวงได้อย่างสมบูรณ์" 
  },
  { 
    id: 5, 
    title: "ปุ๋ยสูตรไหนเหมาะกับระยะขยายขนาดผล", 
    category: "การให้ปุ๋ย", 
    image: "/images/articles/article_fertilizer_1778039300000_1778039705364.png",
    content: "ในระยะขยายขนาดผล ควรใช้ปุ๋ยที่มีแคลเซียมและโพแทสเซียมสูง เช่น NPK 5:10:20 หรือสูตรเฉพาะสำหรับผลไม้ให้ 2-3 ครั้งต่อเดือน\n\nการใส่ปุ๋ยในช่วงนี้จะช่วยให้เนื้อทุเรียนมีคุณภาพดี รสชาติหวาน และมีน้ำหนักผลที่ได้มาตรฐาน" 
  },
  { 
    id: 6, 
    title: "การตัดแต่งกิ่งเตรียมพร้อมสำหรับฤดูกาลใหม่", 
    category: "การดูแลรักษา", 
    image: "/images/articles/article_pruning_1778039300000_1778039722927.png",
    content: "การตัดแต่งกิ่งช่วยกระตุ้นการออกใบและดอกใหม่ ตัดกิ่งที่อ่อนแอหรือเก่า และปล่อยให้พืชมีรูปทรงสวยงาม ลักษณะปิรามิด\n\nการตัดแต่งกิ่งที่ถูกต้องจะช่วยให้แสงแดดส่องถึงโคนต้น ลดการสะสมของโรคและแมลง และช่วยให้พืชใช้สารอาหารได้อย่างมีประสิทธิภาพ" 
  }
]

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<typeof ARTICLES[0] | null>(null)
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด")

  const categories = ["ทั้งหมด", ...Array.from(new Set(ARTICLES.map(a => a.category)))]

  const filteredArticles = useMemo(() => {
    let result = ARTICLES
    if (activeCategory !== "ทั้งหมด") {
      result = result.filter(a => a.category === activeCategory)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(article => 
        article.title.toLowerCase().includes(term) || 
        article.category.toLowerCase().includes(term)
      )
    }
    return result
  }, [searchTerm, activeCategory])

  // Full Blog View
  if (selectedArticle) {
    return (
      <div className="animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-10 border-b border-border/50">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-lg font-black text-primary hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft size={24} /> ย้อนกลับ
          </button>
          <div className="flex gap-4">
            <button className="p-3 hover:bg-muted rounded-2xl transition-all text-muted-foreground border border-border">
              <Bookmark size={22} />
            </button>
            <button className="p-3 hover:bg-muted rounded-2xl transition-all text-primary border border-primary/10">
              <Share2 size={22} />
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center px-4">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-base font-black rounded-full mb-4 uppercase tracking-widest">
              {selectedArticle.category}
            </span>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground leading-tight mb-6">
              {selectedArticle.title}
            </h1>
            <div className="relative h-[250px] lg:h-[450px] rounded-2xl overflow-hidden shadow-xl border border-border">
              <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="prose prose-lg max-w-none px-6 lg:px-0">
             <div className="text-base lg:text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {selectedArticle.content}
             </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Compact Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">คลังความรู้</h2>
          <p className="text-base text-muted-foreground font-bold">สาระน่ารู้เพื่อสวนของคุณ</p>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={24} />
          <input 
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเทคนิค โรคพืช ปุ๋ย..." 
            className="w-full bg-card border-2 border-border rounded-2xl pl-12 pr-4 py-3.5 text-lg font-bold focus:outline-none focus:border-primary shadow-sm hover:shadow-md transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Categories Chips */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setActiveCategory(c)}
            className={`shrink-0 px-6 py-2 rounded-full text-base font-black transition-all ${
              activeCategory === c 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
              : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <div 
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-1 flex flex-col h-full shadow-sm"
          >
            <div className="relative h-56 overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-primary text-xs font-black shadow-sm">
                  {article.category}
                </span>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h4 className="text-lg font-black text-foreground mb-4 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="mt-auto pt-4 border-t border-border/50 flex items-center text-primary text-base font-black gap-2">
                อ่านต่อ <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
