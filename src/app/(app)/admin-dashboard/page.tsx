"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Store,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";

interface DashboardStats {
  restaurants: {
    total: number;
    active: number;
    pending: number;
  };
  users: {
    total: number;
    customers: number;
    riders: number;
    restaurantOwners: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
  };
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats");
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          toast.error("Failed to fetch dashboard statistics");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isSuperAdmin) {
      fetchStats();
    }
  }, [session]);

  if (!session?.user?.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-base-content/70">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
          <p className="text-base-content/70">
            Unable to load dashboard statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurants Stats */}
      <div className="bg-base-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Store size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Restaurants</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-base-content/70" />
              <span className="text-base-content/70">Total Restaurants</span>
            </div>
            <p className="text-2xl font-bold">{stats.restaurants.total}</p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-success" />
              <span className="text-base-content/70">Active</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {stats.restaurants.active}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-warning" />
              <span className="text-base-content/70">Pending</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {stats.restaurants.pending}
            </p>
          </div>
        </div>
      </div>

      {/* Users Stats */}
      <div className="bg-base-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Users size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Users</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-base-content/70" />
              <span className="text-base-content/70">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.users.total}</p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-info" />
              <span className="text-base-content/70">Customers</span>
            </div>
            <p className="text-2xl font-bold text-info">
              {stats.users.customers}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-success" />
              <span className="text-base-content/70">Riders</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {stats.users.riders}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-warning" />
              <span className="text-base-content/70">Restaurant Owners</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {stats.users.restaurantOwners}
            </p>
          </div>
        </div>
      </div>

      {/* Orders Stats */}
      <div className="bg-base-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Package size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Orders</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={20} className="text-base-content/70" />
              <span className="text-base-content/70">Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{stats.orders.total}</p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-success" />
              <span className="text-base-content/70">Completed</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {stats.orders.completed}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-warning" />
              <span className="text-base-content/70">Pending</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {stats.orders.pending}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={20} className="text-error" />
              <span className="text-base-content/70">Cancelled</span>
            </div>
            <p className="text-2xl font-bold text-error">
              {stats.orders.cancelled}
            </p>
          </div>
          <div className="bg-base-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-success" />
              <span className="text-base-content/70">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-success">
              Rs.{stats.orders.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
