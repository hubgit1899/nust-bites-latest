"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import { User } from "next-auth";
import MainLogo from "./MainLogo";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { toast } from "sonner";
import useSWR from "swr";
import { Restaurant } from "@/models/Restaurant";
import { useRouter } from "next/navigation";
import Cart from "../components/navbar/Cart";
import Avatar from "../components/navbar/Avatar";
import CustomerDetailsModal from "../components/navbar/CustomerDetailsModal";
import {
  HousePlus,
  LogIn,
  LogOut,
  ShieldUser,
  Store,
  User as UserIcon,
  UserPlus,
} from "lucide-react";

const Navbar = () => {
  const navbarRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession(); // Added status to properly track authentication state
  const user = session?.user as User;
  const router = useRouter();
  const [, setNavbarHeight] = useState(0);
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] =
    useState(false);

  // Only define roles if user exists
  const roles = user
    ? {
        isCustomer: user.isCustomer,
        isRestaurantOwner: user.isRestaurantOwner,
        isRestaurantAdmin: user.isRestaurantAdmin,
        isRider: user.isRider,
        isRiderVerified: user.isRiderVerified,
        isRiderAdmin: user.isRiderAdmin,
        isSuperAdmin: user.isSuperAdmin,
      }
    : null;

  const page = {
    isSignIn: pathname === "/sign-in",
    isSignUp: pathname === "/sign-up",
  };

  const fetcher = async (url: string): Promise<Restaurant[]> => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch");
    }
    return data.restaurants;
  };

  const { data: restaurants, error } = useSWR("/api/get-restaurants", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (error) {
      console.error("❌ Error fetching restaurants:", error);
      toast.error("Failed to fetch restaurants", {
        description: error.message,
      });
    }
  }, [error]);

  useEffect(() => {
    if (navbarRef.current) {
      const height = navbarRef.current.offsetHeight;
      setNavbarHeight(height);
      document.documentElement.style.setProperty(
        "--navbar-height",
        `${height}px`
      );
    }
  }, []);

  useEffect(() => {
    if (navbarRef.current) {
      const height = navbarRef.current.offsetHeight;
      setNavbarHeight(height);
      document.documentElement.style.setProperty(
        "--navbar-height",
        `${height}px`
      );
    }
  }, [navbarRef.current]);

  useEffect(() => {
    // Show modal if user is verified but not a customer
    if (user && !roles?.isCustomer) {
      setShowCustomerDetailsModal(true);
    }
  }, [user, roles?.isCustomer]);

  // Render loading state while authentication status is being determined
  const isLoading = status === "loading";

  return (
    <div className="mb-5">
      <div
        ref={navbarRef}
        className="navbar fixed top-0 left-0 w-full z-50 mx-auto px-4 sm:px-6 bg-base-200/80 backdrop-blur-md shadow-sm"
      >
        <div className="navbar-start">
          <div className="drawer">
            <input id="my-drawer" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
              <label
                htmlFor="my-drawer"
                className="btn btn-ghost btn-circle drawer-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              </label>
            </div>
            <div className="drawer-side">
              <label
                htmlFor="my-drawer"
                aria-label="close sidebar"
                className="drawer-overlay"
              ></label>
              <ul className="menu w-65 min-h-full p-4 bg-base-200/90 backdrop-blur-md text-base-content shadow-lg">
                <div className="flex justify-end mt-2 mr-2 mb-4">
                  <ThemeToggle />
                </div>
                <h2 className="text-xl font-semibold mb-2">Restaurants</h2>
                {!restaurants ? (
                  <div className="flex justify-center items-center py-10">
                    <span className="loading loading-spinner loading-xl"></span>
                  </div>
                ) : (
                  <ul>
                    {restaurants.map((restaurant) => (
                      <Link
                        key={String(restaurant._id)}
                        href={`/restaurant/menu/${restaurant._id}`}
                        className="block"
                      >
                        <div
                          className="tooltip tooltip-right"
                          data-tip={restaurant.name}
                        >
                          <li
                            className="relative rounded-lg cursor-pointer overflow-hidden"
                            style={{
                              backgroundColor: restaurant.accentColor,
                              border: "none",
                              aspectRatio: "2.88 / 1",
                              height: "80px",
                              backgroundImage: "none",
                              marginBottom: "4%",
                            }}
                          >
                            {/* Status dot */}
                            <div className="absolute top-0 right-0 z-10">
                              <div className="inline-grid *:[grid-area:1/1]">
                                <div
                                  className={`status status-sm animate-ping ${
                                    restaurant.online
                                      ? "status-success"
                                      : "status-error"
                                  }`}
                                ></div>
                                <div
                                  className={`status status-sm ${
                                    restaurant.online
                                      ? "status-success"
                                      : "status-error"
                                  }`}
                                ></div>
                              </div>
                            </div>

                            {/* Logo Image */}
                            <img
                              src={restaurant.logoImageURL}
                              alt={restaurant.name}
                              className="h-full w-full object-contain transition-transform duration-300 hover:scale-110"
                              style={{
                                backgroundColor: "transparent",
                              }}
                            />
                          </li>
                        </div>
                      </Link>
                    ))}
                  </ul>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="navbar-center">
          <MainLogo />
        </div>
        <div className="navbar-end gap-2">
          {isLoading ? (
            // Show loading spinner while session status is being determined
            <div className="h-10 w-10 flex items-center justify-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : status === "authenticated" && user ? (
            // Only show user UI when explicitly authenticated
            <>
              <div className="dropdown dropdown-end">
                <Cart />
              </div>
              <div className="dropdown dropdown-end">
                <>
                  <Avatar
                    user={{ ...session.user, id: session.user._id || "" }}
                  />
                  <ul
                    tabIndex={0}
                    className="menu menu-md dropdown-content bg-base-200 rounded-box z-1 mt-1.5 w-52 p-2 shadow-lg"
                  >
                    <li>
                      <Link className="gap-1" href="/profile">
                        <UserIcon size={16} />
                        Profile
                      </Link>
                    </li>
                    {roles?.isSuperAdmin && (
                      <li>
                        <button
                          className="gap-1"
                          onClick={() => router.push("/admin-dashboard")}
                        >
                          <ShieldUser size={16} />
                          Admin Dashboard
                        </button>
                      </li>
                    )}
                    {roles?.isRestaurantOwner && (
                      <li>
                        <button
                          className="gap-1"
                          onClick={() =>
                            router.push("/restaurant/my-restaurants")
                          }
                        >
                          <Store size={16} />
                          My Restaurants
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        className="gap-1"
                        onClick={() =>
                          router.push("/restaurant/add-restaurant")
                        }
                      >
                        <HousePlus size={16} />
                        Add Restaurant
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn btn-xs mt-1 btn-outline btn-error gap-1"
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </li>
                  </ul>
                </>
              </div>
            </>
          ) : page.isSignIn ? (
            // Not authenticated and on sign-in page
            <button
              className="btn btn-primary btn-outline gap-2"
              onClick={() => router.push("/sign-up")}
            >
              <UserPlus size={20} />
              Sign Up
            </button>
          ) : (
            // Not authenticated and not on sign-in page
            <button
              className="btn btn-primary btn-outline gap-2"
              onClick={() => router.push("/sign-in")}
            >
              <LogIn size={20} />
              Sign In
            </button>
          )}
        </div>
      </div>
      <CustomerDetailsModal
        isOpen={showCustomerDetailsModal}
        onClose={() => setShowCustomerDetailsModal(false)}
      />
    </div>
  );
};

export default Navbar;
