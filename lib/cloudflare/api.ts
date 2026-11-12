import { z } from "zod"
import type { AppUser } from "@/lib/store"
import { getAuth } from "./auth"
import { getBindings } from "./context"

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const orchardSchema = z.object({
  plots: z.array(z.object({ id: z.string(), trees: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough()).max(1000),
  tasks: z.array(z.object({ id: z.string() }).passthrough()).max(10000),
  activities: z.array(z.object({ id: z.string() }).passthrough()).max(10000),
  finance: z.array(z.object({ id: z.string() }).passthrough()).max(10000),
})

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatar: z.string().max(350000).optional(),
  coverImage: z.string().max(350000).optional(),
  coverPositionX: z.number().min(0).max(100).optional(),
  coverPositionY: z.number().min(0).max(100).optional(),
  farmName: z.string().max(120).optional(),
  farmLocation: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), label: z.string().max(500) }).optional(),
  savedArticleIds: z.array(z.string().max(100)).max(1000).optional(),
})

const emptyOrchard = { plots: [], tasks: [], activities: [], finance: [] }

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } })
}

async function body(request: Request) {
  const reader = request.body?.getReader()
  const decoder = new TextDecoder()
  let text = ""
  let size = 0
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 900000) {
          await reader.cancel()
          throw new ApiError(413, "ข้อมูลมีขนาดใหญ่เกินไป กรุณาลดขนาดรูปหรือแบ่งข้อมูล")
        }
        text += decoder.decode(value, { stream: true })
      }
      text += decoder.decode()
    } finally { reader.releaseLock() }
  }
  try { return JSON.parse(text) } catch { throw new ApiError(400, "รูปแบบข้อมูลไม่ถูกต้อง") }
}

async function currentUser(request: Request): Promise<AppUser | null> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) return null
  const db = getBindings().DB
  await db.prepare("INSERT OR IGNORE INTO profiles (id, data) VALUES (?, '{}')").bind(session.user.id).run()
  const profile = await db.prepare("SELECT role, status, data FROM profiles WHERE id = ?").bind(session.user.id)
    .first<{ role: AppUser["role"]; status: AppUser["status"]; data: string }>()
  if (!profile || profile.status !== "active") throw new ApiError(403, "บัญชีนี้ถูกระงับการใช้งาน")
  const account = await db.prepare('SELECT "providerId" FROM account WHERE "userId" = ? LIMIT 1').bind(session.user.id).first<{ providerId: string }>()
  return {
    ...JSON.parse(profile.data), id: session.user.id, name: session.user.name, email: session.user.email,
    avatar: JSON.parse(profile.data).avatar || session.user.image || undefined,
    role: profile.role, status: profile.status, provider: account?.providerId === "credential" ? "email" : account?.providerId || "email",
    passwordHash: "", createdAt: new Date(session.user.createdAt).toISOString(),
  }
}

