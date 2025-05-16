"use client";

import { ShoppingCart, Plus, Minus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCart, CartItem } from "@/app/context/CartContext";

function Cart() {
  const {
    cart,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    getCartItemKey,
    currentRestaurantId,
  } = useCart();

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

  return (
    <div>
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <ShoppingCart size={28} strokeWidth={2.25} />
          {totalItems > 0 && (
            <span className="badge badge-sm indicator-item z-0">
              {totalItems}
            </span>
          )}
        </div>
      </div>
      <div
        tabIndex={0}
        className="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-80 shadow"
      >
        <div className="card-body">
          {totalItems > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{totalItems} Items</span>
                {currentRestaurantId && (
                  <span className="text-sm text-base-content/70">
                    Restaurant ID: {currentRestaurantId}
                  </span>
                )}
              </div>
              <span className="text-info">
                Subtotal: Rs.{totalPrice.toFixed(2)}
              </span>

              <div className="max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={getCartItemKey(item)}
                    className="flex items-start gap-2 py-2 border-b"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-md overflow-hidden">
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 flex flex-col">
                      <p className="text-sm font-medium">{item.name}</p>

                      {/* Display selected options if any */}
                      {item.options && item.options.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {item.options
                            .map(
                              (opt) => `${opt.optionHeader}: ${opt.selected}`
                            )
                            .join(", ")}
                        </p>
                      )}

                      {/* Price and Quantity Controls */}
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-sm text-base-content">
                          Rs.{calculateItemTotal(item).toFixed(2)}
                        </span>

                        {/* Quantity Controls - Simplified with Lucide icons */}
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded-full hover:bg-gray-100"
                            onClick={() =>
                              updateQuantity(
                                item.menuItemId,
                                item.quantity - 1,
                                item.options
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium">{item.quantity}</span>
                          <button
                            className="p-1 rounded-full hover:bg-gray-100"
                            onClick={() =>
                              updateQuantity(
                                item.menuItemId,
                                item.quantity + 1,
                                item.options
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-actions mt-2">
                <Link href="/cart" className="btn btn-primary btn-block">
                  View cart
                </Link>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-500">Your cart is empty</p>
              <Link href="/" className="btn btn-primary btn-sm mt-2">
                Browse menu
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;
