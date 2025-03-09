import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get a specific investment
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid investment ID" }, { status: 400 })
    }

    const db = await getDb()
    const investment = await db.collection("investments").findOne({ _id: new ObjectId(id) })

    if (!investment) {
      return NextResponse.json({ message: "Investment not found" }, { status: 404 })
    }

    // Get creator details
    const creator = await db.collection("users").findOne({ _id: investment.createdBy }, { projection: { name: 1 } })

    return NextResponse.json({
      id: investment._id.toString(),
      name: investment.name,
      description: investment.description,
      amount: investment.amount,
      startDate: investment.startDate,
      endDate: investment.endDate,
      status: investment.status,
      expectedReturn: investment.expectedReturn,
      actualReturn: investment.actualReturn,
      category: investment.category,
      risk: investment.risk,
      documents: investment.documents,
      createdBy: investment.createdBy.toString(),
      creatorName: creator ? creator.name : "Unknown",
      createdAt: investment.createdAt,
    })
  } catch (error) {
    console.error("Error fetching investment:", error)
    return NextResponse.json({ message: "Error fetching investment" }, { status: 500 })
  }
})

// Update an investment
export const PUT = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid investment ID" }, { status: 400 })
      }

      const {
        name,
        description,
        amount,
        startDate,
        endDate,
        status,
        expectedReturn,
        actualReturn,
        category,
        risk,
        documents,
      } = await req.json()

      const db = await getDb()

      // Check if investment exists
      const existingInvestment = await db.collection("investments").findOne({ _id: new ObjectId(id) })
      if (!existingInvestment) {
        return NextResponse.json({ message: "Investment not found" }, { status: 404 })
      }

      // Update investment
      const updateData: any = {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(amount && { amount: Number.parseFloat(amount) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(expectedReturn && { expectedReturn: Number.parseFloat(expectedReturn) }),
        ...(actualReturn !== undefined && { actualReturn: actualReturn ? Number.parseFloat(actualReturn) : null }),
        ...(category && { category }),
        ...(risk && { risk }),
        ...(documents && { documents }),
        updatedAt: new Date(),
      }

      await db.collection("investments").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

      return NextResponse.json({
        id,
        ...existingInvestment,
        ...updateData,
        startDate: updateData.startDate ? updateData.startDate.toISOString() : existingInvestment.startDate,
        endDate: updateData.endDate ? updateData.endDate.toISOString() : existingInvestment.endDate,
        createdBy: existingInvestment.createdBy.toString(),
      })
    } catch (error) {
      console.error("Error updating investment:", error)
      return NextResponse.json({ message: "Error updating investment" }, { status: 500 })
    }
  },
  ["admin"],
)

// Delete an investment
export const DELETE = withRole(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid investment ID" }, { status: 400 })
      }

      const db = await getDb()

      // Check if investment exists
      const existingInvestment = await db.collection("investments").findOne({ _id: new ObjectId(id) })
      if (!existingInvestment) {
        return NextResponse.json({ message: "Investment not found" }, { status: 404 })
      }

      // Instead of deleting, set status to cancelled
      await db
        .collection("investments")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status: "cancelled", updatedAt: new Date() } })

      return NextResponse.json({ message: "Investment cancelled successfully" })
    } catch (error) {
      console.error("Error cancelling investment:", error)
      return NextResponse.json({ message: "Error cancelling investment" }, { status: 500 })
    }
  },
  ["admin"],
)

