"use client"
import { useState } from "react"
import type { AppUser, Article, NewUserInput, SiteSettings } from "@/lib/store"
import { BookOpen, Edit3, Image, Plus, Save, Settings, Shield, Trash2, Upload, Users } from "lucide-react"

interface Props {
  users: AppUser[]
  articles: Article[]
  siteSettings: SiteSettings
  currentUser: AppUser
  addUser: (user: NewUserInput) => Promise<AppUser | null>
  updateUser: (id: string, changes: Partial<AppUser>) => void
  deleteUser: (id: string) => void
  addArticle: (article: Omit<Article, "id" | "createdAt" | "updatedAt">) => void
  updateArticle: (id: string, changes: Partial<Article>) => void
  deleteArticle: (id: string) => void
  updateSiteSettings: (changes: Partial<SiteSettings>) => void
}

const emptyArticle = {
  title: "",
  category: "การดูแลรักษา",
  image: "/images/articles/article_watering_1778037948644.avif",
  content: "",
  status: "published" as const,
}

export default function AdminPanel({
  users,
  articles,
  siteSettings,
  currentUser,
  addUser,
  updateUser,
  deleteUser,
  addArticle,
  updateArticle,
  deleteArticle,
  updateSiteSettings,
}: Props) {
  const [activeSection, setActiveSection] = useState<"site" | "articles" | "users">("site")
  const [settingsDraft, setSettingsDraft] = useState(siteSettings)
  const [articleDraft, setArticleDraft] = useState<Omit<Article, "id" | "createdAt" | "updatedAt">>(emptyArticle)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [userDraft, setUserDraft] = useState({ name: "", email: "", password: "", role: "user" as AppUser["role"] })
  const [message, setMessage] = useState("")

  const uploadImage = async (file: File | undefined, onDone: (dataUrl: string) => void, label: string) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพ")
      return
    }
    try {
      const dataUrl = await convertImageToAvifDataUrl(file)
      onDone(dataUrl)
      setMessage(`อัปโหลด${label}แล้ว กดบันทึกเพื่อนำไปใช้`)
    } catch {
      setMessage(`อัปโหลด${label}ไม่สำเร็จ`)
    }
  }

  const saveSettings = () => {
    updateSiteSettings(settingsDraft)
    setMessage("บันทึกตั้งค่าเว็บแล้ว")
  }

  const saveArticle = () => {
    if (!articleDraft.title.trim() || !articleDraft.content.trim()) {
      setMessage("กรุณากรอกหัวข้อและเนื้อหาบทความ")
      return
    }
    if (editingArticleId) {
      updateArticle(editingArticleId, articleDraft)
      setEditingArticleId(null)
    } else {
      addArticle(articleDraft)
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
      content: article.content,
      status: article.status,
    })
  }

  const createUser = async () => {
    if (!userDraft.name.trim() || !userDraft.email.trim() || !userDraft.password.trim()) {
      setMessage("กรุณากรอกข้อมูล user ให้ครบ")
      return
    }
    const created = await addUser({
      ...userDraft,
      status: "active",
      provider: "email",
    })
    setMessage(created ? "สร้าง user แล้ว" : "อีเมลนี้มีผู้ใช้งานแล้ว")
    if (created) setUserDraft({ name: "", email: "", password: "", role: "user" })
  }

  return (
    <div className="space-y-6 pb-12">
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
          { id: "users" as const, label: "User", icon: Users },
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
              <AdminInput label="ชื่อเว็บ" value={settingsDraft.siteName} onChange={siteName => setSettingsDraft(v => ({ ...v, siteName }))} />
              <AdminInput label="คำโปรย" value={settingsDraft.tagline} onChange={tagline => setSettingsDraft(v => ({ ...v, tagline }))} />
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
              <button onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
                <Save size={16} />
                บันทึกตั้งค่า
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Image className="text-primary" size={20} />
              <h3 className="text-lg font-black">ตัวอย่างหัวเว็บ</h3>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-[#146B3E] p-5 text-white">
              {settingsDraft.logoUrl ? (
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
        </section>
      )}

      {activeSection === "articles" && (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="text-primary" size={20} />
          <h3 className="text-lg font-black">จัดการบทความ</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <AdminInput label="หัวข้อ" value={articleDraft.title} onChange={title => setArticleDraft(v => ({ ...v, title }))} />
            <AdminInput label="หมวดหมู่" value={articleDraft.category} onChange={category => setArticleDraft(v => ({ ...v, category }))} />
            <label className="block space-y-1.5">
              <span className="text-xs font-black text-muted-foreground">รูปภาพบทความ</span>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-black text-primary transition-colors hover:bg-primary/10">
                  <Upload size={16} />
                  อัปโหลดรูปบทความ
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => uploadImage(e.target.files?.[0], image => setArticleDraft(v => ({ ...v, image })), "รูปบทความ")}
                  />
                </label>
                {articleDraft.image && (
                  <img src={articleDraft.image} alt="Article preview" className="h-12 w-16 rounded-lg object-cover ring-1 ring-border" />
                )}
              </div>
            </label>
            <label className="block text-xs font-black text-muted-foreground">เนื้อหา</label>
            <textarea value={articleDraft.content} onChange={e => setArticleDraft(v => ({ ...v, content: e.target.value }))} className="min-h-40 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <select value={articleDraft.status} onChange={e => setArticleDraft(v => ({ ...v, status: e.target.value as Article["status"] }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none">
              <option value="published">เผยแพร่</option>
              <option value="draft">ฉบับร่าง</option>
            </select>
            <button onClick={saveArticle} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
              {editingArticleId ? <Save size={16} /> : <Plus size={16} />}
              {editingArticleId ? "บันทึกการแก้ไข" : "เพิ่มบทความ"}
            </button>
          </div>
          <div className="space-y-2">
            {articles.map(article => (
              <div key={article.id} className="flex gap-3 rounded-xl border border-border p-3">
                <img src={article.image} alt={article.title} className="h-16 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{article.title}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{article.category} · {article.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</p>
                </div>
                <button onClick={() => editArticle(article)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Edit3 size={16} /></button>
                <button onClick={() => deleteArticle(article.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            ))}
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
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <AdminInput label="ชื่อ" value={userDraft.name} onChange={name => setUserDraft(v => ({ ...v, name }))} />
          <AdminInput label="อีเมล" value={userDraft.email} onChange={email => setUserDraft(v => ({ ...v, email }))} />
          <AdminInput label="รหัสผ่าน" value={userDraft.password} onChange={password => setUserDraft(v => ({ ...v, password }))} />
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
              {users.map(user => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  )
}

function AdminInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus:border-primary"
      />
    </label>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function convertImageToAvifDataUrl(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img")
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = originalDataUrl
  })

  const maxSize = 1400
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext("2d")
  if (!context) return originalDataUrl
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/avif", 0.82))
  if (!blob || blob.type !== "image/avif") return originalDataUrl
  return readFileAsDataUrl(new File([blob], "upload.avif", { type: "image/avif" }))
}
