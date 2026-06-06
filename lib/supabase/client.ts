import { createBrowserClient } from "@supabase/ssr"
import { appRuntimeConfig, supabasePublicKey } from "@/lib/runtime-config"

export function createClient() {
  if (!appRuntimeConfig.supabaseUrl || !supabasePublicKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
  }

  return createBrowserClient(appRuntimeConfig.supabaseUrl, supabasePublicKey, {
    auth: {
      autoRefreshToken: process.env.NODE_ENV === "production",
      persistSession: process.env.NODE_ENV === "production",
    },
  })
}
