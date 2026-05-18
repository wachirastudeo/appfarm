export type AppDataMode = "local" | "supabase"

function normalizeDataMode(value: string | undefined): AppDataMode {
  return value === "supabase" ? "supabase" : "local"
}

export const appRuntimeConfig = {
  dataMode: normalizeDataMode(process.env.NEXT_PUBLIC_APP_DATA_MODE),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseStorageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "app-images",
}

export const isSupabaseConfigured = Boolean(
  appRuntimeConfig.supabaseUrl && appRuntimeConfig.supabaseAnonKey
)

export function getDataModeLabel(mode: AppDataMode) {
  return mode === "supabase" ? "Supabase / Server จริง" : "Local / ทดลองในเครื่อง"
}
