export type AppDataMode = "local" | "supabase" | "cloudflare"

function normalizeDataMode(value: string | undefined): AppDataMode {
  if (value === "local" || value === "supabase" || value === "cloudflare") return value
  return process.env.NODE_ENV === "production" ? "cloudflare" : "local"
}

export const appRuntimeConfig = {
  dataMode: normalizeDataMode(process.env.NEXT_PUBLIC_APP_DATA_MODE),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseStorageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "app-images",
}

export const isLocalDemo = appRuntimeConfig.dataMode === "local"
export const isCloudflareMode = appRuntimeConfig.dataMode === "cloudflare"

export function getModeStorageKey(key: string) {
  return isLocalDemo ? `demo_${key}` : isCloudflareMode ? `cloudflare_${key}` : key
}

export const supabasePublicKey =
  appRuntimeConfig.supabasePublishableKey || appRuntimeConfig.supabaseAnonKey

export const isSupabaseConfigured = Boolean(
  appRuntimeConfig.dataMode === "supabase" && appRuntimeConfig.supabaseUrl && supabasePublicKey
)

export const supabasePublicKeyType = appRuntimeConfig.supabasePublishableKey
  ? "publishable"
  : appRuntimeConfig.supabaseAnonKey
    ? "anon"
    : "missing"

export function getDataModeLabel(mode: AppDataMode) {
  if (mode === "cloudflare") return "Cloudflare Workers / D1"
  return mode === "supabase" ? "Supabase / Server จริง" : "Local / ทดลองในเครื่อง"
}
