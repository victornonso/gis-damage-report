"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function TestDbPage() {
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        status: "error",
        error: "Failed to connect to test endpoint",
        details: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
          <p className="text-gray-600">Test Database connection and verify the database setup.</p>
        </div>

        <div className="grid gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Test
              </CardTitle>
              <CardDescription>Click the button below to test database connection and setup.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runTest} disabled={loading} className="mr-4">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={testResult.status === "success" ? "default" : "destructive"}>
                    {testResult.status}
                  </Badge>
                </div>

                {testResult.status === "success" ? (
                  <div className="space-y-4">
                    {/* Connection Info */}
                    <div>
                      <h4 className="font-medium mb-2">Connection Details</h4>
                      <div className="bg-green-50 p-3 rounded-lg space-y-1 text-sm">
                        <div>
                          <strong>Time:</strong> {testResult.connection?.time}
                        </div>
                        <div>
                          <strong>PostgreSQL Version:</strong> {testResult.connection?.version}
                        </div>
                      </div>
                    </div>

                    {/* Tables */}
                    <div>
                      <h4 className="font-medium mb-2">Database Tables</h4>
                      <div className="flex gap-2 flex-wrap">
                        {testResult.tables?.map((table) => (
                          <Badge key={table} variant="outline" className="bg-blue-50">
                            {table}
                          </Badge>
                        ))}
                      </div>
                      {testResult.tables?.length === 0 && (
                        <p className="text-red-600 text-sm">No tables found. Make sure you ran the SQL scripts.</p>
                      )}
                    </div>

                    {/* Data Counts */}
                    <div>
                      <h4 className="font-medium mb-2">Sample Data</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{testResult.data?.categories || 0}</div>
                          <div className="text-sm text-gray-600">Categories</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{testResult.data?.reports || 0}</div>
                          <div className="text-sm text-gray-600">Reports</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">{testResult.data?.users || 0}</div>
                          <div className="text-sm text-gray-600">Users</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Database Setup Complete!</h4>
                      <p className="text-green-700 text-sm">
                        Your Supabase database is connected and properly configured. You can now use the application
                        with real data.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">❌ Connection Failed</h4>
                      <p className="text-red-700 text-sm mb-2">
                        <strong>Error:</strong> {testResult.error}
                      </p>
                      {testResult.details && (
                        <p className="text-red-600 text-sm">
                          <strong>Details:</strong> {testResult.details}
                        </p>
                      )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h4>
                      <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
                        <li>Make sure your DATABASE_URL environment variable is set correctly</li>
                        <li>Verify your Supabase project is not paused</li>
                        <li>Check that you ran both SQL scripts (create-database.sql and seed-data.sql)</li>
                        <li>Ensure your Supabase project allows connections from this domain</li>
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Environment Variables Help */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Setup</CardTitle>
              <CardDescription>Make sure you have the correct environment variables configured.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Required Environment Variable:</h4>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"
                </code>
                <p className="text-sm text-gray-600 mt-2">
                  Replace <code>your-password</code> and <code>your-project-ref</code> with your actual Supabase
                  credentials.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Once your database is connected, try these features:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" asChild className="h-auto p-4 flex-col bg-transparent">
                  <Link href="/admin">
                    <Database className="h-6 w-6 mb-2" />
                    Admin Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4 flex-col bg-transparent">
                  <Link href="/map">
                    <Database className="h-6 w-6 mb-2" />
                    View Map
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4 flex-col bg-transparent">
                  <Link href="/report">
                    <Database className="h-6 w-6 mb-2" />
                    Submit Report
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4 flex-col bg-transparent">
                  <Link href="/reports">
                    <Database className="h-6 w-6 mb-2" />
                    My Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
