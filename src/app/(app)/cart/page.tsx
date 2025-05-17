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
  ShoppingCart,
  UtensilsCrossed,
  ChevronDown,
  ScanBarcode,
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-base-200/30 rounded-3xl p-8 text-center shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-base-300/50 rounded-full">
              <ShoppingCart size={64} className="text-base-content/30" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Your cart is empty
          </h2>
          <p className="text-base-content/70 mb-8 max-w-md mx-auto">
            Add some delicious items to get started!
          </p>
          <Link href="/" className="btn btn-secondary btn-lg px-8">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-base-200/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-base-300/30 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: `${cart.restaurantAccentColor}20`,
                    }}
                  >
                    <ShoppingCart
                      size={20}
                      style={{ color: cart.restaurantAccentColor }}
                    />
                  </div>
                  <div>
                    <h2 className="font-medium flex items-center gap-2">
                      <span>Your Cart</span>
                      <span className="px-2 py-0.5 bg-base-300 rounded-full text-xs font-semibold">
                        {totalItems} {totalItems === 1 ? "item" : "items"}
                      </span>
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {cart.restaurantName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    clearCart();
                    toast.success("Cart cleared");
                  }}
                  className="btn btn-soft btn-error"
                >
                  <Trash2Icon size={16} className="mr-1" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-base-300/50">
              {cart.items.map((item) => (
                <div
                  key={getCartItemKey(item)}
                  className="p-4 md:p-5 hover:bg-base-300/10 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="flex sm:hidden gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate pr-2">
                          {item.name}
                        </h3>
                        <button
                          onClick={() =>
                            removeItem(item.menuItemId, item.options)
                          }
                          className="text-error p-1 -mr-1 rounded-full hover:bg-error/10 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </div>

                      {item.options && item.options.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.options.map((option) => (
                            <div
                              key={option.optionHeader}
                              className="text-xs text-base-content/70 flex justify-between"
                            >
                              <span>{option.selected}</span>
                              {option.additionalPrice > 0 && (
                                <span className="text-xs">
                                  +Rs.{option.additionalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.menuItemId,
                                item.quantity - 1,
                                item.options
                              )
                            }
                            className="p-1 rounded-full transition-colors"
                            style={{ color: cart.restaurantAccentColor }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                cart.restaurantAccentColor;
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                cart.restaurantAccentColor;
                            }}
                          >
                            <MinusIcon size={16} />
                          </button>
                          <span className="font-medium w-6 sm:w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.menuItemId,
                                item.quantity + 1,
                                item.options
                              )
                            }
                            className="p-1 rounded-full transition-colors"
                            style={{ color: cart.restaurantAccentColor }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                cart.restaurantAccentColor;
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                cart.restaurantAccentColor;
                            }}
                          >
                            <PlusIcon size={16} />
                          </button>
                        </div>

                        <div
                          className="font-medium text-sm"
                          style={{ color: cart.restaurantAccentColor }}
                        >
                          Rs.{calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1">
                        {item.name}
                      </h3>

                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {item.options.map((option) => (
                            <div
                              key={option.optionHeader}
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

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.menuItemId,
                              item.quantity - 1,
                              item.options
                            )
                          }
                          className="p-1 rounded-full transition-colors"
                          style={{ color: cart.restaurantAccentColor }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              cart.restaurantAccentColor;
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color =
                              cart.restaurantAccentColor;
                          }}
                        >
                          <MinusIcon size={16} />
                        </button>
                        <span className="font-medium w-6 sm:w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.menuItemId,
                              item.quantity + 1,
                              item.options
                            )
                          }
                          className="p-1 rounded-full transition-colors"
                          style={{ color: cart.restaurantAccentColor }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              cart.restaurantAccentColor;
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color =
                              cart.restaurantAccentColor;
                          }}
                        >
                          <PlusIcon size={16} />
                        </button>
                      </div>

                      <div
                        className="font-medium text-base w-24 text-right"
                        style={{ color: cart.restaurantAccentColor }}
                      >
                        Rs.{calculateItemTotal(item).toFixed(2)}
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.menuItemId, item.options)
                        }
                        className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-base-200/30 rounded-2xl shadow-sm p-5 md:p-6 sticky top-20">
            <h2 className="text-lg font-semibold mb-5">Order Summary</h2>

            <div className="space-y-4 py-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Subtotal</span>
                <span>Rs.{totalPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-base-content/70">Delivery Fee</span>
                <span>Rs.150.00</span>
              </div>

              <div className="flex justify-between">
                <span className="text-base-content/70">Tax (5%)</span>
                <span>Rs.{(totalPrice * 0.05).toFixed(2)}</span>
              </div>
            </div>

            <div className="h-px bg-base-300 my-4"></div>

            <div className="flex justify-between font-bold text-lg my-4">
              <span>Total</span>
              <span style={{ color: cart.restaurantAccentColor }}>
                Rs.{(totalPrice + 150 + totalPrice * 0.05).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="btn btn-lg w-full mb-3 shadow-sm"
              style={{
                backgroundColor: cart.restaurantAccentColor,
                color: "white",
                borderColor: cart.restaurantAccentColor,
              }}
            >
              Proceed to Checkout
            </button>

            <Link
              href="/"
              className="btn btn-lg w-full mb-3"
              style={{
                borderColor: cart.restaurantAccentColor,
                color: cart.restaurantAccentColor,
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 shadow-lg border-t border-base-300 p-4 z-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-base-content/70 text-sm">Total</span>
            <div
              className="font-bold"
              style={{ color: cart.restaurantAccentColor }}
            >
              Rs.{(totalPrice + 150 + totalPrice * 0.05).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="btn px-8"
            style={{
              backgroundColor: cart.restaurantAccentColor,
              color: "white",
              borderColor: cart.restaurantAccentColor,
            }}
          >
            <ScanBarcode size={20} />
            Checkout
          </button>
        </div>
      </div>

      {/* Add padding at the bottom to account for mobile sticky bar */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
