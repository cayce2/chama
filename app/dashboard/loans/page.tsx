"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Loader2, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"

export default function LoansPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false)
  const [loans, setLoans] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [selectedRepayment, setSelectedRepayment] = useState(null)
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    purpose: "",
    interestRate: "",
    term: "",
    collateral: "",
    guarantors: [],
    notes: "",
  })
  const [repaymentData, setRepaymentData] = useState({
    amount: "",
    paymentMethod: "cash",
    transactionId: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchLoans()
    fetchMembers()
  }, [activeTab])

  const fetchLoans = async () => {
    try {
      setIsLoading(true)
      const url = activeTab === "all" ? "/api/loans" : `/api/loans?status=${activeTab}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch loans")
      }
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      console.error("Error fetching loans:", error)
      toast({
        title: "Error",
        description: "Failed to load loans. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members")
      if (!response.ok) {
        throw new Error("Failed to fetch members")
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleRepaymentInputChange = (e) => {
    const { id, value } = e.target
    setRepaymentData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRepaymentSelectChange = (field, value) => {
    setRepaymentData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.userId || !formData.amount || !formData.purpose || !formData.interestRate || !formData.term) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit loan application")
      }

      // Reset form
      setFormData({
        userId: "",
        amount: "",
        purpose: "",
        interestRate: "",
        term: "",
        collateral: "",
        guarantors: [],
        notes: "",
      })

      // Close dialog
      setIsAddDialogOpen(false)

      // Refresh loans list
      fetchLoans()

      toast({
        title: "Success",
        description: "Loan application submitted successfully.",
      })
    } catch (error) {
      console.error("Error submitting loan application:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit loan application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoanAction = async (loanId, action) => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/loans/${loanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: action }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${action} loan`)
      }

      // Refresh loans list
      fetchLoans()

      toast({
        title: "Success",
        description: `Loan ${action === "approved" ? "approved" : "rejected"} successfully.`,
      })
    } catch (error) {
      console.error(`Error ${action} loan:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} loan. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault()

    if (!selectedLoan || !selectedRepayment) {
      toast({
        title: "Error",
        description: "No loan or repayment selected.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repaymentId: selectedRepayment._id,
          ...repaymentData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to record repayment")
      }

      // Reset form
      setRepaymentData({
        amount: "",
        paymentMethod: "cash",
        transactionId: "",
        notes: "",
      })

      // Close dialog
      setIsRepaymentDialogOpen(false)
      setSelectedLoan(null)
      setSelectedRepayment(null)

      // Refresh loans list
      fetchLoans()

      toast({
        title: "Success",
        description: "Loan repayment recorded successfully.",
      })
    } catch (error) {
      console.error("Error recording repayment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record repayment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRepaymentDialog = (loan, repayment) => {
    setSelectedLoan(loan)
    setSelectedRepayment(repayment)
    setRepaymentData({
      amount: repayment.amount.toString(),
      paymentMethod: "cash",
      transactionId: "",
      notes: "",
    })
    setIsRepaymentDialogOpen(true)
  }

  const filteredLoans = loans.filter(
    (loan) =>
      loan.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.purpose.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "defaulted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Loans</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Apply for Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Loan Application</DialogTitle>
              <DialogDescription>Fill out the form to apply for a loan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">Member *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => handleSelectChange("userId", value)}
                    required
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Loan Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of the loan"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="term">Term (months) *</Label>
                    <Input
                      id="term"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.term}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="collateral">Collateral (Optional)</Label>
                  <Input
                    id="collateral"
                    placeholder="Describe any collateral"
                    value={formData.collateral}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guarantors">Guarantors (Optional)</Label>
                  <Select
                    value={formData.guarantors}
                    onValueChange={(value) => handleSelectChange("guarantors", [value])}
                  >
                    <SelectTrigger id="guarantors">
                      <SelectValue placeholder="Select guarantor" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.id !== formData.userId)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Information</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information to support your application"
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Repayment Dialog */}
      <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Loan Repayment</DialogTitle>
            <DialogDescription>Record a payment for this loan installment</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRepaymentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Loan Details</Label>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p>
                    <strong>Member:</strong> {selectedLoan?.member}
                  </p>
                  <p>
                    <strong>Amount Due:</strong> ${selectedRepayment?.amount?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Due Date:</strong>{" "}
                    {selectedRepayment?.date ? new Date(selectedRepayment.date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={repaymentData.amount}
                  onChange={handleRepaymentInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={repaymentData.paymentMethod}
                  onValueChange={(value) => handleRepaymentSelectChange("paymentMethod", value)}
                  required
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile-money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction reference"
                  value={repaymentData.transactionId}
                  onChange={handleRepaymentInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any additional information"
                  value={repaymentData.notes}
                  onChange={handleRepaymentInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsRepaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search loans..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Loans</CardTitle>
              <CardDescription>View all loan applications and active loans</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.length > 0 ? (
                      filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.member}</TableCell>
                          <TableCell>${Number.parseFloat(loan.amount).toLocaleString()}</TableCell>
                          <TableCell>{loan.purpose}</TableCell>
                          <TableCell>{loan.term} months</TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(loan.status)}`}
                            >
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {searchQuery ? "No loans found matching your search" : "No loans found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>Currently active loans with repayment schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Repaid</TableHead>
                      <TableHead>Next Payment</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.length > 0 ? (
                      filteredLoans.map((loan) => {
                        const completedRepayments = loan.repayments?.filter((r) => r.status === "completed") || []
                        const totalRepaid = completedRepayments.reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)
                        const nextPayment = loan.repayments?.find((r) => r.status === "pending")

                        return (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4 text-primary" />
                                {loan.member}
                              </div>
                            </TableCell>
                            <TableCell>${Number.parseFloat(loan.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              ${totalRepaid.toLocaleString()}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({Math.round((totalRepaid / loan.amount) * 100)}%)
                              </span>
                            </TableCell>
                            <TableCell>
                              {nextPayment ? (
                                <>
                                  ${Number.parseFloat(nextPayment.amount).toLocaleString()} on{" "}
                                  {new Date(nextPayment.date).toLocaleDateString()}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>{loan.endDate ? new Date(loan.endDate).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(loan.status)}`}
                              >
                                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {nextPayment && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRepaymentDialog(loan, nextPayment)}
                                >
                                  Pay
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No active loans found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pending Loan Applications</CardTitle>
              <CardDescription>Loan applications awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.length > 0 ? (
                      filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.member}</TableCell>
                          <TableCell>${Number.parseFloat(loan.amount).toLocaleString()}</TableCell>
                          <TableCell>{loan.purpose}</TableCell>
                          <TableCell>{loan.term} months</TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(loan.status)}`}
                            >
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {user?.role === "admin" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLoanAction(loan.id, "rejected")}
                                >
                                  Reject
                                </Button>
                                <Button size="sm" onClick={() => handleLoanAction(loan.id, "approved")}>
                                  Approve
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No pending loan applications found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completed Loans</CardTitle>
              <CardDescription>Loans that have been fully repaid</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Interest Paid</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.length > 0 ? (
                      filteredLoans.map((loan) => {
                        const interestPaid =
                          Number.parseFloat(loan.amount) *
                          (Number.parseFloat(loan.interestRate) / 100) *
                          (Number.parseInt(loan.term) / 12)

                        return (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.member}</TableCell>
                            <TableCell>${Number.parseFloat(loan.amount).toLocaleString()}</TableCell>
                            <TableCell>{loan.purpose}</TableCell>
                            <TableCell>{loan.term} months</TableCell>
                            <TableCell>${interestPaid.toFixed(2)}</TableCell>
                            <TableCell>{loan.endDate ? new Date(loan.endDate).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No completed loans found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

