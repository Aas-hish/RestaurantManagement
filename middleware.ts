import { type NextRequest, NextResponse } from "next/server"

// UI-only mode: no redirects, always continue
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/waiter/:path*", "/kitchen/:path*"],
}
