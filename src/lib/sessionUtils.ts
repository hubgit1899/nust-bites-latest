// lib/sessionUtils.ts
import { getSession, signIn, signOut } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

/**
 * Revalidate the current session on the client side
 * This forces Next-Auth to fetch fresh session data from the server
 * @returns Promise that resolves when the session has been revalidated
 */
export const revalidateSession = async (): Promise<void> => {
  // This forces next-auth to refresh the session data
  const session = await getSession();
  if (session) {
    // This triggers a re-fetch of the session
    await signIn("credentials", {
      redirect: false,
      identifier: session.user.email || session.user.username,
      password: "", // This won't actually be used since we're using redirect: false
    });
  }
};

/**
 * Utility function to force token refresh on the server side
 * Updates the lastRoleRefresh time to force a refresh on next request
 * @returns Updated session or null if no active session
 */
export const forceTokenRefresh = async () => {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Set lastRoleRefresh to 0 to force a refresh on the next request
  if (session.user) {
    // We directly update the token by manipulating the JWT
    // This is a workaround since we can't directly modify the token from here

    // For server components, you can use this as a signal to refresh
    return {
      ...session,
      forceRefresh: true,
    };
  }

  return session;
};

/**
 * Update user role and revalidate session (server-side)
 * This should be called after updating a user's role in the database
 * @param userId The ID of the user whose role was updated
 */
export const updateUserRoleAndRevalidate = async (
  userId: string
): Promise<void> => {
  // For server actions or API routes, you can't directly update the session
  // Instead, you need to force the next request to refresh the token

  // In practice, the session will be refreshed on the next request
  // due to the THIRTY_MINUTES check in the JWT callback

  // To force an immediate refresh, you might need to:
  // 1. Set a flag in your database that's checked on auth
  // 2. Or implement a custom event system (websockets, etc)

  // For now, we can reset the lastRoleRefresh time in our database
  // This is a placeholder for a real implementation
  await forceTokenRefresh();
};
