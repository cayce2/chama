/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth } from "@/lib/jwt"

// Get all contributions
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    const db = await getDb()

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (userId && ObjectId.isValid(userId)) query.userId = new ObjectId(userId)

    // Get contributions
    const contributions = await db.collection("contributions").find(query).sort({ date: -1 }).toArray()

    // Get user details for each contribution
    const enhancedContributions = await Promise.all(
      contributions.map(async (contribution) => {
        const user = await db
          .collection("users")
          .findOne({ _id: contribution.userId }, { projection: { name: 1, email: 1 } })

        return {
          id: contribution._id.toString(),
          amount: contribution.amount,
          date: contribution.date,
          type: contribution.type,
          status: contribution.status,
          paymentMethod: contribution.paymentMethod,
          notes: contribution.notes,
          transactionId: contribution.transactionId,
          member: user ? user.name : "Unknown Member",
          memberId: contribution.userId.toString(),
          createdAt: contribution.createdAt,
        }
      }),
    )

    return NextResponse.json(enhancedContributions)
  } catch (error) {
    console.error("Error fetching contributions:", error)
    return NextResponse.json({ message: "Error fetching contributions" }, { status: 500 })
  }
})

// Create a new contribution
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { userId, amount, type, paymentMethod, notes, transactionId } = await req.json()

    if (!userId || !amount || !type || !paymentMethod) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
    }

    const db = await getDb()

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const newContribution = {
      userId: new ObjectId(userId),
      amount: Number.parseFloat(amount),
      date: new Date(),
      type,
      status: "completed", // Default to completed
      paymentMethod,
      transactionId,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(user.id),
    }

    const result = await db.collection("contributions").insertOne(newContribution)

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...newContribution,
        userId: userId,
        member: existingUser.name,
        date: newContribution.date.toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating contribution:", error)
    return NextResponse.json({ message: "Error creating contribution" }, { status: 500 })
  }
})

