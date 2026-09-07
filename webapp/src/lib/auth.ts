import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { isInternalRole } from "./constants";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          enterpriseAccountId: user.enterpriseAccountId,
          restrictedFacilityId: user.restrictedFacilityId,
          restrictedRegionId: user.restrictedRegionId,
          restrictedCountryId: user.restrictedCountryId,
          csScope: user.csScope,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.enterpriseAccountId = user.enterpriseAccountId;
        token.restrictedFacilityId = user.restrictedFacilityId;
        token.restrictedRegionId = user.restrictedRegionId;
        token.restrictedCountryId = user.restrictedCountryId;
        token.csScope = user.csScope;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.enterpriseAccountId = token.enterpriseAccountId;
        session.user.restrictedFacilityId = token.restrictedFacilityId;
        session.user.restrictedRegionId = token.restrictedRegionId;
        session.user.restrictedCountryId = token.restrictedCountryId;
        session.user.csScope = token.csScope;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
};

export function defaultLandingPath(role: string): string {
  return isInternalRole(role) ? "/ops" : "/portal";
}
