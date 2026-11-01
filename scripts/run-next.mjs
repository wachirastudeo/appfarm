import { spawn } from "node:child_process"
import { createRequire } from "node:module"

const [mode, command, ...args] = process.argv.slice(2)
if (!["local", "supabase", "cloudflare"].includes(mode) || !["dev", "build"].includes(command)) {
  throw new Error("Usage: run-next.mjs <local|supabase|cloudflare> <dev|build> [args]")
}

const require = createRequire(import.meta.url)
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), command, ...args], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_APP_DATA_MODE: mode },
})

child.on("error", error => {
  console.error(error.message)
  process.exitCode = 1
})
child.on("exit", code => {
  process.exitCode = code ?? 1
})
