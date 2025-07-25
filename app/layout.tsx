import "./globals.css"
import { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import Providers from "./providers"

export const metadata = {
  title: "CommunityFix NG",
  description: "Report and track community issues",
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  // fetch session on the server
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Providers is a client component */}
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}

