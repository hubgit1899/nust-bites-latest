"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Package, MapPin, Clock, ArrowRight } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-base-200/30 rounded-2xl p-8 shadow-sm text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-success/10 rounded-full">
            <CheckCircle2 size={64} className="text-success" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">Order Placed Successfully!</h1>
        <p className="text-base-content/70 mb-6">
          Thank you for your order. We'll notify you when your order is
          confirmed.
        </p>
        <div className="flex items-center justify-center gap-2 text-success">
          <Clock size={20} />
          <span>Estimated delivery time: 30-45 minutes</span>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Details */}
        <div className="bg-base-200/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
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
                <h2 className="font-semibold text-lg">
                  {orderDetails.orderId}
                </h2>
                <p className="text-base-content/70">
                  {orderDetails.restaurant.name}
                </p>
              </div>
            </div>
            <div className="text-base-content/70">
              {new Date(orderDetails.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-4">
            {/* Order Items */}
            <div className="bg-base-300/30 rounded-xl p-4">
              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div
                    key={`${orderDetails.orderId}-item-${index}`}
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
                              key={`${orderDetails.orderId}-item-${index}-option-${optIndex}`}
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
            <div className="bg-base-300/30 rounded-xl p-4">
              <h3 className="font-medium mb-3">Delivery Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-base-300/50">
                    <MapPin size={20} className="text-base-content/70" />
                  </div>
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-base-content/70">
                      {orderDetails.dropoffLocation.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-base-300/30 rounded-xl p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-base-content/70">
                  <span>Subtotal</span>
                  <span>Rs.{orderDetails.orderAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Delivery Fee</span>
                  <span>Rs.{orderDetails.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-base-300 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span style={{ color: orderDetails.restaurant.accentColor }}>
                    Rs.
                    {(
                      orderDetails.orderAmount + orderDetails.deliveryFee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/profile/my-orders"
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
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
            className="btn btn-outline flex-1"
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
  );
}
