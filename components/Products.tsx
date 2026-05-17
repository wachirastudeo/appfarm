"use client"
import { useMemo, useState } from "react"
import type { Product } from "@/lib/store"
import { ExternalLink, Search, X } from "lucide-react"

interface Props {
  products: Product[]
  compact?: boolean
}

export default function Products({ products, compact = false }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด")

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

  return (
    <div className="space-y-6 pb-12">
      {!compact && (
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">ปุ๋ยและยาทั้งหมด</h2>
          <p className="text-base font-bold text-muted-foreground">รายการแนะนำสำหรับสวนทุเรียน</p>
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={22} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาปุ๋ย ยา สารเคมี..."
            className="w-full rounded-2xl border-2 border-border bg-card py-3 pl-12 pr-10 text-base font-bold shadow-sm outline-none transition-all focus:border-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      )}

      {compact && (
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={22} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาปุ๋ย ยา สารเคมี..."
            className="w-full rounded-2xl border-2 border-border bg-card py-3 pl-12 pr-10 text-base font-bold shadow-sm outline-none transition-all focus:border-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition-all sm:px-6 sm:text-base ${
              activeCategory === category
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(product => (
          <div key={product.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-primary shadow-sm backdrop-blur">
                {product.category}
              </div>
            </div>
            <div className="flex min-h-48 flex-col p-4">
              <h3 className="line-clamp-2 text-lg font-black leading-snug text-foreground">{product.name}</h3>
              {product.description && <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-muted-foreground">{product.description}</p>}
              <div className="mt-auto pt-4">
                {product.affiliateUrl ? (
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {product.priceLabel || "ดูรายละเอียด"}
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button disabled className="w-full rounded-xl bg-muted px-4 py-3 text-sm font-black text-muted-foreground">
                    ยังไม่ได้ใส่ลิงก์
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <p className="font-bold text-muted-foreground">ยังไม่มีรายการในหมวดนี้</p>
        </div>
      )}
    </div>
  )
}
