// app/reports/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
} from "lucide-react"
import Link from "next/link"

interface Report {
  id: number
  title: string
  description: string
  category_slug: string
  status: "submitted" | "in-progress" | "resolved"
  urgency: string
  location: string
  landmark?: string
  upvotes: number
  reportedAt: string
  lastUpdate: string
  updateMessage: string
  photo: string
  progress: number
  user_id: number
}


const statusConfig = {
  submitted: {
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Clock,
    label: "Submitted",
  },
  "in-progress": {
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: AlertCircle,
    label: "In Progress",
  },
  resolved: {
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
    label: "Resolved",
  },
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch reports once session is loaded
  useEffect(() => {
    if (status !== "authenticated") return

    const fetchReports = async () => {
      setLoading(true)
      const res = await fetch("/api/reports")
      if (!res.ok) {
        setReports([])
        setLoading(false)
        return
      }
      const json = await res.json()
      let data: Report[] = json.reports

      // if not admin or super_admin, filter by current user
      const role = (session.user as any).role
      if (role !== "admin" && role !== "super_admin") {
        data = data.filter((r) => r.user_id === session.user.id)
      }

      setReports(data)
      setLoading(false)
    }

    fetchReports()
  }, [session, status])

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "submitted":
        return 25
      case "in-progress":
        return 60
      case "resolved":
        return 100
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading your reports…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Reports</h1>
              <p className="text-gray-600">Track the status of your submitted reports</p>
            </div>
            <Button asChild>
              <Link href="/report">Report New Issue</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({reports.filter((r) => r.status === "submitted").length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({reports.filter((r) => r.status === "in-progress").length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({reports.filter((r) => r.status === "resolved").length})
            </TabsTrigger>
          </TabsList>

          {/* ALL */}
          <TabsContent value="all">
            <div className="grid gap-6">
              {reports.map((report) => {
                const statusInfo = statusConfig[report.status]
                const StatusIcon = statusInfo.icon
                return (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2">{report.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4" />
                            {report.location}
                            {report.landmark && ` • ${report.landmark}`}
                          </CardDescription>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusInfo.color} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {report.urgency} Priority
                            </Badge>
                            <Badge variant="outline">
                              {(report.category_slug ?? "Uncategorized").replace("-", " ")}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-gray-600">{report.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Progress</span>
                          <span className={statusInfo.textColor}>
                            {getStatusProgress(report.status)}%
                          </span>
                        </div>
                        <Progress value={getStatusProgress(report.status)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Submitted</span>
                          <span>In Progress</span>
                          <span>Resolved</span>
                        </div>
                      </div>

                      {/* Latest Update */}
                      <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">Latest Update</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {report.lastUpdate}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {report.updateMessage}
                        </p>
                      </div>

                      {/* Stats and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{report.upvotes} upvotes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Reported {report.reportedAt}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/map?report=${report.id}`}>
                              <MapPin className="h-4 w-4 mr-1" />
                              View on Map
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* SUBMITTED */}
          <TabsContent value="submitted">
            <div className="grid gap-6">
              {reports
                .filter((r) => r.status === "submitted")
                .map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{report.title}</h3>
                      <p className="text-gray-600 mb-4">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-yellow-500 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {report.reportedAt}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* IN PROGRESS */}
          <TabsContent value="in-progress">
            <div className="grid gap-6">
              {reports
                .filter((r) => r.status === "in-progress")
                .map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{report.title}</h3>
                      <p className="text-gray-600 mb-4">{report.description}</p>
                      <div className="space-y-2 mb-4">
                        <Progress
                          value={getStatusProgress(report.status)}
                          className="h-2"
                        />
                        <p className="text-sm text-blue-600">
                          {report.updateMessage}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500 text-white">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {report.lastUpdate}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* RESOLVED */}
          <TabsContent value="resolved">
            <div className="grid gap-6">
              {reports
                .filter((r) => r.status === "resolved")
                .map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{report.title}</h3>
                      <p className="text-gray-600 mb-4">{report.description}</p>
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-green-700">
                          {report.updateMessage}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {report.lastUpdate}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {reports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Reports Yet
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't submitted any reports yet. Help improve your community by reporting issues.
              </p>
              <Button asChild>
                <Link href="/report">Report Your First Issue</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
