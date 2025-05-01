import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { errorMessages } from "@/app/constants/errorMessages";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });

          if (!user) throw new Error(errorMessages.USER_NOT_FOUND);

          if (!user.isVerified) {
            throw new Error(
              `${errorMessages.UNVERIFIED_ACCOUNT}:${user.username}`
            );
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect)
            throw new Error(errorMessages.INCORRECT_PASSWORD);

          return user;
        } catch (err: any) {
          throw new Error(err);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const THIRTY_MINUTES = 10 * 1000; // Change this is production

      // On first sign-in
      if (user) {
        token._id = user._id?.toString();
        token.email = user.email;
        token.username = user.username;
        token.isVerified = user.isVerified;

        token.isCustomer = user.isCustomer;
        token.isRider = user.isRider;
        token.isRiderVerified = user.isRiderVerified;
        token.isSuperAdmin = user.isSuperAdmin;
        token.isRiderAdmin = user.isRiderAdmin;
        token.isRestaurantAdmin = user.isRestaurantAdmin;
        token.isRestaurantOwner = user.isRestaurantOwner;

        token.lastRoleRefresh = Date.now();
      }

      // Periodically refresh roles every 30 minutes
      if (
        token._id &&
        (!token.lastRoleRefresh ||
          Date.now() - token.lastRoleRefresh > THIRTY_MINUTES)
      ) {
        await dbConnect();
        const latestUser = await UserModel.findById(token._id).lean();
        if (!latestUser) {
          throw new Error("User no longer exists");
        } else {
          token.isCustomer = latestUser.isCustomer;
          token.isRider = latestUser.isRider;
          token.isRiderVerified = latestUser.isRiderVerified;
          token.isSuperAdmin = latestUser.isSuperAdmin;
          token.isRiderAdmin = latestUser.isRiderAdmin;
          token.isRestaurantAdmin = latestUser.isRestaurantAdmin;
          token.isRestaurantOwner = latestUser.isRestaurantOwner;
          token.lastRoleRefresh = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user._id = token._id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.isVerified = token.isVerified;

      session.user.isCustomer = token.isCustomer;
      session.user.isRider = token.isRider;
      session.user.isRiderVerified = token.isRiderVerified;
      session.user.isSuperAdmin = token.isSuperAdmin;
      session.user.isRiderAdmin = token.isRiderAdmin;
      session.user.isRestaurantAdmin = token.isRestaurantAdmin;
      session.user.isRestaurantOwner = token.isRestaurantOwner;

      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 2592000,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
