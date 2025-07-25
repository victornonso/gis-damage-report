"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  BarChart3,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"

export default function AdminPage() {
  const router = useRouter() 
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be logged in as admin or super‑admin.",
      }).then(() => router.push("/"))
    },
  })

  // enforce role
  useEffect(() => {
    if (!session) return
    const role = (session.user as any).role
    if (role !== "admin" && role !== "super_admin") {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be an admin or super‑admin to view this page.",
      }).then(() => router.push("/"))
    }
  }, [session, router])

  if (!session || !["admin", "super_admin"].includes((session.user as any).role)) {
    return null
  }

  // --- State ---
  const [stats, setStats] = useState({
    totalReports: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
    thisMonth: 0,
  })
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [updateMessage, setUpdateMessage] = useState("")
  const [databaseStatus, setDatabaseStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  const [selectedStatus, setSelectedStatus] = useState<"all"|"submitted"|"in-progress"|"resolved">("all")
  const [selectedLgaFilter, setSelectedLgaFilter] = useState<string>("all")
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    lgaName: "",
    email: "",
    phone: "",
  })
  const [savingSettings, setSavingSettings] = useState(false)

   // Dynamic LGA filter (null => no filter)
  const [currentLGA, setCurrentLGA] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string>("")
  const [pendingDepartment, setPendingDepartment] = useState<string>("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  // --- Effects ---
  // Prefill settings form & currentLGA from session
  useEffect(() => {
    if (!session) return
    const role = (session.user as any).role
    const userLga = (session.user as any).lga
    // initialize currentLGA (null means no filter)
    const newLGA = role === "super_admin" ? null : userLga || null

    setCurrentLGA(newLGA)
    // prefill form
    setSettingsForm({
      lgaName: userLga
        ? userLga.charAt(0).toUpperCase() + userLga.slice(1) + " Local Government"
        : "",
      email: session.user.email,
      phone: session.user.phone || "",
    })

    fetchDashboardData(newLGA)
  }, [session])

  // reset these whenever a new report is clicked:
  useEffect(() => {
    if (selectedReport) {
      setPendingStatus(selectedReport.status)
      setPendingDepartment(selectedReport.assigned_to ?? "")
      setUpdateMessage("")         // clear old messages
    }
  }, [selectedReport])

  // Check DB health
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const res = await fetch("/api/health")
        const { database } = await res.json()
        setDatabaseStatus(database === "connected" ? "connected" : "disconnected")
      } catch {
        setDatabaseStatus("disconnected")
      }
    }
    checkDatabaseStatus()
  }, [])



  // Derive LGA options from fetched reports + user role
  const lgaOptions = useMemo(() => {
    const allLgas = Array.from(new Set(reports.map(r => r.lga).filter(Boolean)))
    if ((session.user as any).role === "super_admin") {
      return ["all", ...allLgas]
      }
      // for admin, only their own LGA
      return [currentLGA ?? "all"]
    }, [reports, session, currentLGA])

  // --- Data Fetcher (used on mount, refresh, after updates) ---
  const fetchDashboardData = async (lgaToUse: string | null) => {
    setLoading(true)
    try {
      // Stats
      const statsUrl =
        session.user.role === "super_admin" ? "/api/dashboard/stats" : `/api/dashboard/stats?lga=${lgaToUse}`


      const statsRes = await fetch(statsUrl)
      if (statsRes.ok) {
        const { stats: s } = await statsRes.json()
        setStats(s)
      } else throw new Error()

      // Reports
      const repBase = "/api/reports?limit=20"
      const repUrl =
        (session.user as any).role === "super_admin" || !currentLGA
          ? repBase
          : `${repBase}&lga=${encodeURIComponent(String(currentLGA).toLowerCase())}`

      const repRes = await fetch(repUrl)
      if (repRes.ok) {
        const { reports: r } = await repRes.json()
        setReports(r)
      } else throw new Error()
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }


  // --- Handlers ---
  // Update report handler
  const handleStatusUpdate = async () => {
    if (!selectedReport) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus, assigned_to: pendingDepartment || null, message: updateMessage, updatedBy: session.user.id }),
      })
      if (!res.ok) throw new Error()
      await fetchDashboardData(currentLGA)
      Swal.fire("Success", "Report updated successfully", "success")
    } catch (e) {
      Swal.fire("Error", "Failed to update report", "error")
    }finally {
    setUpdatingStatus(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      })
      if (!res.ok) throw new Error()
      const { lga } = await res.json()
      Swal.fire("Saved", "Your settings have been updated", "success")
      // update filter and refetch
      setCurrentLGA(lga)
    } catch {
      Swal.fire("Error", "Failed to save settings", "error")
    } finally {
      setSavingSettings(false)
    }
  }


    // View location
  const handleViewLocation = () => {
    router.push(`/map?reportId=${selectedReport?.id}`)
  }

  const filteredReports = useMemo(() => {
      return reports
        .filter(r => selectedStatus === "all" || r.status === selectedStatus)
        .filter(r => selectedLgaFilter === "all" || r.lga.toLowerCase() === selectedLgaFilter.toLowerCase())
    }, [reports, selectedStatus, selectedLgaFilter])

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">
              Lagos State LGA -{" "}
              {currentLGA ? currentLGA.charAt(0).toUpperCase() + currentLGA.slice(1) : "All"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export Reports
            </Button>
            <Button>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>
          </div>
        </div>
      </div>

      {databaseStatus === "disconnected" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto px-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="ml-3 text-sm text-yellow-700">
              <strong>Demo Mode:</strong> Database not connected. Using sample data.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Manage Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ========== OVERVIEW ========== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={()=>fetchDashboardData(currentLGA)}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold">{stats.totalReports}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.submitted}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent High Priority Reports</CardTitle>
                <CardDescription>Reports requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                      <p className="text-gray-500 mt-2">Loading reports...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No reports found.
                    </p>
                  ) : (
                    reports
                      .filter((r) => r?.urgency === "high")
                      .map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{report.title}</h4>
                            <p className="text-sm text-gray-600">
                              {report.ward} • {report.street}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {report.upvotes || 0} upvotes
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {report.created_at
                                  ? new Date(report.created_at).toLocaleDateString()
                                  : "No date"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">Assign</Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

{/* ========== MANAGE REPORTS ========== */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex gap-6">
              {/* Reports List */}
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <CardTitle>All Reports</CardTitle>
                    <div className="flex gap-4">
                      {/* Status filter */}
                      <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* LGA filter */}
                      <Select
                        value={selectedLgaFilter}
                        onValueChange={setSelectedLgaFilter}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lgaOptions.map((lga) => (
                            <SelectItem key={lga} value={lga}>
                              {lga === "all"
                                ? "All LGAs"
                                : lga.charAt(0).toUpperCase() + lga.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading reports...</p>
                        </div>
                      ) : filteredReports.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            No reports available. Check your database connection.
                          </p>
                        </div>
                      ) : (
                        filteredReports.map((report) => (
                          <div
                            key={report.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                              selectedReport?.id === report.id
                                ? "bg-blue-50 border-blue-200"
                                : ""
                            }`}
                            onClick={() => setSelectedReport(report)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{report.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {report.ward} • {report.lga}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={
                                      report.status === "resolved"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {report.status?.replace("-", " ") || "Unknown"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                  >
                                    {report.urgency || "medium"}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {report.upvotes || 0} upvotes
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {report.created_at
                                  ? new Date(report.created_at).toLocaleDateString()
                                  : "No date"}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>    

              {/* Report Details */}
              {selectedReport && (
                <div className="w-96">
                  <Card>
                    <CardHeader>
                      <CardTitle>Update Report Status</CardTitle>
                      <CardDescription>Report #{selectedReport.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedReport.title}</h4>
                        <p className="text-sm text-gray-600">
                          {selectedReport.ward} • {selectedReport.street}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Current Status</label>
                        <Select
                          value={pendingStatus} onValueChange={setPendingStatus} >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Assign To Department</label>
                        <Select value={pendingDepartment} onValueChange={setPendingDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public-works">Public Works</SelectItem>
                            <SelectItem value="environmental">Environmental</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Update Message</label>
                        <Textarea
                          placeholder="Add a message for the citizen..."
                          value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} rows={3}/>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleStatusUpdate} disabled={updatingStatus} >
                        {updatingStatus ? ( <> <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Updating… </> ) : ( <>  <MessageSquare className="h-4 w-4 mr-2" /> Send Update </> )} </Button>

                        <Button variant="outline" onClick={handleViewLocation}>
                          <MapPin className="h-4 w-4 mr-2" />
                          View Location
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========== ANALYTICS ========== */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Detailed insights and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500">Detailed charts, trends, and insights will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== SETTINGS ========== */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>LGA Settings</CardTitle>
                <CardDescription>Configure your LGA and contact info</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="lgaName" className="text-sm font-medium">
                      LGA Name
                    </label>
                    <Input
                      id="lgaName"
                      value={settingsForm.lgaName}
                      onChange={(e) =>
                        setSettingsForm((f) => ({
                          ...f,
                          lgaName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium">
                      Contact Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      value={settingsForm.phone}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? "Saving…" : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
