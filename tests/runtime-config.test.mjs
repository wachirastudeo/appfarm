import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import test from "node:test"

function readConfig(mode, nodeEnv = "development") {
  const env = {
    ...process.env,
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  }
  delete env.NEXT_PUBLIC_APP_DATA_MODE
  if (mode !== undefined) env.NEXT_PUBLIC_APP_DATA_MODE = mode
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { appRuntimeConfig, isSupabaseConfigured, getModeStorageKey } from './lib/runtime-config.ts';
    console.log(JSON.stringify({ mode: appRuntimeConfig.dataMode, remote: isSupabaseConfigured, key: getModeStorageKey('durian_orchard_data') }));
  `], { env, encoding: "utf8", cwd: new URL("../", import.meta.url) }))
}

test("local demo disables Supabase even with credentials and isolates browser records", () => {
  assert.deepEqual(readConfig("local"), {
    mode: "local", remote: false, key: "demo_durian_orchard_data",
  })
})

test("production retains existing storage keys and enables Supabase", () => {
  assert.deepEqual(readConfig("supabase", "production"), {
    mode: "supabase", remote: true, key: "durian_orchard_data",
  })
})

test("defaults use local development and Supabase production", () => {
  assert.equal(readConfig(undefined).mode, "local")
  assert.equal(readConfig(undefined, "production").mode, "supabase")
})
