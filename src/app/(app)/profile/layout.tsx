"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User, Settings, History, Heart, MapPin } from "lucide-react";

const profileLinks = [
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "My Orders",
    href: "/profile/my-orders",
    icon: Package,
  },
  {
    name: "Order History",
    href: "/profile/order-history",
    icon: History,
  },
  {
    name: "Saved Addresses",
    href: "/profile/addresses",
    icon: MapPin,
  },
  {
    name: "Favorites",
    href: "/profile/favorites",
    icon: Heart,
  },
  {
    name: "Settings",
    href: "/profile/settings",
    icon: Settings,
  },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 bg-base-200/30 rounded-2xl p-4 shadow-sm">
            <nav className="space-y-1">
              {profileLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-base-300/50 text-primary"
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
