import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { signJWT, setAuthCookie } from "@/lib/jwt"
import type { User } from "@/lib/models"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser: User = {
      name,
      email,
      password: hashedPassword,
      role: "member", // Default role
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    // Create user object without password for token
    const userForToken = {
      id: result.insertedId.toString(),
      name,
      email,
      role: "member",
    }

    // Generate JWT
    const token = signJWT(userForToken)

    // Set cookie
    setAuthCookie(token)

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userForToken,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

