import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface User {
    is2FAVerified: boolean;
  }
  interface Session {
    user: {
      userId: string;
      email: string;
      is2FAVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    is2FAVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, is2FAVerified: false };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.is2FAVerified = user.is2FAVerified;
      }
      if (trigger === "update" && session?.is2FAVerified !== undefined) {
        token.is2FAVerified = session.is2FAVerified;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userId = token.userId;
      session.user.is2FAVerified = token.is2FAVerified;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
