// hooks/useSessionRevalidation.ts
import { useState } from "react";
import { useSession } from "next-auth/react";
import { revalidateSession } from "@/lib/sessionUtils";

/**
 * Hook to manage session revalidation in client components
 * @returns Object with a function to revalidate the session and loading state
 */
export const useSessionRevalidation = () => {
  const { update } = useSession();
  const [isRevalidating, setIsRevalidating] = useState(false);

  /**
   * Revalidate the current user session
   * This triggers a fresh fetch of the session data
   */
  const revalidate = async (): Promise<void> => {
    setIsRevalidating(true);
    try {
      // Method 1: Using next-auth's update function (preferred in Next.js 14+)
      await update();

      // Method 2: Using our custom revalidateSession helper
      // Uncomment if Method 1 doesn't work for your use case
      // await revalidateSession();
    } catch (error) {
      console.error("Failed to revalidate session:", error);
    } finally {
      setIsRevalidating(false);
    }
  };

  return {
    revalidateSession: revalidate,
    isRevalidating,
  };
};

export default useSessionRevalidation;
