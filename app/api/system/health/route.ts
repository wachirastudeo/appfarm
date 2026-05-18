import { NextResponse } from "next/server"
import { appRuntimeConfig, isSupabaseConfigured } from "@/lib/runtime-config"

export function GET() {
  return NextResponse.json({
    ok: true,
    dataMode: appRuntimeConfig.dataMode,
    supabaseConfigured: isSupabaseConfigured,
    supabaseStorageBucket: appRuntimeConfig.supabaseStorageBucket,
    nextAuthUrlConfigured: Boolean(process.env.NEXTAUTH_URL),
    nodeEnv: process.env.NODE_ENV ?? "development",
    checkedAt: new Date().toISOString(),
  })
}
