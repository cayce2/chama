import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get a specific member
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid member ID" }, { status: 400 })
    }

    const db = await getDb()
    const member = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }, // Exclude password
    )

    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 })
    }

    // Get contribution data
    const contributions = await db
      .collection("contributions")
      .find({ userId: new ObjectId(id) })
      .toArray()

    const totalContributions = contributions.reduce((total, contrib) => total + (contrib.amount || 0), 0)

    // Get loan count
    const loanCount = await db.collection("loans").countDocuments({ userId: new ObjectId(id) })

    return NextResponse.json({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      phoneNumber: member.phoneNumber,
      joinDate: member.createdAt,
      status: member.status || "active",
      contributions: totalContributions,
      loans: loanCount,
    })
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ message: "Error fetching member" }, { status: 500 })
  }
})

// Update a member
export const PUT = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 })
      }

      const { name, email, phoneNumber, role, status } = await req.json()

      const db = await getDb()

      // Check if member exists
      const existingMember = await db.collection("users").findOne({ _id: new ObjectId(id) })
      if (!existingMember) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 })
      }

      // Update member
      const updateData = {
        ...(name && { name }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(role && { role }),
        ...(status && { status }),
        updatedAt: new Date(),
      }

      await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

      return NextResponse.json({
        id,
        ...updateData,
      })
    } catch (error) {
      console.error("Error updating member:", error)
      return NextResponse.json({ message: "Error updating member" }, { status: 500 })
    }
  },
  ["admin"],
)

// Delete a member
export const DELETE = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid member ID" }, { status: 400 })
      }

      const db = await getDb()

      // Check if member exists
      const existingMember = await db.collection("users").findOne({ _id: new ObjectId(id) })
      if (!existingMember) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 })
      }

      // Instead of deleting, set status to inactive
      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status: "inactive", updatedAt: new Date() } })

      return NextResponse.json({ message: "Member deactivated successfully" })
    } catch (error) {
      console.error("Error deactivating member:", error)
      return NextResponse.json({ message: "Error deactivating member" }, { status: 500 })
    }
  },
  ["admin"],
)

