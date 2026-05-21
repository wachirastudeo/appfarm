"use client"
import { useEffect, useMemo, useState } from "react"
import type { Product } from "@/lib/store"
import { DEFAULT_KEYWORDS, productJsonLd, SITE_NAME } from "@/lib/seo"
import { ExternalLink, Search, X } from "lucide-react"

interface Props {
  products: Product[]
  compact?: boolean
  hideSearchFilter?: boolean
  searchTerm?: string
  activeCategory?: string
}

export default function Products({
  products,
  compact = false,
  hideSearchFilter = false,
  searchTerm: externalSearchTerm,
  activeCategory: externalActiveCategory,
}: Props) {
  const [internalSearchTerm, setInternalSearchTerm] = useState("")
  const [internalActiveCategory, setInternalActiveCategory] = useState("ทั้งหมด")

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm
  const setSearchTerm = externalSearchTerm !== undefined ? () => {} : setInternalSearchTerm

  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : internalActiveCategory
  const setActiveCategory = externalActiveCategory !== undefined ? () => {} : setInternalActiveCategory

  const activeProducts = useMemo(() => products.filter(product => product.status === "active"), [products])
  const categories = ["ทั้งหมด", ...Array.from(new Set(activeProducts.map(product => product.category)))]

  const filteredProducts = useMemo(() => {
    let result = activeProducts
    if (activeCategory !== "ทั้งหมด") {
      result = result.filter(product => product.category === activeCategory)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      )
    }
    return result
  }, [activeCategory, activeProducts, searchTerm])

  useEffect(() => {
    if (compact) return
    document.title = `ปุ๋ยและยาแนะนำ | ${SITE_NAME}`
    const description = "รายการปุ๋ย ยา สารเคมี และอุปกรณ์แนะนำสำหรับสวนทุเรียน พร้อมลิงก์รายละเอียดสินค้า"
    setMetaTag("description", description)
    setMetaTag("keywords", DEFAULT_KEYWORDS.concat(["ปุ๋ยและยา", "สารเคมีทุเรียน"]).join(", "))
    setMetaProperty("og:title", `ปุ๋ยและยาแนะนำ | ${SITE_NAME}`)
    setMetaProperty("og:description", description)
  }, [compact])

  const productsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: activeProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: productJsonLd(product),
    })),
  }

  return (
    <div className="space-y-6 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      {!hideSearchFilter && (
        compact ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide flex-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                      : "bg-card/40 backdrop-blur-sm border border-border/85 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full md:max-w-md shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาปุ๋ย ยา สารเคมี..."
                className="w-full bg-card/50 backdrop-blur-md border-2 border-border/80 rounded-2xl pl-12 pr-10 py-3 text-base font-bold outline-none transition-all duration-300 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-primary/45 shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black text-foreground">ปุ๋ยและยาทั้งหมด</h2>
                <p className="text-base font-bold text-muted-foreground">รายการแนะนำสำหรับสวนทุเรียน</p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาปุ๋ย ยา สารเคมี..."
                  className="w-full bg-card/50 backdrop-blur-md border-2 border-border/80 rounded-2xl pl-12 pr-10 py-3 text-base font-bold outline-none transition-all duration-300 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-primary/45 shadow-sm hover:shadow-md"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                      : "bg-card/40 backdrop-blur-sm border border-border/85 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </>
        )
      )}

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${compact ? "2xl:grid-cols-4" : ""}`}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card/65 backdrop-blur-md shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_50px_rgba(34,197,94,0.04)] ${compact ? "min-h-[24rem]" : "min-h-[28rem] sm:min-h-[30rem]"}`}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={product.image}
                alt={product.imageAlt || product.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/38 to-black/10" />
            </div>
            <div className={`relative z-10 flex h-full flex-col justify-end ${compact ? "p-4" : "p-5 sm:p-6"}`}>
              <div className="mb-3">
                <span className="inline-flex rounded-lg border border-white/20 bg-white/14 px-3 py-1 text-[11px] font-black text-white shadow-md backdrop-blur-md">
                  {product.category}
                </span>
              </div>
              <h3 className="mb-1.5 line-clamp-2 text-base font-black leading-snug text-white transition-colors group-hover:text-white/90 sm:text-lg">
                {product.name}
              </h3>
              {product.description && (
                <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-relaxed text-white/80 sm:text-sm">
                  {product.description}
                </p>
              )}
              <div className="mt-auto pt-3">
                {product.affiliateUrl ? (
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-md shadow-primary/10 transition-all duration-300 hover:from-primary/95 hover:to-emerald-600/95 hover:shadow-lg"
                  >
                    {product.priceLabel || "ดูรายละเอียด"}
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-xl border border-border bg-muted/65 px-4 py-2.5 text-sm font-black text-muted-foreground"
                  >
                    ยังไม่ได้ใส่ลิงก์
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 py-12 text-center">
          <p className="font-bold text-muted-foreground">ยังไม่มีรายการในหมวดนี้</p>
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