export async function handleCloudflareApi(request: Request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api\/cloudflare\//, "")
    if (request.method !== "GET" && request.headers.get("origin") !== url.origin) {
      throw new ApiError(403, "ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น")
    }
    const env = getBindings()
    const user = await currentUser(request)
    if (path === "session" && request.method === "GET") return json({ user })
    if (path === "providers" && request.method === "GET") return json({
      google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      line: Boolean(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET),
    })
    if (path === "data" && request.method === "GET") {
      const content = await env.DB.prepare("SELECT kind, data FROM content").all<{ kind: string; data: string }>()
      const articles = content.results.filter(row => row.kind === "articles").map(row => JSON.parse(row.data))
        .filter(item => user?.role === "admin" || item.status === "published")
      const products = content.results.filter(row => row.kind === "products").map(row => JSON.parse(row.data))
        .filter(item => user?.role === "admin" || item.status === "active")
      const settings = content.results.find(row => row.kind === "settings")
      const saved = user ? await env.DB.prepare("SELECT data FROM orchard_data WHERE owner_id = ?").bind(user.id).first<{ data: string }>() : null
      const users = user?.role === "admin" ? (await env.DB.prepare(
        'SELECT u.id, u.name, u.email, u."createdAt", p.role, p.status, p.data FROM "user" u JOIN profiles p ON p.id = u.id',
      ).all<{ id: string; name: string; email: string; createdAt: number; role: string; status: string; data: string }>()).results.map(row => ({
        ...JSON.parse(row.data), id: row.id, name: row.name, email: row.email,
        role: row.role, status: row.status, provider: "email", passwordHash: "", createdAt: new Date(row.createdAt).toISOString(),
      })) : user ? [user] : []
      return json({
        ...(saved ? JSON.parse(saved.data) : emptyOrchard), users, articles, products,
        ...(settings ? { siteSettings: JSON.parse(settings.data) } : {}),
      })
    }
    if (!user) throw new ApiError(401, "กรุณาเข้าสู่ระบบ")
    if (path === "data" && request.method === "PUT") {
      const data = orchardSchema.parse(await body(request))
      await env.DB.prepare("INSERT INTO orchard_data (owner_id, data) VALUES (?, ?) ON CONFLICT(owner_id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP")
        .bind(user.id, JSON.stringify(data)).run()
      return json({ ok: true })
    }
    if (path === "profile" && request.method === "PATCH") {
      const input = await body(request)
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "รูปแบบข้อมูลไม่ถูกต้อง")
      const id = typeof input.id === "string" ? input.id : user.id
      if (id !== user.id && user.role !== "admin") throw new ApiError(403, "ไม่สามารถแก้ไขข้อมูลผู้ใช้อื่นได้")
      const changes = profileSchema.parse(input)
      const previous = await env.DB.prepare("SELECT data FROM profiles WHERE id = ?").bind(id).first<{ data: string }>()
      if (!previous) throw new ApiError(404, "ไม่พบผู้ใช้")
      const statements = [env.DB.prepare("UPDATE profiles SET data = ? WHERE id = ?").bind(JSON.stringify({ ...JSON.parse(previous.data), ...changes }), id)]
      if (changes.name) statements.push(env.DB.prepare('UPDATE "user" SET name = ? WHERE id = ?').bind(changes.name, id))
      if (user.role === "admin" && id !== user.id) {
        if (["admin", "user"].includes(input.role)) statements.push(env.DB.prepare("UPDATE profiles SET role = ? WHERE id = ?").bind(input.role, id))
        if (["active", "disabled"].includes(input.status)) statements.push(env.DB.prepare("UPDATE profiles SET status = ? WHERE id = ?").bind(input.status, id))
      }
      await env.DB.batch(statements)
      return json(id === user.id ? await currentUser(request) : { ...changes, id })
    }
    if (path === "users" && request.method === "DELETE") {
      if (user.role !== "admin") throw new ApiError(403, "เฉพาะผู้ดูแลระบบเท่านั้น")
      const input = z.object({ id: z.string().min(1) }).parse(await body(request))
      if (input.id === user.id) throw new ApiError(400, "ไม่สามารถลบบัญชีที่กำลังใช้งานได้")
      await env.DB.prepare('DELETE FROM "user" WHERE id = ?').bind(input.id).run()
      return json({ ok: true })
    }
    if (path === "content" && ["PUT", "DELETE"].includes(request.method)) {
      if (user.role !== "admin") throw new ApiError(403, "เฉพาะผู้ดูแลระบบเท่านั้น")
      const input = z.object({ kind: z.enum(["articles", "products", "settings"]), id: z.string().max(100).optional(), value: z.record(z.string(), z.unknown()).optional() }).parse(await body(request))
      const id = input.kind === "settings" ? "default" : input.id || input.value?.id
      if (typeof id !== "string" || !id) throw new ApiError(400, "ไม่พบรหัสข้อมูล")
      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM content WHERE kind = ? AND id = ?").bind(input.kind, id).run()
      } else {
        if (!input.value) throw new ApiError(400, "ไม่พบข้อมูลที่ต้องการบันทึก")
        await env.DB.prepare("INSERT INTO content (kind, id, data) VALUES (?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data")
          .bind(input.kind, id, JSON.stringify(input.value)).run()
      }
      return json({ ok: true })
    }
    throw new ApiError(404, "ไม่พบรายการที่ต้องการ")
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status)
    if (error instanceof z.ZodError) return json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง" }, 400)
    console.error("Cloudflare API failed", error)
    return json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองอีกครั้ง" }, 503)
  }
}
