"use client";

import { ShoppingCart, Plus, Minus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCart, CartItem } from "@/app/context/CartContext";

function Cart() {
  const { cart, totalItems, totalPrice, updateQuantity, getCartItemKey } =
    useCart();

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
        <div className="card-body bg-base-300/50 rounded-2xl">
          {totalItems > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart
                    size={20}
                    style={{ color: cart.restaurantAccentColor }}
                  />
                  <span>Cart</span>
                  <span className="font-normal text-base-content/70">
                    {cart.restaurantName}
                  </span>
                </h2>
                <span
                  className="badge badge-sm"
                  style={{
                    backgroundColor: cart.restaurantAccentColor,
                    color: "white",
                  }}
                >
                  {totalItems} Items
                </span>
              </div>

              <div
                className="divider my-2"
                style={{ borderColor: cart.restaurantAccentColor }}
              ></div>

              <div className="max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={getCartItemKey(item)}
                    className="flex items-start gap-2 py-0 border-b border-base-200"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
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
                        <p className="text-xs text-base-content/70">
                          {item.options
                            .map(
                              (opt) => `${opt.optionHeader}: ${opt.selected}`
                            )
                            .join(", ")}
                        </p>
                      )}

                      {/* Price and Quantity Controls */}
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="font-semibold text-sm text-base-content">
                          Rs.{calculateItemTotal(item).toFixed(2)}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          {/* Decrease Button */}
                          <button
                            className="p-1 rounded-full transition-colors"
                            style={{ color: cart.restaurantAccentColor }}
                            onClick={(e) => {
                              e.currentTarget.style.backgroundColor =
                                cart.restaurantAccentColor;
                              e.currentTarget.style.color = "#fff";
                              updateQuantity(
                                item.menuItemId,
                                item.quantity - 1,
                                item.options
                              );
                            }}
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
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>

                          {/* Quantity Display */}
                          <span className="font-medium">{item.quantity}</span>

                          {/* Increase Button */}
                          <button
                            className="p-1 rounded-full transition-colors"
                            style={{ color: cart.restaurantAccentColor }}
                            onClick={(e) => {
                              e.currentTarget.style.backgroundColor =
                                cart.restaurantAccentColor;
                              e.currentTarget.style.color = "#fff";
                              updateQuantity(
                                item.menuItemId,
                                item.quantity + 1,
                                item.options
                              );
                            }}
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

              <div
                className="divider my-2"
                style={{ borderColor: cart.restaurantAccentColor }}
              ></div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-semibold">Subtotal:</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: cart.restaurantAccentColor }}
                >
                  Rs.{totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="card-actions mt-2">
                <Link
                  href="/cart"
                  className="btn btn-block"
                  style={{
                    backgroundColor: cart.restaurantAccentColor,
                    color: "white",
                    borderColor: cart.restaurantAccentColor,
                  }}
                >
                  View cart
                </Link>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <ShoppingCart size={48} className="opacity-30 mx-auto mb-2" />
              <p className="text-base-content/70 text-lg mb-3">
                Your cart is empty
              </p>
              <Link
                href="/"
                className="btn btn-md"
                style={{
                  backgroundColor: cart.restaurantAccentColor || "#4f46e5",
                  color: "white",
                  borderColor: cart.restaurantAccentColor || "#4f46e5",
                }}
              >
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
