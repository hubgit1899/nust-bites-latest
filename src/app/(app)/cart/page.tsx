"use client";

import React from "react";
import { useCart, CartItem } from "@/app/context/CartContext";
import { toast } from "sonner";
import Link from "next/link";
import {
  Trash2Icon,
  MinusIcon,
  PlusIcon,
  ArrowLeft,
  ShoppingBagIcon,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const {
    cart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
    clearCart,
    getCartItemKey,
    currentRestaurantId,
  } = useCart();
  const router = useRouter();

  // Calculate total price for an item including options
  const calculateItemTotal = (item: CartItem): number => {
    let itemPrice = item.basePrice;

    // Add options prices
    if (item.options && item.options.length > 0) {
      itemPrice += item.options.reduce(
        (sum: number, option) => sum + option.additionalPrice,
        0
      );
    }

    return itemPrice * item.quantity;
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Here you would redirect to checkout page
    // router.push("/checkout");
    toast.success("Checkout functionality will be implemented soon!");
  };

  if (cart.items.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="flex justify-center mb-4">
          <ShoppingBagIcon size={64} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">
          Add some delicious items to get started!
        </p>
        <Link href="/" className="btn btn-primary">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-center flex-1">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-base-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Items ({totalItems})</h2>
                {currentRestaurantId && (
                  <div className="flex items-center gap-2 mt-1">
                    <UtensilsCrossed size={16} />
                    <span className="text-sm text-base-content/70">
                      Restaurant ID: {currentRestaurantId}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared");
                }}
                className="btn btn-ghost btn-sm text-error flex items-center gap-1"
              >
                <Trash2Icon size={16} />
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={getCartItemKey(item)}
                  className="border border-base-300 rounded-lg p-4 flex flex-col sm:flex-row gap-4"
                >
                  <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.imageURL}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <button
                        onClick={() =>
                          removeItem(item.menuItemId, item.options)
                        }
                        className="btn btn-ghost btn-xs text-error"
                        aria-label="Remove item"
                      >
                        <Trash2Icon size={16} />
                      </button>
                    </div>

                    {item.options && item.options.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {item.options.map((option) => (
                          <div
                            key={option.optionHeader}
                            className="text-sm text-gray-500"
                          >
                            <span className="font-medium">
                              {option.optionHeader}:
                            </span>{" "}
                            {option.selected}
                            {option.additionalPrice > 0 && (
                              <span>
                                {" "}
                                (+Rs.{option.additionalPrice.toFixed(2)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.menuItemId,
                              item.quantity - 1,
                              item.options
                            )
                          }
                          className="btn btn-sm btn-ghost"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.menuItemId,
                              item.quantity + 1,
                              item.options
                            )
                          }
                          className="btn btn-sm btn-ghost"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>

                      <div className="font-semibold">
                        Rs.{calculateItemTotal(item).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-base-200 rounded-xl p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 border-b border-base-300 pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>Rs.{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span>Rs.150.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>Rs.{(totalPrice * 0.05).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Total</span>
              <span>
                Rs.{(totalPrice + 150 + totalPrice * 0.05).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="btn btn-primary w-full mb-2"
            >
              Proceed to Checkout
            </button>

            <Link href="/" className="btn btn-outline w-full">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
