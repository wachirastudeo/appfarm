"use client"
import { useId, useState } from "react"
import type { AppUser, Article, NewUserInput, Product, SiteSettings } from "@/lib/store"
import { appRuntimeConfig, getDataModeLabel, isSupabaseConfigured } from "@/lib/runtime-config"
import { createExcerpt, createGeoSummary, createSlug, uniqueKeywords } from "@/lib/seo"
import { validateEmail, validateHttpUrl, validateImageFile, validateText, resizeAndCompressImage } from "@/lib/form-validation"
import { BookOpen, Edit3, Image as ImageIcon, Plus, Save, Settings, Shield, ShoppingBag, Trash2, Upload, Users, MessageSquare, Sparkles, Globe, FileText, Eye, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Props {
  users: AppUser[]
  articles: Article[]
  products: Product[]
  siteSettings: SiteSettings
  currentUser: AppUser
  addUser: (user: NewUserInput) => Promise<AppUser | null>
  updateUser: (id: string, changes: Partial<AppUser>) => void
  deleteUser: (id: string) => void
  addArticle: (article: Omit<Article, "id" | "createdAt" | "updatedAt">) => void
  updateArticle: (id: string, changes: Partial<Article>) => void
  deleteArticle: (id: string) => void
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: string, changes: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateSiteSettings: (changes: Partial<SiteSettings>) => void
}

const emptyArticle = {
  title: "",
  category: "การดูแลรักษา",
  image: "/images/articles/article_watering_1778037948644.avif",
  imageAlt: "",
  content: "",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  geoSummary: "",
  authorName: "",
  affiliateTitle: "",
  affiliateUrl: "",
  status: "published" as const,
}

const emptyProduct = {
  name: "",
  category: "สารเคมี",
  image: "/images/articles/article_disease_1778037967060.avif",
  imageAlt: "",
  priceLabel: "ดูรายละเอียด",
  description: "",
  affiliateUrl: "",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  geoSummary: "",
  brandName: "",
  sku: "",
  status: "active" as const,
}

const getTitleLengthBadge = (len: number) => {
  if (len === 0) return { label: "ไม่มีหัวข้อ", color: "text-muted-foreground bg-muted" }
  if (len >= 50 && len <= 60) return { label: "ยอดเยี่ยม (50-60 อักษร)", color: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30" }
  if (len < 50) return { label: "สั้นเกินไป (แนะนำ 50-60)", color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30" }
  return { label: "ยาวเกินไป (แนะนำ 50-60)", color: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30" }
}

const getDescLengthBadge = (len: number) => {
  if (len === 0) return { label: "ไม่มีคำอธิบาย", color: "text-muted-foreground bg-muted" }
  if (len >= 120 && len <= 160) return { label: "ยอดเยี่ยม (120-160 อักษร)", color: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30" }
  if (len < 120) return { label: "สั้นเกินไป (แนะนำ 120-160)", color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30" }
  return { label: "ยาวเกินไป (แนะนำ 120-160)", color: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30" }
}

export default function AdminPanel({
  users,
  articles,
  products,
  siteSettings,
  currentUser,
  addUser,
  updateUser,
  deleteUser,
  addArticle,
  updateArticle,
  deleteArticle,
  addProduct,
  updateProduct,
  deleteProduct,
  updateSiteSettings,
}: Props) {
  const [activeSection, setActiveSection] = useState<"site" | "articles" | "products" | "users" | "feedback">("site")
  const [feedbacks, setFeedbacks] = useState<{ id: string, name: string, contact: string, message: string, date: string }[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem("appfarm_feedback")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter(f => f.id !== id)
    setFeedbacks(updated)
    localStorage.setItem("appfarm_feedback", JSON.stringify(updated))
  }
  const [settingsDraft, setSettingsDraft] = useState(siteSettings)
  const [articleDraft, setArticleDraft] = useState<Omit<Article, "id" | "createdAt" | "updatedAt">>(emptyArticle)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [productDraft, setProductDraft] = useState<Omit<Product, "id" | "createdAt" | "updatedAt">>(emptyProduct)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [userDraft, setUserDraft] = useState({ name: "", email: "", password: "", role: "user" as AppUser["role"] })
  const [message, setMessage] = useState("")
  const [articlePage, setArticlePage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [feedbackPage, setFeedbackPage] = useState(1)

  const uploadImage = async (file: File | undefined, onDone: (dataUrl: string) => void, label: string) => {
    if (!file) return
    const checkedFile = validateImageFile(file, 5 * 1024 * 1024)
    if (!checkedFile.ok) {
      setMessage(checkedFile.message)
      return
    }
    try {
      const dataUrl = await resizeAndCompressImage(checkedFile.value, 1400, 0.82)
      onDone(dataUrl)
      setMessage(`อัปโหลด${label}แล้ว กดบันทึกเพื่อนำไปใช้`)
    } catch {
      setMessage(`อัปโหลด${label}ไม่สำเร็จ`)
    }
  }

  const saveSettings = () => {
    const siteName = validateText("ชื่อเว็บ", settingsDraft.siteName, { required: true, maxLength: 120 })
    const tagline = validateText("คำโปรย", settingsDraft.tagline, { required: true, maxLength: 160 })
    const googleVerification = validateText("Google Verification Key", settingsDraft.googleVerification ?? "", { maxLength: 200 })
    const googleAnalytics = validateText("Google Analytics ID", settingsDraft.googleAnalytics ?? "", { maxLength: 50 })
    
    if (!siteName.ok || !tagline.ok || !googleVerification.ok || !googleAnalytics.ok) {
      setMessage(!siteName.ok ? siteName.message : !tagline.ok ? tagline.message : !googleVerification.ok ? googleVerification.message : googleAnalytics.message)
      return
    }
    
    updateSiteSettings({ 
      ...settingsDraft, 
      siteName: siteName.value, 
      tagline: tagline.value,
      googleVerification: googleVerification.value,
      googleAnalytics: googleAnalytics.value
    })
    setMessage("บันทึกตั้งค่าเว็บแล้ว")
  }

  const handleAutoPopulateSEO = () => {
    if (!articleDraft.title) {
      setMessage("กรุณากรอกหัวข้อก่อนเพื่อเจนข้อมูล SEO")
      return
    }
    const generatedSlug = createSlug(articleDraft.title)
    const generatedMetaTitle = articleDraft.title
    const generatedMetaDesc = createExcerpt(articleDraft.content || "")
    const generatedKeywords = uniqueKeywords([
      articleDraft.keywords,
      articleDraft.category,
      articleDraft.title,
      "ทุเรียน"
    ]).join(", ")
    const generatedGeoSummary = createGeoSummary(articleDraft.title, articleDraft.content || "")
    const generatedImageAlt = articleDraft.title
    const generatedAuthor = articleDraft.authorName || "ทีมสวนทุเรียน"

    setArticleDraft(prev => ({
      ...prev,
      slug: prev.slug || generatedSlug,
      metaTitle: prev.metaTitle || generatedMetaTitle,
      metaDescription: prev.metaDescription || generatedMetaDesc,
      keywords: prev.keywords || generatedKeywords,
      geoSummary: prev.geoSummary || generatedGeoSummary,
      imageAlt: prev.imageAlt || generatedImageAlt,
      authorName: prev.authorName || generatedAuthor,
    }))
    setMessage("เจนข้อมูล SEO อัตโนมัติเรียบร้อย!")
  }

  const saveArticle = () => {
    const title = validateText("หัวข้อ", articleDraft.title, { required: true, maxLength: 180 })
    const category = validateText("หมวดหมู่", articleDraft.category, { required: true, maxLength: 80 })
    const content = validateText("เนื้อหาบทความ", articleDraft.content, { required: true, maxLength: 12000, allowMultiline: true })
    const affiliateTitle = validateText("ชื่อปุ๋ย/ยาแนะนำ", articleDraft.affiliateTitle ?? "", { maxLength: 180 })
    const affiliateUrl = validateHttpUrl("Affiliate link", articleDraft.affiliateUrl ?? "", Boolean(affiliateTitle.value))
    const slug = validateText("Slug", articleDraft.slug ?? "", { maxLength: 180 })
    const metaTitle = validateText("Meta title", articleDraft.metaTitle ?? "", { maxLength: 180 })
    const metaDescription = validateText("Meta description", articleDraft.metaDescription ?? "", { maxLength: 500, allowMultiline: true })
    const keywords = validateText("Keywords", articleDraft.keywords ?? "", { maxLength: 500 })
    const geoSummary = validateText("สรุปสั้น", articleDraft.geoSummary ?? "", { maxLength: 1000, allowMultiline: true })
    const imageAlt = validateText("Alt รูปภาพ", articleDraft.imageAlt ?? "", { maxLength: 300 })
    const authorName = validateText("ผู้เขียน", articleDraft.authorName ?? "", { maxLength: 120 })
    if (affiliateUrl.value && !affiliateTitle.value) {
      setMessage("กรุณากรอกชื่อปุ๋ย/ยาแนะนำก่อน Affiliate link")
      return
    }
    const invalid = [title, category, content, affiliateTitle, affiliateUrl, slug, metaTitle, metaDescription, keywords, geoSummary, imageAlt, authorName].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      setMessage(invalid.message)
      return
    }
    const nextArticle = {
      ...articleDraft,
      title: title.value,
      category: category.value,
      content: content.value,
      affiliateTitle: affiliateTitle.value,
      affiliateUrl: affiliateUrl.value,
      slug: slug.value || createSlug(title.value),
      metaTitle: metaTitle.value || title.value,
      metaDescription: metaDescription.value || createExcerpt(content.value),
      keywords: uniqueKeywords([keywords.value, category.value, title.value, "ทุเรียน"]).join(", "),
      geoSummary: geoSummary.value || createGeoSummary(title.value, content.value),
      imageAlt: imageAlt.value || title.value,
      authorName: authorName.value || "ทีมสวนทุเรียน",
    }
    if (editingArticleId) {
      updateArticle(editingArticleId, nextArticle)
      setEditingArticleId(null)
    } else {
      addArticle(nextArticle)
    }
    setArticleDraft(emptyArticle)
    setMessage("บันทึกบทความแล้ว")
  }

  const editArticle = (article: Article) => {
    setEditingArticleId(article.id)
    setArticleDraft({
      title: article.title,
      category: article.category,
      image: article.image,
      imageAlt: article.imageAlt ?? "",
      content: article.content,
      slug: article.slug ?? "",
      metaTitle: article.metaTitle ?? "",
      metaDescription: article.metaDescription ?? "",
      keywords: article.keywords ?? "",
      geoSummary: article.geoSummary ?? "",
      authorName: article.authorName ?? "",
      affiliateTitle: article.affiliateTitle ?? "",
      affiliateUrl: article.affiliateUrl ?? "",
      status: article.status,
    })
  }

  const saveProduct = () => {
    const name = validateText("ชื่อปุ๋ย/ยา", productDraft.name, { required: true, maxLength: 180 })
    const category = validateText("หมวดหมู่", productDraft.category, { required: true, maxLength: 80 })
    const description = validateText("รายละเอียดสั้น", productDraft.description, { required: true, maxLength: 1000, allowMultiline: true })
    const priceLabel = validateText("ข้อความราคา/ปุ่ม", productDraft.priceLabel, { required: true, maxLength: 80 })
    const affiliateUrl = validateHttpUrl("Affiliate link", productDraft.affiliateUrl, true)
    const slug = validateText("Slug", productDraft.slug ?? "", { maxLength: 180 })
    const metaTitle = validateText("Meta title", productDraft.metaTitle ?? "", { maxLength: 180 })
    const metaDescription = validateText("Meta description", productDraft.metaDescription ?? "", { maxLength: 500, allowMultiline: true })
    const keywords = validateText("Keywords", productDraft.keywords ?? "", { maxLength: 500 })
    const geoSummary = validateText("สรุปสั้น", productDraft.geoSummary ?? "", { maxLength: 1000, allowMultiline: true })
    const imageAlt = validateText("Alt รูปภาพ", productDraft.imageAlt ?? "", { maxLength: 300 })
    const brandName = validateText("แบรนด์", productDraft.brandName ?? "", { maxLength: 120 })
    const sku = validateText("SKU/รหัสสินค้า", productDraft.sku ?? "", { maxLength: 120 })
    const invalid = [name, category, description, priceLabel, affiliateUrl, slug, metaTitle, metaDescription, keywords, geoSummary, imageAlt, brandName, sku].find(result => !result.ok)
    if (invalid && !invalid.ok) {
      setMessage(invalid.message)
      return
    }
    const nextProduct = {
      ...productDraft,
      name: name.value,
      category: category.value,
      description: description.value,
      priceLabel: priceLabel.value,
      affiliateUrl: affiliateUrl.value,
      slug: slug.value || createSlug(name.value),
      metaTitle: metaTitle.value || name.value,
      metaDescription: metaDescription.value || createExcerpt(description.value),
      keywords: uniqueKeywords([keywords.value, category.value, name.value, "ปุ๋ยยา", "ทุเรียน"]).join(", "),
      geoSummary: geoSummary.value || createGeoSummary(name.value, description.value),
      imageAlt: imageAlt.value || name.value,
      brandName: brandName.value || "สวนทุเรียน",
      sku: sku.value,
    }
    if (editingProductId) {
      updateProduct(editingProductId, nextProduct)
      setEditingProductId(null)
    } else {
      addProduct(nextProduct)
    }
    setProductDraft(emptyProduct)
    setMessage("บันทึกปุ๋ยและยาแล้ว")
  }

  const editProduct = (product: Product) => {
    setEditingProductId(product.id)
    setProductDraft({
      name: product.name,
      category: product.category,
      image: product.image,
      imageAlt: product.imageAlt ?? "",
      priceLabel: product.priceLabel,
      description: product.description,
      affiliateUrl: product.affiliateUrl,
      slug: product.slug ?? "",
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      keywords: product.keywords ?? "",
      geoSummary: product.geoSummary ?? "",
      brandName: product.brandName ?? "",
      sku: product.sku ?? "",
      status: product.status,
    })
  }

  const createUser = async () => {
    const name = validateText("ชื่อ", userDraft.name, { required: true, maxLength: 120 })
    const email = validateEmail(userDraft.email)
    const password = validateText("รหัสผ่าน", userDraft.password, { required: true, maxLength: 128 })
    if (!name.ok || !email.ok || !password.ok) {
      setMessage(!name.ok ? name.message : !email.ok ? email.message : password.message)
      return
    }
    const created = await addUser({
      ...userDraft,
      name: name.value,
      email: email.value,
      password: password.value,
      status: "active",
      provider: "email",
    })
    setMessage(created ? "สร้าง user แล้ว" : "อีเมลนี้มีผู้ใช้งานแล้ว")
    if (created) setUserDraft({ name: "", email: "", password: "", role: "user" })
  }

  return (
    <div data-page="admin" className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 rounded-3xl bg-[#0F4A2E] p-6 text-white shadow-xl md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-black ring-1 ring-white/20">
            <Shield size={14} />
            Admin Control
          </div>
          <h2 className="text-2xl font-black">หลังบ้านผู้ดูแลระบบ</h2>
          <p className="mt-1 text-sm font-semibold text-white/70">จัดการโลโก้ บทความ และผู้ใช้งานจำลอง</p>
        </div>
        {message && <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#0F4A2E]">{message}</div>}
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm">
        {[
          { id: "site" as const, label: "พื้นฐานเว็บ", icon: Settings },
          { id: "articles" as const, label: "บทความ", icon: BookOpen },
          { id: "products" as const, label: "ปุ๋ยและยา", icon: ShoppingBag },
          { id: "users" as const, label: "User", icon: Users },
          { id: "feedback" as const, label: "ข้อเสนอแนะ/ติดต่อ", icon: MessageSquare },
        ].map(section => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
                activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {section.label}
            </button>
          )
        })}
      </div>

      {activeSection === "site" && (
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="text-primary" size={20} />
              <h3 className="text-lg font-black">ตั้งค่าเว็บ</h3>
            </div>
            <div className="space-y-3">
              <AdminInput label="ชื่อเว็บ" value={settingsDraft.siteName} onChange={siteName => setSettingsDraft(v => ({ ...v, siteName }))} required />
              <AdminInput label="คำโปรย" value={settingsDraft.tagline} onChange={tagline => setSettingsDraft(v => ({ ...v, tagline }))} required />
              <label className="block space-y-1.5">
                <span className="text-xs font-black text-muted-foreground">อัปโหลดโลโก้</span>
                <div className="flex items-center gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-black text-primary transition-colors hover:bg-primary/10">
                    <Upload size={16} />
                    เลือกรูปภาพ
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => uploadImage(e.target.files?.[0], logoUrl => setSettingsDraft(v => ({ ...v, logoUrl })), "โลโก้")}
                    />
                  </label>
                  {settingsDraft.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettingsDraft(v => ({ ...v, logoUrl: "" }))}
                      className="rounded-xl border border-border px-3 py-3 text-xs font-black text-muted-foreground hover:bg-muted"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </label>
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
                <p className="text-xs font-black text-[#0F4A2E] dark:text-[#E7F3EC] flex items-center gap-1.5">
                  <Globe size={14} />
                  การเชื่อมต่อ SEO & เครื่องมือผู้ดูแลเว็บ
                </p>
                <AdminInput 
                  label="รหัสยืนยัน Google Search Console (google-site-verification)" 
                  value={settingsDraft.googleVerification ?? ""} 
                  onChange={googleVerification => setSettingsDraft(v => ({ ...v, googleVerification }))} 
                  placeholder="เช่น google-site-verification=xxxx..." 
                />
                <AdminInput 
                  label="รหัส Google Analytics (Measurement ID)" 
                  value={settingsDraft.googleAnalytics ?? ""} 
                  onChange={googleAnalytics => setSettingsDraft(v => ({ ...v, googleAnalytics }))} 
                  placeholder="เช่น G-XXXXXXXXXX" 
                />
              </div>
              <button onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
                <Save size={16} />
                บันทึกตั้งค่า
              </button>
            </div>
          </div>

          <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon className="text-primary" size={20} />
              <h3 className="text-lg font-black">ตัวอย่างหัวเว็บ</h3>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-[#146B3E] p-5 text-white">
              {settingsDraft.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settingsDraft.logoUrl} alt="Logo preview" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/20" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/16 text-xl font-black">ท</div>
              )}
              <div>
                <p className="text-xl font-black">{settingsDraft.siteName || "สวนทุเรียน"}</p>
                <p className="text-sm font-semibold uppercase tracking-widest text-white/70">{settingsDraft.tagline || "Smart Orchard"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              <h3 className="text-lg font-black">โหมดข้อมูล</h3>
            </div>
            <div className="grid gap-3 text-sm font-bold">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                <span className="text-muted-foreground">ใช้งานตอนนี้</span>
                <span className="text-foreground">{getDataModeLabel(appRuntimeConfig.dataMode)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                <span className="text-muted-foreground">Supabase env</span>
                <span className={isSupabaseConfigured ? "text-primary" : "text-red-600"}>
                  {isSupabaseConfigured ? "พร้อม" : "ยังไม่พร้อม"}
                </span>
              </div>
              <p className="text-xs font-semibold leading-6 text-muted-foreground">
                สลับโหมดด้วย `NEXT_PUBLIC_APP_DATA_MODE=local` หรือ `NEXT_PUBLIC_APP_DATA_MODE=supabase` ใน `.env.local` และบน server จริง
              </p>
            </div>
          </div>
          </div>
        </section>
      )}

      {activeSection === "articles" && (() => {
        const displaySlug = articleDraft.slug || createSlug(articleDraft.title || "หัวข้อบทความ")
        const displayMetaTitle = articleDraft.metaTitle || articleDraft.title || "หัวข้อบทความ"
        const displayMetaDescription = articleDraft.metaDescription || createExcerpt(articleDraft.content || "กรุณากรอกเนื้อหาบทความ...")
        return (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="text-primary" size={20} />
              <h3 className="text-lg font-black">จัดการบทความ</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                  <div>
                    <h4 className="text-base font-black text-foreground">
                      {editingArticleId ? "แก้ไขบทความ" : "เขียนบทความใหม่"}
                    </h4>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {editingArticleId ? "กำลังแก้ไขบทความที่เลือก" : "ใส่เนื้อหาและตั้งค่า SEO"}
                    </p>
                  </div>
                  {editingArticleId && (
                    <button
                      onClick={() => {
                        setEditingArticleId(null)
                        setArticleDraft(emptyArticle)
                        setMessage("ยกเลิกการแก้ไขแล้ว")
                      }}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-black text-muted-foreground hover:bg-muted"
                    >
                      ยกเลิกแก้ไข
                    </button>
                  )}
                </div>

                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/70 p-1 rounded-xl">
                    <TabsTrigger value="content" className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 py-2">
                      <FileText size={14} className="text-primary" />
                      เนื้อหาบทความ
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 py-2">
                      <Globe size={14} className="text-primary" />
                      การตั้งค่า SEO
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 py-2">
                      <Eye size={14} className="text-primary" />
                      SEO Preview
                    </TabsTrigger>
                  </TabsList>

                  {/* CONTENT TAB */}
                  <TabsContent value="content" className="space-y-3.5 focus-visible:outline-none focus:outline-none">
                    <AdminInput label="หัวข้อ" value={articleDraft.title} onChange={title => setArticleDraft(v => ({ ...v, title }))} required />
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdminInput label="หมวดหมู่" value={articleDraft.category} onChange={category => setArticleDraft(v => ({ ...v, category }))} required />
                      <label className="block space-y-1.5">
                        <span className="text-xs font-black text-muted-foreground">รูปภาพบทความ</span>
                        <div className="flex items-center gap-2">
                          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-black text-primary transition-colors hover:bg-primary/10">
                            <Upload size={14} />
                            อัปโหลดรูป
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => uploadImage(e.target.files?.[0], image => setArticleDraft(v => ({ ...v, image })), "รูปบทความ")}
                            />
                          </label>
                          {articleDraft.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={articleDraft.image} alt="Article preview" className="h-10 w-14 rounded-lg object-cover ring-1 ring-border shrink-0" />
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
                      <p className="text-xs font-black text-[#0F4A2E] dark:text-[#E7F3EC] flex items-center gap-1.5">
                        <ShoppingBag size={14} />
                        แนะนำปุ๋ย/ยา (Affiliate)
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AdminInput label="ชื่อปุ๋ย/ยาแนะนำ" value={articleDraft.affiliateTitle ?? ""} onChange={affiliateTitle => setArticleDraft(v => ({ ...v, affiliateTitle }))} placeholder="เช่น สารป้องกันเชื้อรา..." />
                        <AdminInput label="Affiliate link" value={articleDraft.affiliateUrl ?? ""} onChange={affiliateUrl => setArticleDraft(v => ({ ...v, affiliateUrl }))} placeholder="https://..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-muted-foreground mb-1.5">เนื้อหาบทความ *</label>
                      <textarea 
                        value={articleDraft.content} 
                        onChange={e => setArticleDraft(v => ({ ...v, content: e.target.value }))} 
                        required 
                        placeholder="เขียนเนื้อหาบทความที่นี่..." 
                        className="min-h-52 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary font-semibold leading-relaxed" 
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <select 
                        value={articleDraft.status} 
                        onChange={e => setArticleDraft(v => ({ ...v, status: e.target.value as Article["status"] }))} 
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none"
                      >
                        <option value="published">เผยแพร่ (แสดงทันที)</option>
                        <option value="draft">ฉบับร่าง (ซ่อนไว้ก่อน)</option>
                      </select>
                      <button onClick={saveArticle} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition-transform active:scale-95 shadow-md">
                        {editingArticleId ? <Save size={16} /> : <Plus size={16} />}
                        {editingArticleId ? "บันทึกการแก้ไข" : "เพิ่มบทความ"}
                      </button>
                    </div>
                  </TabsContent>

                  {/* SEO TAB */}
                  <TabsContent value="seo" className="space-y-3.5 focus-visible:outline-none focus:outline-none">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleAutoPopulateSEO}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-primary py-2.5 px-4 text-xs font-black text-white hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <Sparkles size={14} />
                        ดึงข้อมูลและเจน SEO อัตโนมัติ
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <AdminInput label="Slug" value={articleDraft.slug ?? ""} onChange={slug => setArticleDraft(v => ({ ...v, slug }))} placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" />
                        <span className="text-[10px] font-semibold text-muted-foreground block mt-1">ส่วนของ URL ที่ต้องการให้อ่านง่าย เช่น <code>kan-pluk-durian</code></span>
                      </div>
                      <div>
                        <AdminInput label="ผู้เขียน/ผู้ให้คำแนะนำ" value={articleDraft.authorName ?? ""} onChange={authorName => setArticleDraft(v => ({ ...v, authorName }))} placeholder="ทีมสวนทุเรียน" />
                        <span className="text-[10px] font-semibold text-muted-foreground block mt-1">ชื่อผู้แต่งแสดงใน Metadata (Schema.org)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-muted-foreground">Meta title</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{articleDraft.metaTitle?.length || 0} อักษร</span>
                          {(() => {
                            const badge = getTitleLengthBadge(articleDraft.metaTitle?.length || 0)
                            return <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                          })()}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={articleDraft.metaTitle ?? ""}
                        onChange={e => setArticleDraft(v => ({ ...v, metaTitle: e.target.value }))}
                        placeholder="ความยาวที่แนะนำ: 50-60 อักษร (เว้นว่างไว้จะใช้ชื่อหัวข้อ)"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus:border-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-muted-foreground">Meta description</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{articleDraft.metaDescription?.length || 0} อักษร</span>
                          {(() => {
                            const badge = getDescLengthBadge(articleDraft.metaDescription?.length || 0)
                            return <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                          })()}
                        </div>
                      </div>
                      <textarea
                        value={articleDraft.metaDescription ?? ""}
                        onChange={e => setArticleDraft(v => ({ ...v, metaDescription: e.target.value }))}
                        placeholder="ความยาวที่แนะนำ: 120-160 อักษร (เว้นว่างไว้จะตัดทอนจากเนื้อหาบทความ)"
                        rows={2}
                        className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold leading-6 outline-none transition-colors focus:border-primary"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdminInput label="Keywords" value={articleDraft.keywords ?? ""} onChange={keywords => setArticleDraft(v => ({ ...v, keywords }))} placeholder="เช่น ปุ๋ยทุเรียน, โรคทุเรียน" />
                      <AdminInput label="Alt รูปภาพ" value={articleDraft.imageAlt ?? ""} onChange={imageAlt => setArticleDraft(v => ({ ...v, imageAlt }))} placeholder="เว้นว่างเพื่อใช้ชื่อหัวข้อ" />
                    </div>

                    <AdminTextarea label="สรุปสั้นบทความ (Geo Summary / Abstract)" value={articleDraft.geoSummary ?? ""} onChange={geoSummary => setArticleDraft(v => ({ ...v, geoSummary }))} placeholder="สรุปเนื้อหาสั้นกระชับ เพื่อให้อ่านง่ายและส่งเสริมการค้นหาทางภูมิศาสตร์" rows={2} />
                  </TabsContent>

                  {/* PREVIEW TAB */}
                  <TabsContent value="preview" className="space-y-4 focus-visible:outline-none focus:outline-none">
                    {/* Google Search Mockup */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-muted-foreground flex items-center gap-1">
                        <Globe size={14} className="text-[#1a73e8]" />
                        ตัวอย่างผลลัพธ์บน Google Search
                      </p>
                      <div className="rounded-2xl border border-border bg-[#f8f9fa] dark:bg-muted/10 p-4 font-sans text-left shadow-inner transition-colors">
                        <div className="flex items-center gap-2 text-xs text-[#202124] dark:text-muted-foreground mb-1 font-sans">
                          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white dark:bg-card border border-border/80 text-primary font-black shrink-0 shadow-sm text-sm">ท</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-sans">
                              <span className="font-semibold text-foreground text-xs leading-none">Durian Flow</span>
                              <span className="text-[#5f6368] text-[10px] leading-none">&gt;</span>
                              <span className="truncate max-w-[120px] text-muted-foreground text-[10px] leading-none">{articleDraft.category || "การดูแลรักษา"}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium leading-none truncate max-w-[200px] mt-0.5 font-sans">https://appfarm-main.vercel.app/?article={displaySlug}</p>
                          </div>
                        </div>
                        <h4 className="text-[19px] leading-[1.3] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline font-normal font-sans mb-1 cursor-pointer truncate">
                          {displayMetaTitle}
                        </h4>
                        <p className="text-[13px] leading-[1.4] text-[#4d5156] dark:text-muted-foreground font-sans line-clamp-2">
                          {displayMetaDescription}
                        </p>
                      </div>
                    </div>

                    {/* Visual Excerpt Card Preview */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-muted-foreground flex items-center gap-1">
                        <ImageIcon size={14} className="text-primary" />
                        ตัวอย่างการ์ดแสดงบนหน้าเว็บ
                      </p>
                      <div className="mx-auto max-w-[280px] rounded-2xl border border-border/70 bg-card overflow-hidden shadow-md">
                        <div className="relative h-32 overflow-hidden bg-muted">
                          {articleDraft.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={articleDraft.image} alt={articleDraft.title || "Preview"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon size={24} /></div>
                          )}
                          <span className="absolute left-2 top-2 rounded-lg bg-background/80 px-2 py-0.5 text-[9px] font-black text-primary shadow-sm backdrop-blur-md">
                            {articleDraft.category || "หมวดหมู่"}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1.5">
                          <h5 className="text-sm font-black text-foreground line-clamp-2">{articleDraft.title || "หัวข้อบทความ"}</h5>
                          <p className="text-xs text-muted-foreground line-clamp-2 font-semibold">
                            {articleDraft.content ? createExcerpt(articleDraft.content, 90) : "เนื้อหาของบทความจะจำลองแสดงตรงนี้..."}
                          </p>
                          <div className="pt-2 text-xs font-black text-primary flex items-center gap-1">
                            <span>อ่านต่อ</span>
                            <ArrowRight size={12} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                {(() => {
                  const articlesPerPage = 10
                  const totalArticlePages = Math.ceil(articles.length / articlesPerPage)
                  const safeArticlePage = Math.min(articlePage, totalArticlePages || 1)
                  const paginatedArticles = articles.slice(
                    (safeArticlePage - 1) * articlesPerPage,
                    safeArticlePage * articlesPerPage
                  )
                  return (
                    <>
                      {paginatedArticles.map(article => (
                        <div key={article.id} className="flex gap-3 rounded-xl border border-border p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={article.image} alt={article.title} className="h-16 w-20 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">{article.title}</p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {article.category} · {article.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}
                              {article.affiliateUrl ? " · มี affiliate" : ""}
                            </p>
                          </div>
                          <button onClick={() => editArticle(article)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Edit3 size={16}/></button>
                          <button onClick={() => deleteArticle(article.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      ))}
                      {totalArticlePages > 1 && (
                        <div className="mt-4 flex items-center justify-between bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
                          <span className="text-xs font-bold text-muted-foreground">
                            บทความ {Math.min(articles.length, (safeArticlePage - 1) * articlesPerPage + 1)}-{Math.min(articles.length, safeArticlePage * articlesPerPage)} จาก {articles.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setArticlePage(prev => Math.max(1, prev - 1))}
                              disabled={safeArticlePage === 1}
                              className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-black px-2">{safeArticlePage} / {totalArticlePages}</span>
                            <button
                              type="button"
                              onClick={() => setArticlePage(prev => Math.min(totalArticlePages, prev + 1))}
                              disabled={safeArticlePage === totalArticlePages}
                              className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </section>
        )
      })()}

      {activeSection === "products" && (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingBag className="text-primary" size={20} />
          <h3 className="text-lg font-black">จัดการปุ๋ยและยา</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <AdminInput label="ชื่อปุ๋ย/ยา" value={productDraft.name} onChange={name => setProductDraft(v => ({ ...v, name }))} required />
            <AdminInput label="หมวดหมู่" value={productDraft.category} onChange={category => setProductDraft(v => ({ ...v, category }))} required />
            <AdminInput label="ข้อความราคา/ปุ่ม" value={productDraft.priceLabel} onChange={priceLabel => setProductDraft(v => ({ ...v, priceLabel }))} required />
            <AdminInput label="Affiliate link" value={productDraft.affiliateUrl} onChange={affiliateUrl => setProductDraft(v => ({ ...v, affiliateUrl }))} placeholder="https://..." required />
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-black text-muted-foreground">SEO / AI Search ปุ๋ยและยา</p>
              <div className="space-y-2">
                <AdminInput label="Slug" value={productDraft.slug ?? ""} onChange={slug => setProductDraft(v => ({ ...v, slug }))} placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ" />
                <AdminInput label="Meta title" value={productDraft.metaTitle ?? ""} onChange={metaTitle => setProductDraft(v => ({ ...v, metaTitle }))} placeholder="เว้นว่างเพื่อใช้ชื่อรายการ" />
                <AdminTextarea label="Meta description" value={productDraft.metaDescription ?? ""} onChange={metaDescription => setProductDraft(v => ({ ...v, metaDescription }))} placeholder="เว้นว่างเพื่อสรุปจากรายละเอียด" rows={3} />
                <AdminInput label="Keywords" value={productDraft.keywords ?? ""} onChange={keywords => setProductDraft(v => ({ ...v, keywords }))} placeholder="เช่น ปุ๋ยทุเรียน, ยาทุเรียน" />
                <AdminInput label="Alt รูปภาพ" value={productDraft.imageAlt ?? ""} onChange={imageAlt => setProductDraft(v => ({ ...v, imageAlt }))} placeholder="เว้นว่างเพื่อใช้ชื่อรายการ" />
                <AdminInput label="แบรนด์" value={productDraft.brandName ?? ""} onChange={brandName => setProductDraft(v => ({ ...v, brandName }))} placeholder="เว้นว่างเพื่อใช้ สวนทุเรียน" />
                <AdminInput label="SKU/รหัสสินค้า" value={productDraft.sku ?? ""} onChange={sku => setProductDraft(v => ({ ...v, sku }))} placeholder="ถ้ามี" />
                <AdminTextarea label="สรุปสั้น" value={productDraft.geoSummary ?? ""} onChange={geoSummary => setProductDraft(v => ({ ...v, geoSummary }))} placeholder="เว้นว่างเพื่อสรุปอัตโนมัติ" rows={3} />
              </div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-black text-muted-foreground">รูปปุ๋ย/ยา</span>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-black text-primary transition-colors hover:bg-primary/10">
                  <Upload size={16} />
                  อัปโหลดรูปปุ๋ย/ยา
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => uploadImage(e.target.files?.[0], image => setProductDraft(v => ({ ...v, image })), "รูปปุ๋ย/ยา")}
                  />
                </label>
                {productDraft.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productDraft.image} alt="Product preview" className="h-12 w-16 rounded-lg object-cover ring-1 ring-border" />
                )}
              </div>
            </label>
            <label className="block text-xs font-black text-muted-foreground">รายละเอียดสั้น *</label>
            <textarea value={productDraft.description} onChange={e => setProductDraft(v => ({ ...v, description: e.target.value }))} required placeholder="กรอกรายละเอียดสั้น" className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <select value={productDraft.status} onChange={e => setProductDraft(v => ({ ...v, status: e.target.value as Product["status"] }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none">
              <option value="active">แสดงหน้าแรก</option>
              <option value="draft">ซ่อน</option>
            </select>
            <button onClick={saveProduct} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
              {editingProductId ? <Save size={16} /> : <Plus size={16} />}
              {editingProductId ? "บันทึกการแก้ไข" : "เพิ่มปุ๋ย/ยา"}
            </button>
          </div>
          <div className="space-y-2">
            {(() => {
              const productsPerPage = 10
              const totalProductPages = Math.ceil(products.length / productsPerPage)
              const safeProductPage = Math.min(productPage, totalProductPages || 1)
              const paginatedProducts = products.slice(
                (safeProductPage - 1) * productsPerPage,
                safeProductPage * productsPerPage
              )
              return (
                <>
                  {paginatedProducts.map(product => (
                    <div key={product.id} className="flex gap-3 rounded-xl border border-border p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.imageAlt || product.name} className="h-16 w-20 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{product.name}</p>
                        <p className="text-xs font-semibold text-muted-foreground">{product.category} · {product.status === "active" ? "แสดง" : "ซ่อน"}</p>
                      </div>
                      <button onClick={() => editProduct(product)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Edit3 size={16} /></button>
                      <button onClick={() => deleteProduct(product.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {totalProductPages > 1 && (
                    <div className="mt-4 flex items-center justify-between bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
                      <span className="text-xs font-bold text-muted-foreground">
                        สินค้า {Math.min(products.length, (safeProductPage - 1) * productsPerPage + 1)}-{Math.min(products.length, safeProductPage * productsPerPage)} จาก {products.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                          disabled={safeProductPage === 1}
                          className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-black px-2">{safeProductPage} / {totalProductPages}</span>
                        <button
                          type="button"
                          onClick={() => setProductPage(prev => Math.min(totalProductPages, prev + 1))}
                          disabled={safeProductPage === totalProductPages}
                          className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </section>
      )}

      {activeSection === "users" && (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="text-primary" size={20} />
          <h3 className="text-lg font-black">จัดการ User</h3>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminInput label="ชื่อ" value={userDraft.name} onChange={name => setUserDraft(v => ({ ...v, name }))} required />
          <AdminInput label="อีเมล" value={userDraft.email} onChange={email => setUserDraft(v => ({ ...v, email }))} type="email" required />
          <AdminInput label="รหัสผ่าน" value={userDraft.password} onChange={password => setUserDraft(v => ({ ...v, password }))} type="password" required />
          <select value={userDraft.role} onChange={e => setUserDraft(v => ({ ...v, role: e.target.value as AppUser["role"] }))} className="self-end rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={createUser} className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground">เพิ่ม User</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs font-black text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3">ชื่อ</th>
                <th>อีเมล</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const usersPerPage = 10
                const totalUserPages = Math.ceil(users.length / usersPerPage)
                const safeUserPage = Math.min(userPage, totalUserPages || 1)
                const paginatedUsers = users.slice(
                  (safeUserPage - 1) * usersPerPage,
                  safeUserPage * usersPerPage
                )
                return paginatedUsers.map(user => (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="py-3 font-bold">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select value={user.role} onChange={e => updateUser(user.id, { role: e.target.value as AppUser["role"] })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select value={user.status} onChange={e => updateUser(user.id, { status: e.target.value as AppUser["status"] })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold">
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <button disabled={user.id === currentUser.id} onClick={() => deleteUser(user.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
        {(() => {
          const usersPerPage = 10
          const totalUserPages = Math.ceil(users.length / usersPerPage)
          const safeUserPage = Math.min(userPage, totalUserPages || 1)
          if (totalUserPages <= 1) return null
          return (
            <div className="mt-4 flex items-center justify-between bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
              <span className="text-xs font-bold text-muted-foreground">
                ผู้ใช้ {Math.min(users.length, (safeUserPage - 1) * usersPerPage + 1)}-{Math.min(users.length, safeUserPage * usersPerPage)} จาก {users.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                  disabled={safeUserPage === 1}
                  className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-black px-2">{safeUserPage} / {totalUserPages}</span>
                <button
                  type="button"
                  onClick={() => setUserPage(prev => Math.min(totalUserPages, prev + 1))}
                  disabled={safeUserPage === totalUserPages}
                  className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )
        })()}
      </section>
      )}
      {activeSection === "feedback" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-primary" size={20} />
              <h3 className="text-lg font-black">ข้อเสนอแนะและข้อมูลติดต่อจากผู้ใช้ ({feedbacks.length})</h3>
            </div>
            {feedbacks.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("คุณต้องการลบข้อเสนอแนะทั้งหมดหรือไม่?")) {
                    setFeedbacks([])
                    localStorage.setItem("appfarm_feedback", JSON.stringify([]))
                  }
                }}
                className="text-xs font-bold text-destructive hover:underline"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-semibold">
              ยังไม่มีข้อความส่งเข้ามาจากผู้ใช้
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {(() => {
                  const feedbackPerPage = 10
                  const totalFeedbackPages = Math.ceil(feedbacks.length / feedbackPerPage)
                  const safeFeedbackPage = Math.min(feedbackPage, totalFeedbackPages || 1)
                  const paginatedFeedbacks = feedbacks.slice(
                    (safeFeedbackPage - 1) * feedbackPerPage,
                    safeFeedbackPage * feedbackPerPage
                  )
                  return paginatedFeedbacks.map(f => (
                    <div key={f.id} className="rounded-2xl border border-border bg-background p-4 relative group">
                      <button
                        onClick={() => handleDeleteFeedback(f.id)}
                        className="absolute right-3 top-3 p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="ลบข้อเสนอแนะ"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className="font-black text-[#146B3E] text-base">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(f.date).toLocaleString("th-TH")}</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground bg-muted/40 rounded-xl px-3.5 py-2.5 mb-2 leading-relaxed">
                        {f.message}
                      </div>
                      <div className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                        <span>ช่องทางติดต่อกลับ:</span>
                        <span className="text-[#146B3E] bg-[#E7F3EC] px-2 py-0.5 rounded-md font-bold">{f.contact || "ไม่ได้ระบุ"}</span>
                      </div>
                    </div>
                  ))
                })()}
              </div>

              {(() => {
                const feedbackPerPage = 10
                const totalFeedbackPages = Math.ceil(feedbacks.length / feedbackPerPage)
                const safeFeedbackPage = Math.min(feedbackPage, totalFeedbackPages || 1)
                if (totalFeedbackPages <= 1) return null
                return (
                  <div className="mt-4 flex items-center justify-between bg-muted/30 px-3 py-2 rounded-xl border border-border/40">
                    <span className="text-xs font-bold text-muted-foreground">
                      ข้อเสนอแนะ {Math.min(feedbacks.length, (safeFeedbackPage - 1) * feedbackPerPage + 1)}-{Math.min(feedbacks.length, safeFeedbackPage * feedbackPerPage)} จาก {feedbacks.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFeedbackPage(prev => Math.max(1, prev - 1))}
                        disabled={safeFeedbackPage === 1}
                        className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-black px-2">{safeFeedbackPage} / {totalFeedbackPages}</span>
                      <button
                        type="button"
                        onClick={() => setFeedbackPage(prev => Math.min(totalFeedbackPages, prev + 1))}
                        disabled={safeFeedbackPage === totalFeedbackPages}
                        className="p-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </section>
      )}
    </div>
  )
}

function AdminInput({ label, value, onChange, placeholder, required = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: "text" | "email" | "password" }) {
  const inputId = useId()
  const inputName = `${label.replace(/\s+/g, "-").toLowerCase()}-input`
  return (
    <label htmlFor={inputId} className="block space-y-1.5">
      <span className="text-xs font-black text-muted-foreground">{label}{required ? " *" : ""}</span>
      <input
        id={inputId}
        name={inputName}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? (required ? `กรอก${label}` : undefined)}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus:border-primary"
      />
    </label>
  )
}

function AdminTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  const textareaId = useId()
  const textareaName = `${label.replace(/\s+/g, "-").toLowerCase()}-textarea`
  return (
    <label htmlFor={textareaId} className="block space-y-1.5">
      <span className="text-xs font-black text-muted-foreground">{label}</span>
      <textarea
        id={textareaId}
        name={textareaName}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold leading-6 outline-none transition-colors focus:border-primary"
      />
    </label>
  )
}
