import { env } from "cloudflare:workers"
import type { D1Database, R2Bucket } from "@cloudflare/workers-types"

export interface CloudflareBindings {
  DB: D1Database
  MEDIA?: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  LINE_CLIENT_ID?: string
  LINE_CLIENT_SECRET?: string
}

export function getBindings() {
  const bindings = env as unknown as CloudflareBindings
  if (!bindings?.DB) throw new Error("Cloudflare D1 is not available. Run npm run dev:cloudflare.")
  return bindings
}
