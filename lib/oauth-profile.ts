import type { User } from "@supabase/supabase-js"

const NAME_KEYS = ["name", "full_name", "display_name", "displayName", "preferred_username"] as const
const AVATAR_KEYS = ["picture", "avatar_url", "avatar", "photo", "image", "profile_image_url"] as const

function pickString(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return undefined
}

function mergeMetadata(...records: Array<Record<string, unknown> | undefined>) {
  return records.reduce<Record<string, unknown>>((acc, record) => {
    if (!record) return acc
    return { ...acc, ...record }
  }, {})
}

export function normalizeAuthProvider(raw?: string) {
  if (!raw) return "oauth"
  const normalized = raw.replace(/^custom:/, "").toLowerCase()
  if (normalized === "line" || normalized.includes("line")) return "line"
  return normalized
}

export type ResolvedOAuthProfile = {
  email: string
  name?: string
  provider: string
  avatar?: string
}

export function resolveOAuthProfileFromAuthUser(authUser: User): ResolvedOAuthProfile | null {
  const provider = normalizeAuthProvider(
    typeof authUser.app_metadata?.provider === "string" ? authUser.app_metadata.provider : undefined,
  )

  const identityMetadata = (authUser.identities ?? [])
    .map(identity => identity.identity_data)
    .filter((data): data is Record<string, unknown> => Boolean(data) && typeof data === "object")

  const metadata = mergeMetadata(
    authUser.user_metadata as Record<string, unknown>,
    ...identityMetadata,
  )

  // LINE (and some OIDC providers) may not return an email — synthesize one from the user id
  const email = authUser.email?.trim()
    || `${provider}-${authUser.id}@oauth.local`

  if (!email) return null

  return {
    email,
    name: pickString(metadata, NAME_KEYS),
    provider,
    avatar: pickString(metadata, AVATAR_KEYS),
  }
}
