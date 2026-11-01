import handler from "vinext/server/fetch-handler"
import type { CloudflareBindings } from "./lib/cloudflare/context"
import type { ExecutionContext } from "@cloudflare/workers-types"

const worker = {
  fetch(request: Request, env: CloudflareBindings, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx)
  },
}

export default worker
