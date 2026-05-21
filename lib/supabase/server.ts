import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { appRuntimeConfig, supabasePublicKey } from "@/lib/runtime-config"

export async function createClient() {
  if (!appRuntimeConfig.supabaseUrl || !supabasePublicKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
  }

  const cookieStore = await cookies()

  return createServerClient(appRuntimeConfig.supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies; Route Handlers and Server Actions can.
        }
      },
    },
  })
}
