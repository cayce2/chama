import type { ObjectId } from "mongodb"

// User model
export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string // Hashed password
  role: "admin" | "member"
  phoneNumber?: string
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

// Contribution model
export interface Contribution {
  _id?: ObjectId
  userId: ObjectId
  amount: number
  date: Date
  type: "regular" | "special" | "penalty"
  status: "pending" | "completed" | "failed"
  paymentMethod: string
  transactionId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Investment model
export interface Investment {
  _id?: ObjectId
  name: string
  description: string
  amount: number
  startDate: Date
  endDate?: Date
  status: "planned" | "active" | "completed" | "cancelled"
  expectedReturn: number
  actualReturn?: number
  category: string
  risk: "low" | "medium" | "high"
  documents?: string[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Loan model
export interface Loan {
  _id?: ObjectId
  userId: ObjectId
  amount: number
  purpose: string
  interestRate: number
  term: number // in months
  startDate: Date
  endDate: Date
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "defaulted"
  approvedBy?: ObjectId
  approvalDate?: Date
  collateral?: string
  guarantors?: ObjectId[]
  repayments: LoanRepayment[]
  createdAt: Date
  updatedAt: Date
}

// Loan repayment model
export interface LoanRepayment {
  _id?: ObjectId
  loanId: ObjectId
  amount: number
  date: Date
  status: "pending" | "completed" | "late"
  paymentMethod: string
  transactionId?: string
  notes?: string
  createdAt: Date
}

// Meeting model
export interface Meeting {
  _id?: ObjectId
  title: string
  date: Date
  location: string
  agenda: string
  minutes?: string
  attendees: ObjectId[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Notification model
export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  title: string
  message: string
  type: "contribution" | "loan" | "investment" | "meeting" | "general"
  read: boolean
  relatedId?: ObjectId
  createdAt: Date
}

