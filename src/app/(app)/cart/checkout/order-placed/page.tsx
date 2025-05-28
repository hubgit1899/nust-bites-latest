"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, MapPin, Clock, ArrowRight, PackageCheck } from "lucide-react";
import Link from "next/link";

interface OrderDetails {
  orderId: string;
  restaurant: {
    name: string;
    accentColor: string;
  };
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
  orderAmount: number;
  deliveryFee: number;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      router.push("/profile/my-orders");
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        if (data.success) {
          setOrderDetails(data.order);
        } else {
          toast.error("Failed to fetch order details");
          router.push("/profile/my-orders");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Something went wrong");
        router.push("/profile/my-orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Success Message Card */}
          <div className="bg-base-200/50 rounded-2xl p-4 md:p-6 shadow-sm text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 md:p-6 bg-success/10 rounded-full">
                <PackageCheck size={48} className="text-success" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-sm md:text-base text-base-content/70 mb-4">
              Thank you for your order. We'll notify you when your order is
              <span className="font-bold">confirmed</span>.
            </p>
            <div className="flex items-center justify-center gap-2 text-success text-sm md:text-base">
              <Clock size={18} />
              <span>Estimated delivery time: 30-45 minutes</span>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-base-200/50 rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* Order Header */}
            <div className="p-4 md:p-6 bg-base-300/50 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: `${orderDetails.restaurant.accentColor}20`,
                    }}
                  >
                    <Package
                      size={20}
                      style={{ color: orderDetails.restaurant.accentColor }}
                    />
                  </div>
                  <div>
                    <h2 className="font-medium flex items-center gap-2">
                      <span>Order #{orderDetails.orderId}</span>
                      <span className="px-2 py-0.5 bg-base-300 rounded-full text-xs font-semibold">
                        {orderDetails.items.length}{" "}
                        {orderDetails.items.length === 1 ? "item" : "items"}
                      </span>
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {orderDetails.restaurant.name}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-base-content/70">
                  {new Date(orderDetails.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="divide-y divide-base-300/50">
              {orderDetails.items.map((item, index) => (
                <div
                  key={`${orderDetails.orderId}-item-${index}`}
                  className="p-2 lg:p-4 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="flex bg-base-300/50 rounded-xl sm:hidden gap-3 px-2 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm truncate pr-2">
                            {item.quantity}x {item.name}
                          </h3>
                          {item.options && item.options.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.options.map((option, optIndex) => (
                                <p
                                  key={`${orderDetails.orderId}-item-${index}-option-${optIndex}`}
                                  className="text-xs text-base-content/70"
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
                        <p className="font-medium text-sm">
                          Rs.{(item.basePrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:flex items-center gap-4 bg-base-300/50 rounded-xl px-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1">
                        {item.quantity}x {item.name}
                      </h3>
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {item.options.map((option, optIndex) => (
                            <div
                              key={`${orderDetails.orderId}-item-${index}-option-${optIndex}`}
                              className="text-sm text-base-content/70"
                            >
                              <span className="font-medium">
                                {option.optionHeader}:
                              </span>{" "}
                              {option.selected}
                              {option.additionalPrice > 0 && (
                                <span className="text-xs ml-1">
                                  (+Rs.{option.additionalPrice.toFixed(2)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-base w-24 text-right">
                      Rs.{(item.basePrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details Card */}
          <div className="bg-base-300/50 rounded-2xl p-4 md:p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-base-300">
                  <MapPin size={20} className="text-base-content/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Delivery Address</h3>
                  <p className="text-sm md:text-base text-base-content/70">
                    {orderDetails.dropoffLocation.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            {/* Order Summary Card */}
            <div className="bg-base-300/50 rounded-2xl p-4 md:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-base-content/70">
                  <span>Subtotal</span>
                  <span>Rs.{orderDetails.orderAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Delivery Fee</span>
                  <span>Rs.{orderDetails.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-base-300 my-3"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span style={{ color: orderDetails.restaurant.accentColor }}>
                    Rs.
                    {(
                      orderDetails.orderAmount + orderDetails.deliveryFee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mt-6">
                <Link
                  href="/profile/my-orders"
                  className="btn btn-primary flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: orderDetails.restaurant.accentColor,
                    borderColor: orderDetails.restaurant.accentColor,
                  }}
                >
                  <span>View Order Status</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/"
                  className="btn btn-outline"
                  style={{
                    borderColor: orderDetails.restaurant.accentColor,
                    color: orderDetails.restaurant.accentColor,
                  }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 shadow-lg border-t border-base-300 p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base-content/70 text-sm">Total</span>
            <div className="font-bold">
              Rs.
              {(orderDetails.orderAmount + orderDetails.deliveryFee).toFixed(2)}
            </div>
          </div>
          <Link
            href="/profile/my-orders"
            className="btn px-8 gap-2"
            style={{
              backgroundColor: orderDetails.restaurant.accentColor,
              borderColor: orderDetails.restaurant.accentColor,
              color: "white",
            }}
          >
            <span>View Order</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Add padding at the bottom to account for mobile sticky bar */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
