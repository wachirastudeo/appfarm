import type { AppData, AppUser, NewUserInput } from "@/lib/store"

export async function cloudflareRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/cloudflare/${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
  return result as T
}

async function authRequest(path: string, body: object) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || "เข้าสู่ระบบไม่สำเร็จ")
  return result
}

export async function authenticateCloudflare(email: string, password: string) {
  await authRequest("sign-in/email", { email, password })
  return getCloudflareSession()
}

export async function registerCloudflare(user: NewUserInput) {
  await authRequest("sign-up/email", { name: user.name, email: user.email, password: user.password })
  return getCloudflareSession()
}

export async function signOutCloudflare() {
  await authRequest("sign-out", {})
}

export async function startCloudflareOAuth(provider: "google" | "line") {
  const result = await authRequest(provider === "google" ? "sign-in/social" : "sign-in/oauth2", {
    ...(provider === "google" ? { provider } : { providerId: provider }), callbackURL: "/",
  })
  if (!result.url) throw new Error("ยังไม่ได้ตั้งค่าผู้ให้บริการเข้าสู่ระบบนี้")
  window.location.assign(result.url)
}

export async function getCloudflareSession() {
  const result = await cloudflareRequest<{ user: AppUser | null }>("session")
  return result.user
}

export function loadCloudflareData() {
  return cloudflareRequest<Partial<AppData>>("data")
}

export function saveCloudflareData(data: AppData) {
  return cloudflareRequest("data", { method: "PUT", body: JSON.stringify({
    plots: data.plots, activities: data.activities, tasks: data.tasks, finance: data.finance,
  }) })
}

export function updateCloudflareProfile(id: string, changes: Partial<AppUser>) {
  return cloudflareRequest<AppUser>("profile", { method: "PATCH", body: JSON.stringify({ id, ...changes }) })
}

export function createCloudflareUser(user: NewUserInput) {
  return cloudflareRequest<AppUser>("users", { method: "POST", body: JSON.stringify({
    name: user.name, email: user.email, password: user.password, role: user.role,
  }) })
}

export type FeedbackEntry = { id: string; name: string; contact: string; message: string; date: string }

export function sendCloudflareFeedback(entry: Pick<FeedbackEntry, "name" | "contact" | "message">) {
  return cloudflareRequest("feedback", { method: "POST", body: JSON.stringify(entry) })
}

export async function loadCloudflareFeedback() {
  return (await cloudflareRequest<{ feedback: FeedbackEntry[] }>("feedback")).feedback
}

export function deleteCloudflareFeedback(target: { id: string } | { all: true }) {
  return cloudflareRequest("feedback", { method: "DELETE", body: JSON.stringify(target) })
}

export function saveCloudflareContent(kind: "articles" | "products" | "settings", value: unknown, id?: string) {
  return cloudflareRequest("content", { method: "PUT", body: JSON.stringify({ kind, value, id }) })
}

export function deleteCloudflareContent(kind: "articles" | "products", id: string) {
  return cloudflareRequest("content", { method: "DELETE", body: JSON.stringify({ kind, id }) })
}
