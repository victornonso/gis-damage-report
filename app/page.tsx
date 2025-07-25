import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Camera, Bell, Users, Shield, Zap } from "lucide-react"
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import NavBar from "./components/NavBar";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">CommunityFix NG</h1>
          </div>
          <NavBar initialSession={session} /> 
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Report Public Issues in Your Community</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Help improve Nigeria's infrastructure by reporting damages, potholes, broken streetlights, and other public
          issues. Track progress and see real-time updates from your Local Government Area.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/report">
              <Camera className="mr-2 h-5 w-5" />
              Report an Issue
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/map">
              <MapPin className="mr-2 h-5 w-5" />
              View Issues Map
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Camera className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Report with GPS & Photo</CardTitle>
              <CardDescription>
                Take a photo and automatically capture GPS location. Add landmarks and descriptions in local languages.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <MapPin className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Interactive Map View</CardTitle>
              <CardDescription>
                See all reported issues on an interactive map with color-coded status pins. Filter by ward, street, or
                issue type.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Bell className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Get notifications when your report status changes: Submitted → In Progress → Resolved.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">For Citizens & Government</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>For Citizens</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Report issues quickly with GPS accuracy</li>
                  <li>• Track status of your reports in real-time</li>
                  <li>• Upvote existing reports to show priority</li>
                  <li>• Get notifications on progress updates</li>
                  <li>• Use landmarks and local language descriptions</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>For Local Government</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Centralized dashboard for all LGA reports</li>
                  <li>• Filter by wards, streets, and issue types</li>
                  <li>• Update status and communicate with citizens</li>
                  <li>• Prioritize based on community upvotes</li>
                  <li>• Generate reports and analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-6">Ready to Make a Difference?</h3>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of Nigerians working together to improve our communities.
        </p>
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
          <Link href="/report">
            <Zap className="mr-2 h-5 w-5" />
            Start Reporting Issues
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">CommunityFix NG</span>
              </div>
              <p className="text-gray-400">
                Empowering Nigerian communities to report and track public infrastructure issues.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/report" className="hover:text-white">
                    Report Issues
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="hover:text-white">
                    View Map
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-white">
                    Track Reports
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Government</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/admin" className="hover:text-white">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className="hover:text-white">
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/api-docs" className="hover:text-white">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CommunityFix NG. Built for Nigerian communities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
