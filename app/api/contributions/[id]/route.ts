import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get a specific contribution
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid contribution ID" }, { status: 400 })
    }

    const db = await getDb()
    const contribution = await db.collection("contributions").findOne({ _id: new ObjectId(id) })

    if (!contribution) {
      return NextResponse.json({ message: "Contribution not found" }, { status: 404 })
    }

    // Get user details
    const user = await db
      .collection("users")
      .findOne({ _id: contribution.userId }, { projection: { name: 1, email: 1 } })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Error fetching contribution:", error)
    return NextResponse.json({ message: "Error fetching contribution" }, { status: 500 })
  }
})

// Update a contribution
export const PUT = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid contribution ID" }, { status: 400 })
      }

      const { amount, type, status, paymentMethod, notes, transactionId } = await req.json()

      const db = await getDb()

      // Check if contribution exists
      const existingContribution = await db.collection("contributions").findOne({ _id: new ObjectId(id) })
      if (!existingContribution) {
        return NextResponse.json({ message: "Contribution not found" }, { status: 404 })
      }

      // Update contribution
      const updateData = {
        ...(amount && { amount: Number.parseFloat(amount) }),
        ...(type && { type }),
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(notes !== undefined && { notes }),
        ...(transactionId !== undefined && { transactionId }),
        updatedAt: new Date(),
      }

      await db.collection("contributions").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

      return NextResponse.json({
        id,
        ...existingContribution,
        ...updateData,
      })
    } catch (error) {
      console.error("Error updating contribution:", error)
      return NextResponse.json({ message: "Error updating contribution" }, { status: 500 })
    }
  },
  ["admin"],
)

// Delete a contribution
export const DELETE = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid contribution ID" }, { status: 400 })
      }

      const db = await getDb()

      // Check if contribution exists
      const existingContribution = await db.collection("contributions").findOne({ _id: new ObjectId(id) })
      if (!existingContribution) {
        return NextResponse.json({ message: "Contribution not found" }, { status: 404 })
      }

      // Delete contribution
      await db.collection("contributions").deleteOne({ _id: new ObjectId(id) })

      return NextResponse.json({ message: "Contribution deleted successfully" })
    } catch (error) {
      console.error("Error deleting contribution:", error)
      return NextResponse.json({ message: "Error deleting contribution" }, { status: 500 })
    }
  },
  ["admin"],
)

