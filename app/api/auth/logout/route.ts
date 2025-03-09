import { NextResponse } from "next/server"
import { removeAuthCookie } from "@/lib/jwt"

export async function POST() {
  removeAuthCookie()

  return NextResponse.json({ message: "Logged out successfully" })
}

