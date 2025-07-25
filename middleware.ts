// middleware.ts
import { withAuth } from "next-auth/middleware"

// Protect everything under /report (and you can add more patterns)
export default withAuth({
  pages: {
    signIn: "/auth",              // where to redirect for login
  },
})

// matcher tells Next.js which paths to run this on
export const config = {
  matcher: [
    "/report/:path*",             // protect /report and all sub‑paths
    "/reports/:path*",             // protect /report and all sub‑paths
    "/map/:path*",             // protect /report and all sub‑paths
    "/admin/:path*",             // protect /report and all sub‑paths
    // you can add more, e.g. "/dashboard/:path*" or "/admin/:path*"
  ],
}
