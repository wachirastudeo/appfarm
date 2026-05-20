"use client"
import { useEffect, useMemo, useState } from "react"
import type { Article, Product } from "@/lib/store"
import { absoluteUrl, articleJsonLd, createExcerpt, createSlug, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo"
import { Search, X, ArrowRight, Share2, Bookmark, ArrowLeft, ExternalLink } from "lucide-react"
import Products from "./Products"

const SAVED_ARTICLES_KEY = "durian_saved_articles"

interface Props {
  articles: Article[]
  products: Product[]
  initialArticleId?: string | null
  initialView?: "articles" | "products"
  onViewChange?: (view: "articles" | "products") => void
  onArticleSelect?: (articleId: string | null) => void
}

export default function Articles({
  articles,
  products,
  initialArticleId,
  initialView = "articles",
  onViewChange,
  onArticleSelect,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด")
  const [activeView, setActiveView] = useState<"articles" | "products">(initialView)
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState("")

  useEffect(() => {
    onViewChange?.(activeView)
  }, [activeView, onViewChange])

  useEffect(() => {
    onArticleSelect?.(selectedArticle?.id ?? null)
  }, [selectedArticle, onArticleSelect])

  const publishedArticles = useMemo(() => articles.filter(a => a.status === "published"), [articles])
  const categories = ["ทั้งหมด", ...Array.from(new Set(publishedArticles.map(a => a.category)))]

  useEffect(() => {
    if (!initialArticleId) return
    const article = publishedArticles.find(a => a.id === initialArticleId)
    if (article) {
      setActiveView("articles")
      setSelectedArticle(article)
    }
  }, [initialArticleId, publishedArticles])

  useEffect(() => {
    setActiveView(initialView)
  }, [initialView])

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_ARTICLES_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) setSavedArticleIds(parsed.filter(id => typeof id === "string"))
    } catch {
      localStorage.removeItem(SAVED_ARTICLES_KEY)
    }
  }, [])

  const filteredArticles = useMemo(() => {
    let result = publishedArticles
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
  }, [searchTerm, activeCategory, publishedArticles])

  useEffect(() => {
    const title = selectedArticle?.metaTitle || selectedArticle?.title || (activeView === "products" ? `ปุ๋ยและยา | ${SITE_NAME}` : DEFAULT_TITLE)
    const description = selectedArticle?.metaDescription || (selectedArticle ? createExcerpt(selectedArticle.content) : DEFAULT_DESCRIPTION)
    const image = absoluteUrl(selectedArticle?.image || "/images/durian-banner.jpg")
    const canonical = selectedArticle
      ? `${SITE_URL}/?article=${encodeURIComponent(selectedArticle.slug || createSlug(selectedArticle.title))}`
      : SITE_URL

    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    setMetaTag("description", description)
    setMetaTag("keywords", selectedArticle?.keywords || DEFAULT_KEYWORDS.join(", "))
    setMetaProperty("og:title", title)
    setMetaProperty("og:description", description)
    setMetaProperty("og:image", image)
    setMetaProperty("og:url", canonical)
    setCanonical(canonical)

    return () => {
      document.title = DEFAULT_TITLE
      setMetaTag("description", DEFAULT_DESCRIPTION)
      setMetaTag("keywords", DEFAULT_KEYWORDS.join(", "))
      setCanonical(SITE_URL)
    }
  }, [activeView, selectedArticle])

  const showActionMessage = (message: string) => {
    setActionMessage(message)
    window.setTimeout(() => setActionMessage(""), 1800)
  }

  const toggleSavedArticle = (article: Article) => {
    setSavedArticleIds(current => {
      const isSaved = current.includes(article.id)
      const next = isSaved ? current.filter(id => id !== article.id) : [...current, article.id]
      localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(next))
      showActionMessage(isSaved ? "นำออกจากรายการบันทึกแล้ว" : "บันทึกบทความแล้ว")
      return next
    })
  }

  const shareArticle = async (article: Article) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(article.slug || createSlug(article.title))}`
    const text = `${article.title}\n${shareUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: article.title, url: shareUrl })
        showActionMessage("แชร์บทความแล้ว")
        return
      }
      await navigator.clipboard.writeText(text)
      showActionMessage("คัดลอกลิงก์แล้ว")
    } catch {
      showActionMessage("แชร์ไม่สำเร็จ")
    }
  }

  const selectedArticleSaved = selectedArticle ? savedArticleIds.includes(selectedArticle.id) : false

  // Full Blog View
  if (selectedArticle) {
    return (
      <div className="animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between gap-2 mb-6 sm:mb-8 sticky top-0 bg-background/80 backdrop-blur-md py-3 sm:py-4 z-10 border-b border-border/50">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-base sm:text-lg font-black text-primary hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft size={22} /> ย้อนกลับ
          </button>
          <div className="flex gap-2 sm:gap-4">
            {actionMessage && <span className="self-center text-xs font-bold text-primary">{actionMessage}</span>}
            <button
              onClick={() => toggleSavedArticle(selectedArticle)}
              aria-label={selectedArticleSaved ? "ยกเลิกบันทึกบทความ" : "บันทึกบทความ"}
              title={selectedArticleSaved ? "ยกเลิกบันทึกบทความ" : "บันทึกบทความ"}
              className={`p-2.5 sm:p-3 hover:bg-muted rounded-2xl transition-all border ${selectedArticleSaved ? "border-primary/20 bg-primary/10 text-primary" : "text-muted-foreground border-border"}`}
            >
              <Bookmark size={20} fill={selectedArticleSaved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => shareArticle(selectedArticle)}
              aria-label="แชร์บทความ"
              title="แชร์บทความ"
              className="p-2.5 sm:p-3 hover:bg-muted rounded-2xl transition-all text-primary border border-primary/10"
            >
              <Share2 size={20} />
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
            <div className="relative h-[220px] sm:h-[280px] lg:h-[450px] rounded-2xl overflow-hidden shadow-xl border border-border">
              <img src={selectedArticle.image} alt={selectedArticle.imageAlt || selectedArticle.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="prose prose-lg max-w-none px-2 sm:px-6 lg:px-0">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(selectedArticle)) }}
            />
            {selectedArticle.geoSummary && (
              <section className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <p className="text-sm font-black text-primary">สรุปสั้น</p>
                <p className="mt-2 text-base font-semibold leading-7 text-foreground/80">{selectedArticle.geoSummary}</p>
              </section>
            )}
            <div className="text-base lg:text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {selectedArticle.content}
            </div>
            {selectedArticle.affiliateUrl && (
              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <p className="text-sm font-black text-primary">ปุ๋ยและยาแนะนำ</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-black text-foreground">{selectedArticle.affiliateTitle || "ดูปุ๋ยและยาแนะนำ"}</p>
                  <a
                    href={selectedArticle.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground hover:opacity-90"
                  >
                    ดูรายละเอียด
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Compact Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 sm:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">คลังความรู้</h2>
            <p className="text-base text-muted-foreground font-bold">สาระน่ารู้เพื่อสวนของคุณ</p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm w-fit">
            <button
              onClick={() => {
                setActiveView("articles")
                setSearchTerm("")
              }}
              className={`rounded-xl px-4 py-2 text-sm font-black transition-colors ${
                activeView === "articles"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              บทความ
            </button>
            <button
              onClick={() => {
                setActiveView("products")
                setSearchTerm("")
              }}
              className={`rounded-xl px-4 py-2 text-sm font-black transition-colors ${
                activeView === "products"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              ปุ๋ยและยา
            </button>
          </div>
        </div>
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={22} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeView === "articles" ? "ค้นหาเทคนิค โรคพืช ปุ๋ย..." : "ค้นหาปุ๋ย ยา สารเคมี..."}
            className="w-full bg-card border-2 border-border rounded-2xl pl-12 pr-10 py-2.5 text-base font-bold focus:outline-none focus:border-primary shadow-sm hover:shadow-md transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {activeView === "products" && <Products products={products} compact searchTerm={searchTerm} />}

      {activeView === "articles" && (
        <>

          {/* Categories Chips */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-black transition-all ${activeCategory === c
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArticles.map((article, index) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-1 flex flex-col h-full shadow-sm"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img src={article.image} alt={article.imageAlt || article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading={index === 0 ? "eager" : "lazy"} />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-primary text-xs font-black shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
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
        </>
      )}
    </div>
  )
}

function setMetaTag(name: string, content: string) {
  const selector = `meta[name="${name}"]`
  const tag = document.querySelector(selector) || document.head.appendChild(document.createElement("meta"))
  tag.setAttribute("name", name)
  tag.setAttribute("content", content)
}

function setMetaProperty(property: string, content: string) {
  const selector = `meta[property="${property}"]`
  const tag = document.querySelector(selector) || document.head.appendChild(document.createElement("meta"))
  tag.setAttribute("property", property)
  tag.setAttribute("content", content)
}

function setCanonical(href: string) {
  const tag = document.querySelector('link[rel="canonical"]') || document.head.appendChild(document.createElement("link"))
  tag.setAttribute("rel", "canonical")
  tag.setAttribute("href", href)
}
