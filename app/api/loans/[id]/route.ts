import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth, withRole } from "@/lib/jwt"

// Get a specific loan
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid loan ID" }, { status: 400 })
    }

    const db = await getDb()
    const loan = await db.collection("loans").findOne({ _id: new ObjectId(id) })

    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 404 })
    }

    // Get user details
    const user = await db.collection("users").findOne({ _id: loan.userId }, { projection: { name: 1, email: 1 } })

    // Get approver details if applicable
    let approver = null
    if (loan.approvedBy) {
      approver = await db.collection("users").findOne({ _id: loan.approvedBy }, { projection: { name: 1 } })
    }

    // Get guarantor details if applicable
    const guarantorDetails = []
    if (loan.guarantors && loan.guarantors.length > 0) {
      for (const guarantorId of loan.guarantors) {
        const guarantor = await db
          .collection("users")
          .findOne({ _id: guarantorId }, { projection: { _id: 1, name: 1, email: 1 } })
        if (guarantor) {
          guarantorDetails.push({
            id: guarantor._id.toString(),
            name: guarantor.name,
            email: guarantor.email,
          })
        }
      }
    }

    return NextResponse.json({
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
      guarantors: guarantorDetails,
      repayments: loan.repayments || [],
      notes: loan.notes,
      member: user ? user.name : "Unknown Member",
      memberId: loan.userId.toString(),
      createdAt: loan.createdAt,
    })
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json({ message: "Error fetching loan" }, { status: 500 })
  }
})

// Update a loan
export const PUT = withRole(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid loan ID" }, { status: 400 })
      }

      const { amount, purpose, interestRate, term, status, startDate, endDate, collateral, guarantors, notes } =
        await req.json()

      const db = await getDb()

      // Check if loan exists
      const existingLoan = await db.collection("loans").findOne({ _id: new ObjectId(id) })
      if (!existingLoan) {
        return NextResponse.json({ message: "Loan not found" }, { status: 404 })
      }

      // Process guarantors if provided
      let guarantorIds = existingLoan.guarantors || []
      if (guarantors && guarantors.length > 0) {
        guarantorIds = []
        for (const guarantorId of guarantors) {
          if (ObjectId.isValid(guarantorId)) {
            const guarantor = await db.collection("users").findOne({ _id: new ObjectId(guarantorId) })
            if (guarantor) {
              guarantorIds.push(new ObjectId(guarantorId))
            }
          }
        }
      }

      // Handle loan approval
      let updateData: any = {
        ...(amount && { amount: Number.parseFloat(amount) }),
        ...(purpose && { purpose }),
        ...(interestRate && { interestRate: Number.parseFloat(interestRate) }),
        ...(term && { term: Number.parseInt(term) }),
        ...(collateral !== undefined && { collateral }),
        ...(notes !== undefined && { notes }),
        guarantors: guarantorIds,
        updatedAt: new Date(),
      }

      // If status is changing to approved and current status is pending
      if (status === "approved" && existingLoan.status === "pending") {
        const today = new Date()
        const endDate = new Date()
        endDate.setMonth(today.getMonth() + Number.parseInt(term || existingLoan.term))

        updateData = {
          ...updateData,
          status: "active",
          startDate: today,
          endDate: endDate,
          approvedBy: new ObjectId(user.id),
          approvalDate: today,
        }

        // Generate repayment schedule
        const loanAmount = Number.parseFloat(amount || existingLoan.amount)
        const loanTerm = Number.parseInt(term || existingLoan.term)
        const loanInterest = Number.parseFloat(interestRate || existingLoan.interestRate)

        // Simple interest calculation
        const totalInterest = loanAmount * (loanInterest / 100) * (loanTerm / 12)
        const totalAmount = loanAmount + totalInterest
        const monthlyPayment = totalAmount / loanTerm

        const repayments = []
        for (let i = 0; i < loanTerm; i++) {
          const paymentDate = new Date(today)
          paymentDate.setMonth(today.getMonth() + i + 1)

          repayments.push({
            amount: monthlyPayment,
            date: paymentDate,
            status: "pending",
            paymentMethod: "",
            transactionId: "",
            notes: "",
            createdAt: today,
          })
        }

        updateData.repayments = repayments
      }
      // Handle other status changes
      else if (status && status !== existingLoan.status) {
        updateData.status = status

        // If completing a loan
        if (status === "completed") {
          // Mark all remaining repayments as completed
          if (existingLoan.repayments && existingLoan.repayments.length > 0) {
            const updatedRepayments = existingLoan.repayments.map((repayment) => {
              if (repayment.status === "pending") {
                return { ...repayment, status: "completed" }
              }
              return repayment
            })
            updateData.repayments = updatedRepayments
          }
        }
      }

      await db.collection("loans").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

      return NextResponse.json({
        id,
        ...existingLoan,
        ...updateData,
        userId: existingLoan.userId.toString(),
        approvedBy: updateData.approvedBy
          ? updateData.approvedBy.toString()
          : existingLoan.approvedBy
            ? existingLoan.approvedBy.toString()
            : null,
        guarantors: updateData.guarantors.map((g) => g.toString()),
      })
    } catch (error) {
      console.error("Error updating loan:", error)
      return NextResponse.json({ message: "Error updating loan" }, { status: 500 })
    }
  },
  ["admin"],
)

// Record a loan repayment
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid loan ID" }, { status: 400 })
    }

    const { repaymentId, amount, paymentMethod, transactionId, notes } = await req.json()

    if (!repaymentId) {
      return NextResponse.json({ message: "Repayment ID is required" }, { status: 400 })
    }

    const db = await getDb()

    // Check if loan exists
    const existingLoan = await db.collection("loans").findOne({ _id: new ObjectId(id) })
    if (!existingLoan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 404 })
    }

    // Find the repayment
    const repaymentIndex = existingLoan.repayments.findIndex((r) => r._id.toString() === repaymentId)
    if (repaymentIndex === -1) {
      return NextResponse.json({ message: "Repayment not found" }, { status: 404 })
    }

    // Update the repayment
    const updatedRepayments = [...existingLoan.repayments]
    updatedRepayments[repaymentIndex] = {
      ...updatedRepayments[repaymentIndex],
      ...(amount && { amount: Number.parseFloat(amount) }),
      status: "completed",
      paymentMethod: paymentMethod || "Cash",
      transactionId: transactionId || "",
      notes: notes || "",
      paidAt: new Date(),
    }

    await db
      .collection("loans")
      .updateOne({ _id: new ObjectId(id) }, { $set: { repayments: updatedRepayments, updatedAt: new Date() } })

    // Check if all repayments are completed
    const allCompleted = updatedRepayments.every((r) => r.status === "completed")
    if (allCompleted) {
      await db
        .collection("loans")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status: "completed", updatedAt: new Date() } })
    }

    return NextResponse.json({
      id,
      repayments: updatedRepayments,
      status: allCompleted ? "completed" : existingLoan.status,
    })
  } catch (error) {
    console.error("Error recording loan repayment:", error)
    return NextResponse.json({ message: "Error recording loan repayment" }, { status: 500 })
  }
})

