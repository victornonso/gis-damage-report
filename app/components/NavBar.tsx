// app/components/NavBar.tsx
"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface NavBarProps {
  initialSession: import("next-auth").Session | null
}

export default function NavBar({ initialSession }: NavBarProps) {
  // hydrate the session client-side
  const { data: session } = useSession()

  // common navigation links
  const navLinks = (
    <nav className="hidden md:flex items-center gap-6">
      <Link href="/map" className="text-gray-600 hover:text-green-600">
        View Map
      </Link>
      <Link href="/reports" className="text-gray-600 hover:text-green-600">
        My Reports
      </Link>
      <Link href="/admin" className="text-gray-600 hover:text-green-600">
        Admin
      </Link>
      {/* <Link href="/test-db" className="text-gray-600 hover:text-green-600">
        Test DB
      </Link> */}
    </nav>
  )

  // if not logged in, show navLinks + sign in/report buttons
  if (!session?.user) {
    return (
      <div className="flex items-center gap-4">
        {navLinks}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/auth">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/report">Report Issue</Link>
          </Button>
        </div>
      </div>
    )
  }

  // logged in: show navLinks + user name + sign out
  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut({ callbackUrl: "/" })
    }
  }

  return (
    <div className="flex items-center gap-4">
      {navLinks}
      <span className="hidden md:inline text-gray-800 font-medium">
        {session.user.full_name}
      </span>
      <Button variant="destructive" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
