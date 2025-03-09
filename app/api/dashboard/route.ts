import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { withAuth } from "@/lib/jwt"

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const db = await getDb()

    // Get total members count
    const totalMembers = await db.collection("users").countDocuments({ status: { $ne: "inactive" } })

    // Get new members in the last month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const newMembers = await db.collection("users").countDocuments({
      createdAt: { $gte: lastMonth },
      status: { $ne: "inactive" },
    })

    // Get total contributions
    const contributionsResult = await db
      .collection("contributions")
      .aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray()
    const totalContributions = contributionsResult.length > 0 ? contributionsResult[0].total : 0

    // Get contributions in the last month
    const lastMonthContributions = await db
      .collection("contributions")
      .aggregate([
        { $match: { status: "completed", date: { $gte: lastMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray()
    const monthlyContributions = lastMonthContributions.length > 0 ? lastMonthContributions[0].total : 0

    // Get previous month contributions for comparison
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    const prevMonthContributions = await db
      .collection("contributions")
      .aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: twoMonthsAgo, $lt: lastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray()
    const prevMonthTotal = prevMonthContributions.length > 0 ? prevMonthContributions[0].total : 0

    // Calculate percentage change
    let percentageChange = 0
    if (prevMonthTotal > 0) {
      percentageChange = ((monthlyContributions - prevMonthTotal) / prevMonthTotal) * 100
    }

    // Get active investments count
    const activeInvestments = await db.collection("investments").countDocuments({ status: "active" })

    // Get new investments in the last month
    const newInvestments = await db.collection("investments").countDocuments({
      createdAt: { $gte: lastMonth },
    })

    // Get active loans count
    const activeLoans = await db.collection("loans").countDocuments({ status: "active" })

    // Get pending loans count
    const pendingLoans = await db.collection("loans").countDocuments({ status: "pending" })

    // Get recent contributions
    const recentContributions = await db
      .collection("contributions")
      .find({ status: "completed" })
      .sort({ date: -1 })
      .limit(5)
      .toArray()

    // Enhance with member names
    const enhancedContributions = await Promise.all(
      recentContributions.map(async (contribution) => {
        const user = await db.collection("users").findOne({ _id: contribution.userId }, { projection: { name: 1 } })

        return {
          id: contribution._id.toString(),
          amount: contribution.amount,
          date: contribution.date,
          member: user ? user.name : "Unknown Member",
          type: contribution.type,
        }
      }),
    )

    // Get upcoming meetings
    const today = new Date()
    const upcomingMeetings = await db
      .collection("meetings")
      .find({ date: { $gte: today } })
      .sort({ date: 1 })
      .limit(3)
      .toArray()

    const enhancedMeetings = upcomingMeetings.map((meeting) => ({
      id: meeting._id.toString(),
      title: meeting.title,
      date: meeting.date,
      location: meeting.location,
      agenda: meeting.agenda,
    }))

    return NextResponse.json({
      members: {
        total: totalMembers,
        new: newMembers,
      },
      contributions: {
        total: totalContributions,
        monthly: monthlyContributions,
        percentageChange: percentageChange.toFixed(1),
      },
      investments: {
        active: activeInvestments,
        new: newInvestments,
      },
      loans: {
        active: activeLoans,
        pending: pendingLoans,
      },
      recentContributions: enhancedContributions,
      upcomingMeetings: enhancedMeetings,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ message: "Error fetching dashboard data" }, { status: 500 })
  }
})

