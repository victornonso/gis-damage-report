// app/providers.tsx
"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

interface ProvidersProps {
  children: ReactNode
  session: import("next-auth").Session | null
}

export default function Providers({ children, session }: ProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
