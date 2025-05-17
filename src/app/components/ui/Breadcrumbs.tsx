"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, House } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  // Check if we're on a restaurant menu page
  const isRestaurantMenuPage = pathname.startsWith("/restaurant/menu/");

  useEffect(() => {
    // Check if we can go back using router
    const checkCanGoBack = async () => {
      try {
        // Try to get the previous page from router
        const hasHistory = window.history.length > 1;
        const isNotHomePage = pathname !== "/";
        setCanGoBack(hasHistory && isNotHomePage);
      } catch (error) {
        setCanGoBack(false);
      }
    };

    checkCanGoBack();
  }, [pathname, router]);

  // Don't show breadcrumbs on home page
  if (pathname === "/") return null;

  const handleBack = () => {
    router.back();
  };

  return (
    <div
      className={`flex items-center text-sm ${
        isRestaurantMenuPage ? "mt-2.5" : "-mt-3.5"
      } mb-1 relative z-20`} // Added z-index to ensure it stays above other elements
    >
      <div className="flex items-center gap-1">
        {canGoBack && (
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm btn-circle p-0 hover:bg-base-200 -mr-0.5 pointer-events-auto" // Added pointer-events-auto
            aria-label="Go back"
          >
            <ArrowLeft size={16} className="text-base-content/70" />
          </button>
        )}
        <Link
          href="/"
          className="text-base-content/70 hover:text-base-content hover:underline transition-colors flex items-center gap-1 pointer-events-auto" // Added pointer-events-auto
          aria-label="Go to home page"
        >
          <House size={16} />
          Home
        </Link>
      </div>
    </div>
  );
}
