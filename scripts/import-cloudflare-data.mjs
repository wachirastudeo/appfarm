import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

const [source, ownerEmail, destination] = process.argv.slice(2)
if (!source || !ownerEmail || !destination || !ownerEmail.includes("@")) {
  throw new Error("Usage: node scripts/import-cloudflare-data.mjs backup.json owner@example.com output.sql")
}
const data = JSON.parse(readFileSync(source, "utf8"))
const quote = value => `'${String(value).replaceAll("'", "''")}'`
const orchard = Object.fromEntries(["plots", "activities", "tasks", "finance"].map(key => {
  if (!Array.isArray(data[key])) throw new Error(`Backup must contain ${key}`)
  return [key, data[key]]
}))
// Authenticated owner must already exist. Never imports passwords, sessions or roles.
const sql = `INSERT INTO orchard_data (owner_id, data) SELECT id, ${quote(JSON.stringify(orchard))} FROM "user" WHERE lower(email) = ${quote(ownerEmail.trim().toLowerCase())} ON CONFLICT(owner_id) DO NOTHING;\n`
mkdirSync(dirname(destination), { recursive: true })
writeFileSync(destination, sql, { flag: "wx" })
console.log("Created owner-scoped import SQL. It preserves any existing D1 orchard data. Verify the owner account exists before applying.")
