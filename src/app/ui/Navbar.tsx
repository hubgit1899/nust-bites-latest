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
import Cart from "../components/Cart";
import Avatar from "../components/Avatar";

const Navbar = () => {
  const navbarRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as User;
  console.log("User: ", user);
  const router = useRouter();
  const [navbarHeight, setNavbarHeight] = useState(0);

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
    revalidateOnFocus: false,
    refreshInterval: 1000 * 60 * 10, // revalidate every 10 minutes
  });
  console.log("Restaurants: ", restaurants);

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

  return (
    <div>
      <div
        ref={navbarRef}
        className="navbar fixed top-0 left-0 w-full z-50 mx-auto px-4 sm:px-6 bg-base-200/80 backdrop-blur-md shadow-sm "
      >
        <div className="navbar-start">
          <div className="drawer">
            <input id="my-drawer" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
              {/* Page content here */}
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
                <ul>
                  {restaurants?.map((restaurant) => (
                    <Link
                      key={String(restaurant._id)}
                      href={`/restaurant/${restaurant._id}`}
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
              </ul>
            </div>
          </div>
        </div>
        <div className="navbar-center">
          <MainLogo />
        </div>
        <div className="navbar-end gap-1.5">
          {user ? (
            <>
              <div className="dropdown dropdown-end">
                <Cart />
              </div>
              <div className="dropdown dropdown-end">
                <>
                  <Avatar
                    user={{ ...session!.user, id: session!.user._id || "" }}
                  />
                  <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
                  >
                    <li>
                      <a className="justify-between">
                        Profile
                        <span className="badge">New</span>
                      </a>
                    </li>
                    <li>
                      <a>Settings</a>
                    </li>
                    <li>
                      <button onClick={() => signOut()}>Logout</button>
                    </li>
                  </ul>
                </>
              </div>
            </>
          ) : page.isSignIn ? (
            <button
              className="btn btn-primary btn-outline"
              onClick={() => router.push("/sign-up")}
            >
              Sign Up
            </button>
          ) : (
            <button
              className="btn btn-primary btn-outline"
              onClick={() => router.push("/sign-in")}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
