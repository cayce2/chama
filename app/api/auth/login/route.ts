import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { signJWT, setAuthCookie } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const db = await getDb()

    // Find user
    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Create user object without password for token
    const userForToken = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Generate JWT
    const token = signJWT(userForToken)

    // Create a response with the user data
    const response = NextResponse.json({
      message: "Login successful",
      user: userForToken,
      token: token,
    })

    // Set the cookie directly on the response
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax", // Changed from "strict" to "lax"
    })

    // Also use the helper function to set the cookie
    setAuthCookie(token)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

