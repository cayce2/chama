import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth } from "@/lib/jwt"

// Get all loans
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

    // Get loans
    const loans = await db.collection("loans").find(query).sort({ createdAt: -1 }).toArray()

    // Get user details for each loan
    const enhancedLoans = await Promise.all(
      loans.map(async (loan) => {
        const user = await db.collection("users").findOne({ _id: loan.userId }, { projection: { name: 1, email: 1 } })

        // Get approver details if applicable
        let approver = null
        if (loan.approvedBy) {
          approver = await db.collection("users").findOne({ _id: loan.approvedBy }, { projection: { name: 1 } })
        }

        return {
          id: loan._id.toString(),
          amount: loan.amount,
          purpose: loan.purpose,
          interestRate: loan.interestRate,
          term: loan.term,
          startDate: loan.startDate,
          endDate: loan.endDate,
          status: loan.status,
          approvedBy: loan.approvedBy ? loan.approvedBy.toString() : null,
          approverName: approver ? approver.name : null,
          approvalDate: loan.approvalDate,
          collateral: loan.collateral,
          guarantors: loan.guarantors ? loan.guarantors.map((g) => g.toString()) : [],
          repayments: loan.repayments || [],
          member: user ? user.name : "Unknown Member",
          memberId: loan.userId.toString(),
          createdAt: loan.createdAt,
        }
      }),
    )

    return NextResponse.json(enhancedLoans)
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ message: "Error fetching loans" }, { status: 500 })
  }
})

// Create a new loan application
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { userId, amount, purpose, interestRate, term, collateral, guarantors, notes } = await req.json()

    if (!userId || !amount || !purpose || !interestRate || !term) {
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

    // Process guarantors if provided
    const guarantorIds = []
    if (guarantors && guarantors.length > 0) {
      for (const guarantorId of guarantors) {
        if (ObjectId.isValid(guarantorId)) {
          const guarantor = await db.collection("users").findOne({ _id: new ObjectId(guarantorId) })
          if (guarantor) {
            guarantorIds.push(new ObjectId(guarantorId))
          }
        }
      }
    }

    const newLoan = {
      userId: new ObjectId(userId),
      amount: Number.parseFloat(amount),
      purpose,
      interestRate: Number.parseFloat(interestRate),
      term: Number.parseInt(term),
      status: "pending", // All loans start as pending
      collateral: collateral || null,
      guarantors: guarantorIds,
      repayments: [],
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("loans").insertOne(newLoan)

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...newLoan,
        userId: userId,
        member: existingUser.name,
        guarantors: guarantorIds.map((id) => id.toString()),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating loan application:", error)
    return NextResponse.json({ message: "Error creating loan application" }, { status: 500 })
  }
})

