import { NextResponse } from "next/server"
import { appRuntimeConfig, isSupabaseConfigured, isCloudflareMode } from "@/lib/runtime-config"
import { getBindings } from "@/lib/cloudflare/context"

export async function GET() {
  if (isCloudflareMode) {
    try {
      await getBindings().DB.prepare("SELECT 1").first()
      return NextResponse.json({ ok: true, dataMode: "cloudflare", database: "D1", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } })
    } catch {
      return NextResponse.json({ ok: false, dataMode: "cloudflare", database: "unavailable" }, { status: 503 })
    }
  }
  return NextResponse.json({
    ok: true,
    dataMode: appRuntimeConfig.dataMode,
    supabaseConfigured: isSupabaseConfigured,
    checkedAt: new Date().toISOString(),
  })
}
