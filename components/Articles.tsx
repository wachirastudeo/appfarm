"use client"
import { useEffect, useMemo, useState } from "react"
import type { Article, Product } from "@/lib/store"
import { absoluteUrl, articleJsonLd, createExcerpt, createSlug, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_TITLE, safeHttpUrl, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo"
import { Search, X, ArrowRight, Share2, Bookmark, ArrowLeft, ExternalLink, Facebook, MessageCircleMore, Link2, Smartphone, Twitter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SHOW_RECOMMENDED_PRODUCTS } from "@/lib/feature-flags"
import Products from "./Products"

interface Props {
  articles: Article[]
  products: Product[]
  initialArticleId?: string | null
  initialView?: "articles" | "products"
  savedArticleIds?: string[]
  savedArticlesStorageKey: string
  guestMobileRail?: boolean
  onSavedArticleIdsChange?: (savedArticleIds: string[]) => Promise<void>
  onViewChange?: (view: "articles" | "products") => void
  onArticleSelect?: (articleId: string | null) => void
}

export default function Articles({
  articles,
  products,
  initialArticleId,
  initialView = "articles",
  savedArticleIds: storedSavedArticleIds,
  savedArticlesStorageKey,
  guestMobileRail = false,
  onSavedArticleIdsChange,
  onViewChange,
  onArticleSelect,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด")
  const [activeView, setActiveView] = useState<"articles" | "products">(SHOW_RECOMMENDED_PRODUCTS ? initialView : "articles")
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState("")

  useEffect(() => {
    onViewChange?.(activeView)
  }, [activeView, onViewChange])

  useEffect(() => {
    if (!SHOW_RECOMMENDED_PRODUCTS && activeView === "products") {
      setActiveView("articles")
    }
  }, [activeView])

  useEffect(() => {
    onArticleSelect?.(selectedArticle?.id ?? null)
  }, [selectedArticle, onArticleSelect])

  const publishedArticles = useMemo(() => articles.filter(a => a.status === "published"), [articles])
  const activeProducts = useMemo(() => products.filter(product => product.status === "active"), [products])

  const categories = useMemo(() => {
    if (activeView === "articles" || !SHOW_RECOMMENDED_PRODUCTS) {
      return ["ทั้งหมด", ...Array.from(new Set(publishedArticles.map(a => a.category)))]
    } else {
      return ["ทั้งหมด", ...Array.from(new Set(activeProducts.map(p => p.category)))]
    }
  }, [activeView, publishedArticles, activeProducts])

  useEffect(() => {
    if (!initialArticleId) return
    const article = publishedArticles.find(a => a.id === initialArticleId)
    if (article) {
      setActiveView("articles")
      setSelectedArticle(article)
    }
  }, [initialArticleId, publishedArticles])

  useEffect(() => {
    setActiveView(SHOW_RECOMMENDED_PRODUCTS ? initialView : "articles")
  }, [initialView])

  useEffect(() => {
    if (storedSavedArticleIds) {
      setSavedArticleIds(storedSavedArticleIds)
      return
    }

    const saved = localStorage.getItem(savedArticlesStorageKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) setSavedArticleIds(parsed.filter(id => typeof id === "string"))
    } catch {
      localStorage.removeItem(savedArticlesStorageKey)
    }
  }, [savedArticlesStorageKey, storedSavedArticleIds])

  const filteredArticles = useMemo(() => {
    let result = publishedArticles
    const articleCategories = publishedArticles.map(a => a.category)
    if (activeCategory !== "ทั้งหมด" && articleCategories.includes(activeCategory)) {
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
    const title = selectedArticle?.metaTitle || selectedArticle?.title || (activeView === "products" && SHOW_RECOMMENDED_PRODUCTS ? `ปุ๋ยและยา | ${SITE_NAME}` : DEFAULT_TITLE)
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
      localStorage.setItem(savedArticlesStorageKey, JSON.stringify(next))
      if (onSavedArticleIdsChange) {
        void onSavedArticleIdsChange(next).catch(() => showActionMessage("บันทึกรายการบทความไม่สำเร็จ"))
      }
      showActionMessage(isSaved ? "นำออกจากรายการบันทึกแล้ว" : "บันทึกบทความแล้ว")
      return next
    })
  }

  const shareArticle = async (article: Article) => {
    const shareUrl = getArticleShareUrl(article)
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

  const openSocialShare = (article: Article, platform: "facebook" | "line" | "x") => {
    const shareUrl = getArticleShareUrl(article)
    const shareText = `${article.title}`
    const socialUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    }

    window.open(socialUrls[platform], "_blank", "noopener,noreferrer")
    showActionMessage("เปิดหน้าต่างแชร์แล้ว")
  }

  const copyArticleLink = async (article: Article) => {
    try {
      await navigator.clipboard.writeText(getArticleShareUrl(article))
      showActionMessage("คัดลอกลิงก์แล้ว")
    } catch {
      showActionMessage("คัดลอกลิงก์ไม่สำเร็จ")
    }
  }

  const selectedArticleSaved = selectedArticle ? savedArticleIds.includes(selectedArticle.id) : false

  // Full Blog View
  if (selectedArticle) {
    const affiliateUrl = safeHttpUrl(selectedArticle.affiliateUrl)
    return (
      <div className="animate-in fade-in duration-500 rounded-[2rem] border border-[#DDEBE1]/80 bg-white px-4 py-4 shadow-[0_20px_50px_rgba(20,107,62,0.06)] sm:px-6 sm:py-5 pb-20 dark:border-[#31533D]/45 dark:bg-[#14291E]">
        <div className="sticky top-0 z-10 mb-6 flex items-center justify-between gap-2 border-b border-border/50 bg-white/95 py-3 backdrop-blur-md sm:mb-8 sm:py-4 dark:bg-[#14291E]/95">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="แชร์บทความ"
                  title="แชร์บทความ"
                  className="p-2.5 sm:p-3 hover:bg-muted rounded-2xl transition-all text-primary border border-primary/10"
                >
                  <Share2 size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                <DropdownMenuItem onClick={() => shareArticle(selectedArticle)}>
                  <Smartphone className="text-primary" />
                  แชร์ผ่านเครื่อง
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSocialShare(selectedArticle, "facebook")}>
                  <Facebook className="text-[#1877F2]" />
                  แชร์ไป Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSocialShare(selectedArticle, "line")}>
                  <MessageCircleMore className="text-[#06C755]" />
                  แชร์ไป LINE
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSocialShare(selectedArticle, "x")}>
                  <Twitter className="text-foreground" />
                  แชร์ไป X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyArticleLink(selectedArticle)}>
                  <Link2 className="text-primary" />
                  คัดลอกลิงก์
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd(selectedArticle)) }}
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
            {SHOW_RECOMMENDED_PRODUCTS && affiliateUrl && (
              <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <p className="text-sm font-black text-primary">ปุ๋ยและยาแนะนำ</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-black text-foreground">{selectedArticle.affiliateTitle || "ดูปุ๋ยและยาแนะนำ"}</p>
                  <a
                    href={affiliateUrl}
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
    <div className="space-y-5 rounded-[2rem] border border-[#DDEBE1]/80 bg-white px-4 py-3 shadow-[0_20px_50px_rgba(20,107,62,0.06)] sm:px-6 sm:py-4 pb-10 dark:border-[#31533D]/45 dark:bg-[#14291E]">
      {/* Sleek Premium Header */}
      <div className="flex flex-col gap-2 pt-0 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">คลังความรู้</h2>
          <p className="mt-1 text-sm text-muted-foreground font-semibold sm:text-base">สาระน่ารู้และคำแนะนำสำหรับการดูแลสวนทุเรียน</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 xl:max-w-[40rem] xl:justify-end">
          <div className="relative min-w-0 flex-1 basis-full sm:min-w-[16rem] xl:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={activeView === "products" && SHOW_RECOMMENDED_PRODUCTS ? "ค้นหาปุ๋ย ยา สารเคมี..." : "ค้นหาเทคนิค โรคพืช ปุ๋ย..."}
              className="w-full bg-card/50 backdrop-blur-md border-2 border-border/80 rounded-xl pl-11 pr-10 py-2 text-sm font-bold outline-none transition-all duration-300 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-primary/45 shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            )}
          </div>
          <div className="flex shrink-0 gap-1 rounded-xl border border-border/80 bg-muted/40 p-1 shadow-inner w-fit">
            <button
              onClick={() => {
                setActiveView("articles")
                setActiveCategory("ทั้งหมด")
              }}
              className={`rounded-lg px-4 py-2 text-sm font-black transition-all duration-300 ${
                activeView === "articles"
                  ? "bg-background text-primary shadow-md border border-border/30 scale-100 font-extrabold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/25"
              }`}
            >
              บทความ
            </button>
            {SHOW_RECOMMENDED_PRODUCTS && (
              <button
                onClick={() => {
                  setActiveView("products")
                  setActiveCategory("ทั้งหมด")
                }}
                className={`rounded-lg px-4 py-2 text-sm font-black transition-all duration-300 ${
                  activeView === "products"
                    ? "bg-background text-primary shadow-md border border-border/30 scale-100 font-extrabold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/25"
                }`}
              >
                ปุ๋ยและยา
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Chips & Search Box Row */}
      <div className="flex">
        <div className="flex flex-1 flex-wrap gap-2.5 sm:flex-nowrap sm:overflow-x-auto sm:pb-2 sm:scrollbar-hide xl:min-w-0">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeCategory === c
                  ? "bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                  : "bg-card/40 backdrop-blur-sm border border-border/85 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {SHOW_RECOMMENDED_PRODUCTS && activeView === "products" ? (
        <Products
          products={products}
          compact
          hideSearchFilter
          searchTerm={searchTerm}
          activeCategory={activeCategory}
          mobileRail={guestMobileRail}
        />
      ) : (
        /* Articles Grid */
        <div className={guestMobileRail ? "-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3" : "grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"}>
          {filteredArticles.map((article, index) => {
            const excerpt = createExcerpt(article.content, 90)
            return (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/65 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_50px_rgba(34,197,94,0.04)] ${guestMobileRail ? "w-[17rem] shrink-0 cursor-pointer sm:w-auto sm:min-w-0" : "cursor-pointer"}`}
              >
                <div className="relative h-52 sm:h-60 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.imageAlt || article.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-xl bg-background/80 backdrop-blur-md border border-border/40 text-primary text-xs font-black shadow-md">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <h4 className="text-xl font-black text-foreground mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-muted-foreground font-semibold line-clamp-2 mt-1 leading-relaxed">
                    {excerpt}
                  </p>
                  <div className="mt-auto pt-5 border-t border-border/40 flex items-center text-primary text-base font-black gap-2">
                    <span>อ่านต่อ</span>
                    <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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

function getArticleShareUrl(article: Article) {
  return `${SITE_URL}/?article=${encodeURIComponent(article.slug || createSlug(article.title))}`
}
