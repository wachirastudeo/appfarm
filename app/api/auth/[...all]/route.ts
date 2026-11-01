import { getAuth } from "@/lib/cloudflare/auth"

function handle(request: Request) {
  return getAuth().handler(request)
}

export { handle as GET, handle as POST }
