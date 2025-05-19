"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldUser, Settings, ChevronDown, ChevronUp } from "lucide-react";

const profileLinks = [
  {
    name: "Dashboard",
    href: "/admin-dashboard",
    icon: ShieldUser,
  },
  {
    name: "Settings",
    href: "/admin-dashboard/settings",
    icon: Settings,
  },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Find the active link
  const activeLink =
    profileLinks.find((link) => pathname === link.href) || profileLinks[0];
  const ActiveIcon = activeLink.icon;

  return (
    <div className="container mx-auto ">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn bg-base-300/50 hover:bg-base-300/70 w-full justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <ActiveIcon size={20} />
              <span>{activeLink.name}</span>
            </div>
            {isSidebarOpen ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`lg:col-span-1 transition-all duration-200 ease-in-out ${
            isSidebarOpen
              ? "block opacity-100 translate-y-0"
              : "hidden opacity-0 -translate-y-2 lg:block lg:opacity-100 lg:translate-y-0"
          }`}
        >
          <div className="lg:sticky lg:top-20 bg-base-300/50 rounded-2xl p-4 shadow-sm">
            <nav className="space-y-1">
              {profileLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-base-300/70 text-primary"
                        : "hover:bg-base-300/30"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
