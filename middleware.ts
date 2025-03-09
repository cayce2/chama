import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT } from "./lib/jwt"

// Update the middleware to be more lenient and add better debugging
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Skip middleware for API routes except auth check
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/members")) {
    return NextResponse.next()
  }

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/login" || path === "/register" || path.startsWith("/api/auth")

  // Get the token from the cookies
  const token = request.cookies.get("auth_token")?.value || ""

  console.log(`Middleware - Path: ${path}, Token exists: ${!!token}`)

  // Verify the token
  const isAuthenticated = token && verifyJWT(token)

  console.log(`Middleware - Path: ${path}, Public: ${isPublicPath}, Authenticated: ${isAuthenticated}`)

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    // If user is on a public path but is authenticated, redirect to dashboard
    console.log("Redirecting authenticated user from public path to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !isAuthenticated && path !== "/favicon.ico") {
    // If user is on a protected path but is not authenticated, redirect to login
    console.log("Redirecting unauthenticated user to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// Update the matcher to exclude API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes, except for auth/me)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/auth/me",
  ],
}

