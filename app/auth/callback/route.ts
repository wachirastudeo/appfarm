import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const next = safeRedirectPath(requestUrl.searchParams.get("next"))

  if (error) {
    const redirectUrl = new URL("/", requestUrl.origin)
    redirectUrl.searchParams.set("auth_error", error)
    if (errorDescription) {
      redirectUrl.searchParams.set("auth_error_description", errorDescription)
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      const redirectUrl = new URL("/", requestUrl.origin)
      redirectUrl.searchParams.set("auth_error", exchangeError.name)
      redirectUrl.searchParams.set("auth_error_description", exchangeError.message)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

function safeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/"
  return next
}
