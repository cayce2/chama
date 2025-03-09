import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get all investments
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const db = await getDb()

    // Build query
    const query: any = {}
    if (status) query.status = status

    // Get investments
    const investments = await db.collection("investments").find(query).sort({ startDate: -1 }).toArray()

    // Transform data for client
    const transformedInvestments = investments.map((investment) => ({
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
      createdBy: investment.createdBy.toString(),
      createdAt: investment.createdAt,
    }))

    return NextResponse.json(transformedInvestments)
  } catch (error) {
    console.error("Error fetching investments:", error)
    return NextResponse.json({ message: "Error fetching investments" }, { status: 500 })
  }
})

// Create a new investment
export const POST = withRole(
  async (req: NextRequest, user: any) => {
    try {
      const { name, description, amount, startDate, endDate, expectedReturn, category, risk, documents } =
        await req.json()

      if (!name || !amount || !startDate || !expectedReturn || !category || !risk) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
      }

      const db = await getDb()

      const newInvestment = {
        name,
        description,
        amount: Number.parseFloat(amount),
        startDate: new Date(startDate),
        ...(endDate && { endDate: new Date(endDate) }),
        status: startDate > new Date() ? "planned" : "active",
        expectedReturn: Number.parseFloat(expectedReturn),
        category,
        risk,
        documents: documents || [],
        createdBy: new ObjectId(user.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("investments").insertOne(newInvestment)

      return NextResponse.json(
        {
          id: result.insertedId.toString(),
          ...newInvestment,
          createdBy: user.id,
          startDate: newInvestment.startDate.toISOString(),
          ...(newInvestment.endDate && { endDate: newInvestment.endDate.toISOString() }),
        },
        { status: 201 },
      )
    } catch (error) {
      console.error("Error creating investment:", error)
      return NextResponse.json({ message: "Error creating investment" }, { status: 500 })
    }
  },
  ["admin"],
)

