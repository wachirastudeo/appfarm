import { createBrowserClient } from "@supabase/ssr"
import { appRuntimeConfig, isLocalDemo, supabasePublicKey } from "@/lib/runtime-config"

export function createClient() {
  if (isLocalDemo) throw new Error("Supabase is disabled in local demo mode.")
  if (!appRuntimeConfig.supabaseUrl || !supabasePublicKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
  }

  return createBrowserClient(appRuntimeConfig.supabaseUrl, supabasePublicKey)
}
