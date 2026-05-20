export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://appfarm-main.vercel.app"
export const SITE_NAME = "สวนทุเรียน"
export const DEFAULT_TITLE = "สวนทุเรียน - ระบบจัดการสวนทุเรียนและคลังความรู้เกษตรกร"
export const DEFAULT_DESCRIPTION =
  "ระบบบริหารจัดการสวนทุเรียนสำหรับเกษตรกรไทย พร้อมติดตามแปลง งานสวน การเงิน บทความความรู้ และรายการปุ๋ยยาแนะนำ"
export const DEFAULT_KEYWORDS = [
  "สวนทุเรียน",
  "จัดการสวนทุเรียน",
  "ปลูกทุเรียน",
  "ดูแลทุเรียน",
  "ปุ๋ยทุเรียน",
  "ยาทุเรียน",
  "โรคทุเรียน",
  "เกษตรกรไทย",
]

export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function createExcerpt(value: string, maxLength = 155) {
  const text = cleanText(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

export function uniqueKeywords(values: Array<string | undefined>) {
  const keywords = values
    .flatMap(value => (value ?? "").split(","))
    .map(value => cleanText(value))
    .filter(Boolean)
  return Array.from(new Set(keywords))
}

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function articleJsonLd(article: {
  title: string
  category: string
  image: string
  content: string
  createdAt: string
  updatedAt: string
  metaTitle?: string
  metaDescription?: string
  slug?: string
  keywords?: string
}) {
  const slug = article.slug || createSlug(article.title)
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.metaTitle || article.title,
    description: article.metaDescription || createExcerpt(article.content),
    image: absoluteUrl(article.image),
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    articleSection: article.category,
    keywords: uniqueKeywords([article.keywords, article.category, "ทุเรียน"]).join(", "),
    mainEntityOfPage: `${SITE_URL}/?article=${encodeURIComponent(slug)}`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function productJsonLd(product: {
  name: string
  category: string
  image: string
  description: string
  affiliateUrl: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.metaTitle || product.name,
    description: product.metaDescription || createExcerpt(product.description),
    image: absoluteUrl(product.image),
    category: product.category,
    keywords: uniqueKeywords([product.keywords, product.category, "ปุ๋ยยา", "ทุเรียน"]).join(", "),
    offers: product.affiliateUrl
      ? {
          "@type": "Offer",
          url: product.affiliateUrl,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  }
}
