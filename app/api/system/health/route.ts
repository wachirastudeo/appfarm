import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/runtime-config"

export function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: isSupabaseConfigured,
    checkedAt: new Date().toISOString(),
  })
}
