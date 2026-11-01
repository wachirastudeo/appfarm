import assert from "node:assert/strict"
import test from "node:test"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const origin = process.env.CLOUDFLARE_TEST_URL || "http://localhost:3001"
if (!new URL(origin).hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
  throw new Error("Integration tests must use a local Cloudflare database.")
}

async function request(path: string, cookie = "", method = "GET", data?: unknown) {
  return fetch(`${origin}${path}`, {
    method, headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
}

async function signup(name: string) {
  const email = `${name}-${crypto.randomUUID()}@appfarm.test`
  const password = `Test-${crypto.randomUUID()}`
  const response = await request("/api/auth/sign-up/email", "", "POST", { name, email, password })
  assert.equal(response.status, 200, await response.clone().text())
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ")
  assert.ok(cookie)
  const session = await request("/api/cloudflare/session", cookie)
  assert.equal(session.status, 200, await session.clone().text())
  const { user } = await session.json()
  assert.equal(user.role, "user")
  assert.equal(user.passwordHash, "")
  return { cookie, user, email, password }
}

test("real D1 auth, ownership, role protection, persistence and logout", async () => {
  const anonymous = await request("/api/cloudflare/data")
  assert.equal(anonymous.status, 200, await anonymous.clone().text())
  assert.deepEqual((await anonymous.json()).users, [])

  const orchard = { plots: [{ id: "p-test", name: "Private orchard", trees: [] }], tasks: [], activities: [], finance: [] }
  assert.equal((await request("/api/cloudflare/data", "", "PUT", orchard)).status, 401)
  const alice = await signup("Alice")
  const bob = await signup("Bob")
  assert.equal((await request("/api/cloudflare/data", alice.cookie, "PUT", orchard)).status, 200)
  assert.equal((await (await request("/api/cloudflare/data", alice.cookie)).json()).plots[0].name, "Private orchard")
  assert.deepEqual((await (await request("/api/cloudflare/data", bob.cookie)).json()).plots, [])
  assert.equal((await request("/api/cloudflare/profile", bob.cookie, "PATCH", { id: alice.user.id, name: "Hijacked" })).status, 403)
  assert.equal((await request("/api/cloudflare/profile", bob.cookie, "PATCH", { role: "admin", passwordHash: "fake", name: "Bob updated" })).status, 200)
  assert.equal((await (await request("/api/cloudflare/session", bob.cookie)).json()).user.role, "user")
  assert.equal((await request("/api/cloudflare/content", bob.cookie, "PUT", { kind: "articles", value: { id: "fake", status: "published" } })).status, 403)
  assert.equal((await request("/api/cloudflare/data", bob.cookie, "PUT", { plots: "invalid" })).status, 400)
  assert.equal((await request("/api/cloudflare/data", bob.cookie, "PUT", { ...orchard, extra: "x".repeat(900001) })).status, 413)
  const crossSite = await fetch(`${origin}/api/cloudflare/data`, {
    method: "PUT", headers: { Origin: "https://attacker.example", Cookie: alice.cookie, "Content-Type": "application/json" }, body: JSON.stringify(orchard),
  })
  assert.equal(crossSite.status, 403)
  assert.equal((await request("/api/auth/sign-out", alice.cookie, "POST", {})).status, 200)
  assert.equal((await (await request("/api/cloudflare/session", alice.cookie)).json()).user, null)
  const login = await request("/api/auth/sign-in/email", "", "POST", { email: alice.email, password: alice.password })
  assert.equal(login.status, 200, await login.clone().text())
  const loginCookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ")
  assert.equal((await (await request("/api/cloudflare/data", loginCookie)).json()).plots.length, 1)
  const badLogin = await request("/api/auth/sign-in/email", "", "POST", { email: alice.email, password: "wrong-password" })
  assert.equal(badLogin.status, 401)

  assert.match(bob.user.id, /^[a-zA-Z0-9_-]+$/)
  execFileSync(process.execPath, [fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)), "d1", "execute", "DB", "--local", "--command",
    `UPDATE profiles SET role = 'admin' WHERE id = '${bob.user.id}'`,
  ], { cwd: new URL("../", import.meta.url), stdio: "pipe" })
  const articleId = `test-${crypto.randomUUID()}`
  assert.equal((await request("/api/cloudflare/content", bob.cookie, "PUT", { kind: "articles", value: { id: articleId, title: "Draft test", status: "draft" } })).status, 200)
  const publicData = await (await request("/api/cloudflare/data")).json()
  assert.equal(publicData.articles.some((item: { id: string }) => item.id === articleId), false)
  const adminData = await (await request("/api/cloudflare/data", bob.cookie)).json()
  assert.equal(adminData.articles.some((item: { id: string }) => item.id === articleId), true)
  assert.equal((await request("/api/cloudflare/content", bob.cookie, "DELETE", { kind: "articles", id: articleId })).status, 200)
  assert.equal((await request("/api/cloudflare/users", bob.cookie, "DELETE", { id: bob.user.id })).status, 400)
  assert.equal((await request("/api/cloudflare/users", bob.cookie, "DELETE", { id: alice.user.id })).status, 200)
  assert.equal((await (await request("/api/cloudflare/session", loginCookie)).json()).user, null)
})
