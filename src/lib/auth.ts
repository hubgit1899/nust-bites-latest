import type { Session } from "next-auth";
import type { Types } from "mongoose";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export function hasRestaurantAccess(
  user: Session["user"],
  restaurantOwnerId: Types.ObjectId | string
) {
  if (!user?._id) return false;

  const isOwner = restaurantOwnerId.toString() === user._id;
  const isSuperAdmin = user.isSuperAdmin === true;

  return isOwner || isSuperAdmin;
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          isCustomer: user.isCustomer,
          isRestaurantOwner: user.isRestaurantOwner,
          isRestaurantAdmin: user.isRestaurantAdmin,
          isRider: user.isRider,
          isRiderVerified: user.isRiderVerified,
          isRiderAdmin: user.isRiderAdmin,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
