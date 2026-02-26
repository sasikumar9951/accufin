import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { AuthOptions } from "next-auth";
import prisma from "./prisma";
// MFA features removed (all MFA-related code has been deleted)

// Validate user credentials
async function validateUserCredentials(email: string, password: string) {
  const cleanEmail = email.toLowerCase();
  console.log("cleanEmail in lib/auth.ts file :", cleanEmail);
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: cleanEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isActive: true,
      password: true,
      // MFA fields removed
    },
  });

  console.log("User in lib/auth.ts file :", user);

  if (!user) {
    throw new Error("No account found with this email");
  }

  if (user.isActive === false) {
    throw new Error("Your account is inactive. Please contact support.");
  }

  if (!user.password) {
    throw new Error("No password set for this account. Please use your provider (e.g., Google) or reset your password.");
  }

  const isValid = await compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return user;
}

// Create user return object
function createUserReturnObject(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    isAdmin: user.isAdmin,
  };
}

// Verify and use backup code

// Verify TOTP authentication

// Verify email MFA authentication

// Handle MFA verification

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        //login
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const user = await validateUserCredentials(
          credentials.email,
          credentials.password
        );



        // If all verifications pass, proceed with login
        return createUserReturnObject(user);
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user && (user as any).isActive === false) {
        return "/login?inactive=1";
      }
      return true;
    },
    async jwt({ token, user }) {
      //frontend jwt callback
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.isAdmin = user.isAdmin;
        token.email = user.email;
        token.profileUrl = (user as any).profileUrl;
      }
      return token;
    },
    async session({ session, token }) {
      //session session callback
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name as string;
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin;
        (session.user as any).profileUrl = token.profileUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes in seconds
    updateAge: 5 * 60, // refresh token every 5 minutes of activity
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes in seconds
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode for AWS logs
};
