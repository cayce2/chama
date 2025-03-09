/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

if (!process.env.JWT_SECRET) {
  throw new Error('Missing environment variable: "JWT_SECRET"')
}

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = "7d"

export function signJWT(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJWT(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

export function setAuthCookie(token: string) {
  cookies().set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax", // Changed from "strict" to "lax" to allow redirects
  })
}

export function getAuthCookie() {
  return cookies().get("auth_token")?.value
}

export function removeAuthCookie() {
  cookies().delete("auth_token")
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value

  if (!token) return null

  const payload = verifyJWT(token)
  if (!payload) return null

  return payload
}

export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    return handler(req, user)
  }
}

export function withRole(handler: (req: NextRequest, user: any) => Promise<NextResponse>, roles: string[]) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (typeof user !== 'string' && 'role' in user && !roles.includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    return handler(req, user)
  }
}

