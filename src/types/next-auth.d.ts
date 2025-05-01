import { Item } from "@/models/Order";
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    email?: string;
    isCustomer?: boolean;

    // Rider fields
    isRider?: boolean;
    isRiderVerified?: boolean;

    isSuperAdmin?: boolean;
    isRiderAdmin?: boolean;
    isRestaurantAdmin?: boolean;
    isRestaurantOwner?: boolean;
  }
  interface Session {
    user: {
      _id?: string;
      isVerified?: boolean;
      username?: string;
      email?: string;
      bucket?: Item[];

      isCustomer?: boolean;

      // Rider fields
      isRider?: boolean;
      isRiderVerified?: boolean;

      isSuperAdmin?: boolean;
      isRiderAdmin?: boolean;
      isRestaurantAdmin?: boolean;
      isRestaurantOwner?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    email?: string;
    isCustomer?: boolean;

    // Rider fields
    isRider?: boolean;
    isRiderVerified?: boolean;

    isSuperAdmin?: boolean;
    isRiderAdmin?: boolean;
    isRestaurantAdmin?: boolean;
    isRestaurantOwner?: boolean;

    lastRoleRefresh?: number;
  }
}
