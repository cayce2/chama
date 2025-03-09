/* eslint-disable @typescript-eslint/no-require-imports */
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get all members
export const GET = withAuth(async () => {
  try {
    const db = await getDb()
    const members = await db.collection("users").find({}).toArray()

    // Transform data for client
    const transformedMembers = members.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      joinDate: member.createdAt,
      phoneNumber: member.phoneNumber,
      status: member.status || "active",
      // We'll need to calculate these from other collections
      contributions: 0,
      loans: 0,
    }))

    // Enhance with contribution and loan data
    for (const member of transformedMembers) {
      // Get total contributions
      const contributions = await db
        .collection("contributions")
        .find({ userId: new ObjectId(member.id) })
        .toArray()

      member.contributions = contributions.reduce((total, contrib) => total + (contrib.amount || 0), 0)

      // Get loan count
      member.loans = await db.collection("loans").countDocuments({ userId: new ObjectId(member.id) })
    }

    return NextResponse.json(transformedMembers)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ message: "Error fetching members" }, { status: 500 })
  }
})

// Create a new member
export const POST = withRole(
  async (req: NextRequest) => {
    try {
      const { name, email, phoneNumber, role, password } = await req.json()

      const db = await getDb()

      // Check if user already exists
      const existingUser = await db.collection("users").findOne({ email })
      if (existingUser) {
        return NextResponse.json({ message: "User already exists with this email" }, { status: 409 })
      }


      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = {
        name,
        email,
        password: hashedPassword,
        role: role || "member",
        phoneNumber,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(newUser)

      return NextResponse.json(
        {
          id: result.insertedId.toString(),
          name,
          email,
          role,
          phoneNumber,
          status: "active",
          joinDate: newUser.createdAt,
          contributions: 0,
          loans: 0,
        },
        { status: 201 },
      )
    } catch (error) {
      console.error("Error creating member:", error)
      return NextResponse.json({ message: "Error creating member" }, { status: 500 })
    }
  },
  ["admin"],
)

