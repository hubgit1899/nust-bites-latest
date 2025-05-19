"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Navigation,
} from "lucide-react";
import Link from "next/link";

interface Order {
  _id: string;
  orderId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "DELIVERED"
    | "CANCELLED";
  orderAmount: number;
  deliveryFee: number;
  items: Array<{
    name: string;
    quantity: number;
    basePrice: number;
    options?: Array<{
      optionHeader: string;
      selected: string;
      additionalPrice: number;
    }>;
  }>;
  dropoffLocation: {
    address: string;
  };
  createdAt: string;
  restaurant: {
    name: string;
    accentColor: string;
  };
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    text: "Pending",
  },
  CONFIRMED: {
    icon: CheckCircle2,
    color: "text-info",
    bgColor: "bg-info/10",
    text: "Confirmed",
  },
  PREPARING: {
    icon: Package,
    color: "text-info",
    bgColor: "bg-info/10",
    text: "Preparing",
  },
  READY: {
    icon: Package,
    color: "text-success",
    bgColor: "bg-success/10",
    text: "Ready",
  },
  DELIVERED: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    text: "Delivered",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-error",
    bgColor: "bg-error/10",
    text: "Cancelled",
  },
};

export default function MyOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders/active");
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          toast.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-base-200/30 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-base-300/50 rounded-full">
            <Package size={64} className="text-base-content/30" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3">No Active Orders</h2>
        <p className="text-base-content/70 mb-8">
          You don't have any active orders at the moment.
        </p>
        <Link href="/" className="btn btn-primary">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="grid gap-6">
        {orders.map((order) => {
          const StatusIcon = statusConfig[order.status].icon;
          return (
            <div
              key={order.orderId}
              className="bg-base-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-semibold text-lg">{order.orderId}</h2>
                    <div
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 ${statusConfig[order.status].bgColor} ${statusConfig[order.status].color}`}
                    >
                      <StatusIcon size={16} />
                      <span>{statusConfig[order.status].text}</span>
                    </div>
                  </div>
                  <p className="text-base-content/70">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: `${order.restaurant.accentColor}20`,
                    }}
                  >
                    <Package
                      size={20}
                      style={{ color: order.restaurant.accentColor }}
                    />
                  </div>
                  <span className="font-medium">{order.restaurant.name}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Order Items */}
                <div className="bg-base-300 rounded-xl p-4">
                  <h3 className="font-medium mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.orderId}-item-${index}`}
                        className="flex justify-between items-start"
                      >
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {item.name}
                          </p>
                          {item.options && item.options.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.options.map((option, optIndex) => (
                                <p
                                  key={`${order.orderId}-item-${index}-option-${optIndex}`}
                                  className="text-sm text-base-content/70"
                                >
                                  {option.optionHeader}: {option.selected}
                                  {option.additionalPrice > 0 && (
                                    <span className="ml-1">
                                      (+Rs.{option.additionalPrice.toFixed(2)})
                                    </span>
                                  )}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="font-medium">
                          Rs.{(item.basePrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="bg-base-300 rounded-xl p-4">
                  <h3 className="font-medium mb-3">Delivery Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-base-300/50">
                        <MapPin size={20} className="text-base-content/70" />
                      </div>
                      <div>
                        <p className="font-medium">Delivery Address</p>
                        <p className="text-base-content/70">
                          {order.dropoffLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-base-300 rounded-xl p-4">
                  <h3 className="font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-base-content/70">
                      <span>Subtotal</span>
                      <span>Rs.{order.orderAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base-content/70">
                      <span>Delivery Fee</span>
                      <span>Rs.{order.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-base-300 my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span style={{ color: order.restaurant.accentColor }}>
                        Rs.{(order.orderAmount + order.deliveryFee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
