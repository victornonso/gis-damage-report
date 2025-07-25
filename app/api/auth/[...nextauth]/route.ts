// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword, createUser } from "@/lib/users";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email:     { label: "Email",     type: "email"    },
        password:  { label: "Password",  type: "password" },
        full_name: { label: "Full Name", type: "text"     },
        phone:     { label: "Phone",     type: "text"     },
        signup:    { label: "Sign Up?",  type: "text"     },
      },
      async authorize(credentials) {
        const { email, password, full_name, phone, signup } = credentials!;
        if (signup === "true") {
          // prevent duplicate emails
          if (await getUserByEmail(email)) return null;
          // create and return
          return await createUser({ email, password, full_name, phone });
        }
        // otherwise do a normal sign‑in
        return await verifyPassword(email, password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // so that `user` fields get into the JWT and session:
    async jwt({ token, user }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error:  "/auth?error=CredentialsSignin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
