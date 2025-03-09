/* eslint-disable react-hooks/exhaustive-deps */
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
import { Loader2, PiggyBank, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ContributionsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  interface Contribution {
    id: string;
    member: string;
    amount: string;
    date: string;
    type: string;
    status: string;
  }

  const [contributions, setContributions] = useState<Contribution[]>([])
  interface Member {
    id: string;
    name: string;
  }

  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    type: "regular",
    paymentMethod: "cash",
    notes: "",
    transactionId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchContributions()
    fetchMembers()
  }, [activeTab])

  const fetchContributions = async () => {
    try {
      setIsLoading(true)
      const url = activeTab === "all" ? "/api/contributions" : `/api/contributions?status=${activeTab}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch contributions")
      }
      const data = await response.json()
      setContributions(data)
    } catch (error) {
      console.error("Error fetching contributions:", error)
      toast({
        title: "Error",
        description: "Failed to load contributions. Please try again.",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!formData.userId || !formData.amount || !formData.type || !formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add contribution")
      }

      // Reset form
      setFormData({
        userId: "",
        amount: "",
        type: "regular",
        paymentMethod: "cash",
        notes: "",
        transactionId: "",
      })

      // Close dialog
      setIsAddDialogOpen(false)

      // Refresh contributions list
      fetchContributions()

      toast({
        title: "Success",
        description: "Contribution added successfully.",
      })
    } catch (error) {
      console.error("Error adding contribution:", error)
      toast({
        title: "Error",
        description: (error instanceof Error ? error.message : "Failed to add contribution. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredContributions = contributions.filter((contribution) =>
    contribution.member.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Contributions</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contribution
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contribution</DialogTitle>
              <DialogDescription>Record a new contribution from a member</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="member">Member *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => handleSelectChange("userId", value)}
                    required
                  >
                    <SelectTrigger id="member">
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
                  <Label htmlFor="amount">Amount *</Label>
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
                  <Label htmlFor="type">Contribution Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                      <SelectItem value="penalty">Penalty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment-method">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                    required
                  >
                    <SelectTrigger id="payment-method">
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
                    value={formData.transactionId}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional information"
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
                      Saving...
                    </>
                  ) : (
                    "Save Contribution"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contributions..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Contributions</CardTitle>
              <CardDescription>View all contributions made by members</CardDescription>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContributions.length > 0 ? (
                      filteredContributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="font-medium">{contribution.member}</TableCell>
                          <TableCell>${Number.parseFloat(contribution.amount).toFixed(2)}</TableCell>
                          <TableCell>{new Date(contribution.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <PiggyBank className="mr-2 h-4 w-4 text-primary" />
                              {contribution.type.charAt(0).toUpperCase() + contribution.type.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contribution.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              }`}
                            >
                              {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
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
                        <TableCell colSpan={6} className="text-center py-8">
                          {searchQuery ? "No contributions found matching your search" : "No contributions found"}
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
              <CardTitle>Pending Contributions</CardTitle>
              <CardDescription>Contributions that are still pending</CardDescription>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContributions.length > 0 ? (
                      filteredContributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="font-medium">{contribution.member}</TableCell>
                          <TableCell>${Number.parseFloat(contribution.amount).toFixed(2)}</TableCell>
                          <TableCell>{new Date(contribution.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <PiggyBank className="mr-2 h-4 w-4 text-primary" />
                              {contribution.type.charAt(0).toUpperCase() + contribution.type.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                              Pending
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
                        <TableCell colSpan={6} className="text-center py-8">
                          {searchQuery
                            ? "No pending contributions found matching your search"
                            : "No pending contributions found"}
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
              <CardTitle>Completed Contributions</CardTitle>
              <CardDescription>Contributions that have been completed</CardDescription>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContributions.length > 0 ? (
                      filteredContributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="font-medium">{contribution.member}</TableCell>
                          <TableCell>${Number.parseFloat(contribution.amount).toFixed(2)}</TableCell>
                          <TableCell>{new Date(contribution.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <PiggyBank className="mr-2 h-4 w-4 text-primary" />
                              {contribution.type.charAt(0).toUpperCase() + contribution.type.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Completed
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
                        <TableCell colSpan={6} className="text-center py-8">
                          {searchQuery
                            ? "No completed contributions found matching your search"
                            : "No completed contributions found"}
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

