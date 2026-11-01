import { betterAuth } from "better-auth"
import { genericOAuth } from "better-auth/plugins"
import { getBindings, type CloudflareBindings } from "./context"

const authInstances = new WeakMap<object, ReturnType<typeof createAuth>>()

export function getAuth() {
  const env = getBindings()
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Set BETTER_AUTH_SECRET to at least 32 random characters.")
  }
  const cached = authInstances.get(env.DB)
  if (cached) return cached
  const auth = createAuth(env)
  authInstances.set(env.DB, auth)
  return auth
}

function createAuth(env: CloudflareBindings) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
    socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    } : {},
    plugins: env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET ? [genericOAuth({
      config: [{
        providerId: "line",
        clientId: env.LINE_CLIENT_ID,
        clientSecret: env.LINE_CLIENT_SECRET,
        discoveryUrl: "https://access.line.me/.well-known/openid-configuration",
        scopes: ["openid", "profile", "email"],
        pkce: true,
      }],
    })] : [],
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
  })
}
