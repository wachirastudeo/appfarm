export type AppDataMode = "local" | "supabase"

function normalizeDataMode(value: string | undefined): AppDataMode {
  if (value === "local" || value === "supabase") return value
  return process.env.NODE_ENV === "production" ? "supabase" : "local"
}

export const appRuntimeConfig = {
  dataMode: normalizeDataMode(process.env.NEXT_PUBLIC_APP_DATA_MODE),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseStorageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "app-images",
}

export const isLocalDemo = appRuntimeConfig.dataMode === "local"

export function getModeStorageKey(key: string) {
  return isLocalDemo ? `demo_${key}` : key
}

export const supabasePublicKey =
  appRuntimeConfig.supabasePublishableKey || appRuntimeConfig.supabaseAnonKey

export const isSupabaseConfigured = Boolean(
  !isLocalDemo && appRuntimeConfig.supabaseUrl && supabasePublicKey
)

export const supabasePublicKeyType = appRuntimeConfig.supabasePublishableKey
  ? "publishable"
  : appRuntimeConfig.supabaseAnonKey
    ? "anon"
    : "missing"

export function getDataModeLabel(mode: AppDataMode) {
  return mode === "supabase" ? "Supabase / Server จริง" : "Local / ทดลองในเครื่อง"
}
