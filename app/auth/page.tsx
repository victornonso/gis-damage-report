"use client"

import Swal from "sweetalert2"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Mail, Lock, User, Phone } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {

  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const email     = form.get("email")     as string;
    const password  = form.get("password")  as string;
    const full_name = form.get("full_name") as string | undefined;
    const phone     = form.get("phone")     as string | undefined;

    if (tab === "signup") {
      // Call our new signup API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name, phone }),
      })

      setIsLoading(false)

      if (!res.ok) {
        const { error } = await res.json()
        Swal.fire("Error", error || "Failed to create account", "error")
      } else {
        Swal.fire("Success", "Account created! Please sign in.", "success")
        setTab("signin")
      }
      return
    }

    // Sign‑In flow
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    })

    setIsLoading(false)

    if (res?.error) {
      Swal.fire("Error", res.error, "error")
    } else {
      router.push(res.url!)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">CommunityFix NG</h1>
          </div>
          <p className="text-gray-600">
            Join thousands of Nigerians improving their communities
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In */}
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to track your reports and stay updated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form name="signin" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-green-600 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join the community and start reporting issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form name="signup" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fullname">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullname"
                        name="full_name"
                        type="text"
                        placeholder="Adebayo Ogundimu"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
                <div className="mt-4 text-center text-xs text-gray-500">
                  By signing up, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-green-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-green-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-green-600"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
