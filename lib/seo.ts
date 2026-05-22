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

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function safeHttpUrl(value: string | undefined) {
  if (!value) return ""
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

export function createExcerpt(value: string, maxLength = 155) {
  const text = cleanText(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

export function createGeoSummary(title: string, body: string, maxLength = 240) {
  return createExcerpt(`${title}: ${body}`, maxLength)
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
  imageAlt?: string
  content: string
  createdAt: string
  updatedAt: string
  metaTitle?: string
  metaDescription?: string
  slug?: string
  keywords?: string
  geoSummary?: string
  authorName?: string
}) {
  const slug = article.slug || createSlug(article.title)
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.metaTitle || article.title,
    description: article.metaDescription || createExcerpt(article.content),
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(article.image),
      caption: article.imageAlt || article.title,
    },
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    articleSection: article.category,
    abstract: article.geoSummary || createGeoSummary(article.title, article.content),
    keywords: uniqueKeywords([article.keywords, article.category, "ทุเรียน"]).join(", "),
    mainEntityOfPage: `${SITE_URL}/?article=${encodeURIComponent(slug)}`,
    author: {
      "@type": "Person",
      name: article.authorName || "ทีมสวนทุเรียน",
    },
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
  imageAlt?: string
  description: string
  affiliateUrl: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  geoSummary?: string
  brandName?: string
  sku?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.metaTitle || product.name,
    description: product.metaDescription || product.geoSummary || createExcerpt(product.description),
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(product.image),
      caption: product.imageAlt || product.name,
    },
    category: product.category,
    brand: {
      "@type": "Brand",
      name: product.brandName || SITE_NAME,
    },
    sku: product.sku || undefined,
    disambiguatingDescription: product.geoSummary || createGeoSummary(product.name, product.description),
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
