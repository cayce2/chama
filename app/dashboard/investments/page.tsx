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
import { Loader2, Plus, Search, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function InvestmentsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [investments, setInvestments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    startDate: "",
    endDate: "",
    expectedReturn: "",
    category: "",
    risk: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvestments()
  }, [activeTab])

  const fetchInvestments = async () => {
    try {
      setIsLoading(true)
      const url = activeTab === "all" ? "/api/investments" : `/api/investments?status=${activeTab}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch investments")
      }
      const data = await response.json()
      setInvestments(data)
    } catch (error) {
      console.error("Error fetching investments:", error)
      toast({
        title: "Error",
        description: "Failed to load investments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (
      !formData.name ||
      !formData.amount ||
      !formData.startDate ||
      !formData.expectedReturn ||
      !formData.category ||
      !formData.risk
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add investment")
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        amount: "",
        startDate: "",
        endDate: "",
        expectedReturn: "",
        category: "",
        risk: "",
      })

      // Close dialog
      setIsAddDialogOpen(false)

      // Refresh investments list
      fetchInvestments()

      toast({
        title: "Success",
        description: "Investment added successfully.",
      })
    } catch (error) {
      console.error("Error adding investment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add investment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredInvestments = investments.filter(
    (investment) =>
      investment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investment.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "planned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Investment</DialogTitle>
              <DialogDescription>Create a new investment opportunity for the chama</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Investment Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter investment name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the investment opportunity"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="expectedReturn">Expected Return (%) *</Label>
                    <Input
                      id="expectedReturn"
                      type="number"
                      placeholder="0.00"
                      value={formData.expectedReturn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input id="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange("category", value)}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="bonds">Bonds</SelectItem>
                        <SelectItem value="business-loan">Business Loan</SelectItem>
                        <SelectItem value="venture-capital">Venture Capital</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="risk">Risk Level *</Label>
                    <Select value={formData.risk} onValueChange={(value) => handleSelectChange("risk", value)} required>
                      <SelectTrigger id="risk">
                        <SelectValue placeholder="Select risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      Creating...
                    </>
                  ) : (
                    "Create Investment"
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
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search investments..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Investments</CardTitle>
              <CardDescription>View all investment opportunities</CardDescription>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length > 0 ? (
                      filteredInvestments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                              {investment.name}
                            </div>
                          </TableCell>
                          <TableCell>${Number.parseFloat(investment.amount).toLocaleString()}</TableCell>
                          <TableCell>{new Date(investment.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{investment.expectedReturn}%</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(investment.risk)}`}
                            >
                              {investment.risk.charAt(0).toUpperCase() + investment.risk.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(investment.status)}`}
                            >
                              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
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
                          {searchQuery ? "No investments found matching your search" : "No investments found"}
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
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>Currently active investments</CardDescription>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length > 0 ? (
                      filteredInvestments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                              {investment.name}
                            </div>
                          </TableCell>
                          <TableCell>${Number.parseFloat(investment.amount).toLocaleString()}</TableCell>
                          <TableCell>{new Date(investment.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{investment.expectedReturn}%</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(investment.risk)}`}
                            >
                              {investment.risk.charAt(0).toUpperCase() + investment.risk.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(investment.status)}`}
                            >
                              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
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
                          No active investments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planned" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Planned Investments</CardTitle>
              <CardDescription>Upcoming investment opportunities</CardDescription>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length > 0 ? (
                      filteredInvestments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                              {investment.name}
                            </div>
                          </TableCell>
                          <TableCell>${Number.parseFloat(investment.amount).toLocaleString()}</TableCell>
                          <TableCell>{new Date(investment.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{investment.expectedReturn}%</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(investment.risk)}`}
                            >
                              {investment.risk.charAt(0).toUpperCase() + investment.risk.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(investment.status)}`}
                            >
                              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
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
                          No planned investments found
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
              <CardTitle>Completed Investments</CardTitle>
              <CardDescription>Past investments that have been completed</CardDescription>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Actual Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length > 0 ? (
                      filteredInvestments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                              {investment.name}
                            </div>
                          </TableCell>
                          <TableCell>${Number.parseFloat(investment.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(investment.startDate).toLocaleDateString()} -{" "}
                            {investment.endDate ? new Date(investment.endDate).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>{investment.expectedReturn}%</TableCell>
                          <TableCell>
                            {investment.actualReturn ? (
                              <>
                                {investment.actualReturn}%
                                {Number.parseFloat(investment.actualReturn) >
                                Number.parseFloat(investment.expectedReturn) ? (
                                  <span className="text-green-600 ml-1">↑</span>
                                ) : Number.parseFloat(investment.actualReturn) <
                                  Number.parseFloat(investment.expectedReturn) ? (
                                  <span className="text-red-600 ml-1">↓</span>
                                ) : (
                                  <span className="text-yellow-600 ml-1">→</span>
                                )}
                              </>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(investment.status)}`}
                            >
                              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
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
                          No completed investments found
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

