"use client";

import React, { useState, useEffect } from "react";
import { useCart, CartItem } from "@/app/context/CartContext";
import { toast } from "sonner";
import Link from "next/link";
import {
  Trash2Icon,
  MinusIcon,
  PlusIcon,
  ShoppingCart,
  ScanBarcode,
  MapPin,
  MapPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MapPopup from "@/app/components/MapPopup/MapPopup";

// New DeliveryLocationSection component
function DeliveryLocationSection() {
  const {
    calculateDeliveryFee,
    setDeliveryFee: setGlobalDeliveryFee,
    deliveryAddress,
    setDeliveryAddress,
  } = useCart();
  const [mode, setMode] = useState<"current" | "map">("current");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(0);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get base delivery fee from admin settings
  useEffect(() => {
    const fetchBaseDeliveryFee = async () => {
      try {
        const response = await fetch("/api/get-admin-settings");
        const settings = await response.json();
        setBaseDeliveryFee(settings.baseDeliveryFee);
      } catch (error) {
        console.error("Error fetching base delivery fee:", error);
      }
    };
    fetchBaseDeliveryFee();
  }, []);

  // Get current location if mode is 'current'
  useEffect(() => {
    if (mode === "current") {
      setLoadingFee(true);
      setLocationError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const newLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setLocation(newLocation);
            setIsLocationSelected(true);

            try {
              const fee = await calculateDeliveryFee(newLocation);
              setDeliveryFee(fee);
              setGlobalDeliveryFee(fee);
            } catch (error) {
              console.error("Error calculating delivery fee:", error);
              setLocationError("Failed to calculate delivery fee");
            } finally {
              setLoadingFee(false);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setLocation(null);
            setIsLocationSelected(false);
            setDeliveryFee(null);
            setGlobalDeliveryFee(0);
            setLocationError(
              "Failed to get your location. Please try again or select a location on the map."
            );
            setLoadingFee(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        setLocationError("Geolocation is not supported by your browser");
        setLoadingFee(false);
      }
    }
  }, [mode, calculateDeliveryFee, setGlobalDeliveryFee]);

  const handleLocationSelect = async (loc: { lat: number; lng: number }) => {
    setLoadingFee(true);
    setLocationError(null);
    setLocation(loc);
    setIsLocationSelected(true);

    try {
      const fee = await calculateDeliveryFee(loc);
      setDeliveryFee(fee);
      setGlobalDeliveryFee(fee);
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      setLocationError("Failed to calculate delivery fee");
    } finally {
      setLoadingFee(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryAddress(e.target.value);
  };

  return (
    <div className="delivery-location-section bg-base-200/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-md">Delivery Location</h2>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn btn-sm btn-ghost gap-2"
          >
            {mode === "current" ? "Current Location" : "Choose Location"}
            <svg
              className={`w-4 h-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-base-100 rounded-lg shadow-lg border border-base-300 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setMode("current");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm"
                >
                  <MapPin size={18} />
                  Use Current Location
                </button>
                <button
                  onClick={() => {
                    setMode("map");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm"
                >
                  <MapPlus size={18} />
                  Choose on Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mode === "current" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {loadingFee
              ? "Calculating delivery fee..."
              : location
                ? "Location detected"
                : "Getting your location..."}
          </div>
          {locationError && (
            <div className="text-error text-sm">{locationError}</div>
          )}
          <input
            className="input input-bordered w-full"
            placeholder="Enter your address"
            value={deliveryAddress}
            onChange={handleAddressChange}
          />
        </div>
      )}

      {mode === "map" && (
        <div className="space-y-3">
          <MapPopup setLocation={handleLocationSelect} />
          {locationError && (
            <div className="text-error text-sm">{locationError}</div>
          )}
          <input
            className="input input-bordered w-full"
            placeholder="Enter your address"
            value={deliveryAddress}
            onChange={handleAddressChange}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="font-medium">Delivery Fee:</span>
        <span className="font-semibold">
          {loadingFee ? (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Calculating...</span>
            </div>
          ) : deliveryFee !== null ? (
            `Rs. ${deliveryFee}`
          ) : (
            "Select a location"
          )}
        </span>
      </div>
    </div>
  );
}

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
    calculateDeliveryFee,
    deliveryFee,
    calculateItemTotal,
    deliveryAddress,
  } = useCart();
  const router = useRouter();

  // Check if checkout is valid
  const isCheckoutValid =
    deliveryAddress.trim().length > 0 &&
    deliveryFee !== null &&
    deliveryFee >= 0;

  const handleCheckout = () => {
    if (!isCheckoutValid) {
      toast.error("Please enter a valid delivery address");
      return;
    }

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

                        <div className="font-medium text-sm">
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

                      <div className="font-medium text-base w-24 text-right">
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

        {/* Summary Section - Now Sticky */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-[var(--navbar-height)] lg:max-h-[calc(100vh-var(--navbar-height))] lg:overflow-y-auto">
            {/* Delivery Location Section */}
            <DeliveryLocationSection />

            {/* Order Summary Section */}
            <div className="bg-base-200/30 rounded-2xl shadow-sm p-5 md:p-6">
              <h2 className="text-lg font-semibold mb-5">Order Summary</h2>

              <div className="space-y-4 py-2">
                <div className="flex justify-between">
                  <span className="text-base-content/70">Subtotal</span>
                  <span>Rs.{totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-base-content/70">Delivery Fee</span>
                  <span>
                    {deliveryFee !== null
                      ? `Rs.${deliveryFee}`
                      : "Select location"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-base-300 my-4"></div>

              <div className="flex justify-between font-bold text-lg my-4">
                <span>Total</span>
                <span style={{ color: cart.restaurantAccentColor }}>
                  Rs.{(totalPrice + (deliveryFee || 0)).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!isCheckoutValid}
                className={`btn btn-md w-full mb-3 shadow-sm ${
                  !isCheckoutValid ? "btn-disabled" : ""
                }`}
                style={{
                  backgroundColor: isCheckoutValid
                    ? cart.restaurantAccentColor
                    : "",
                  color: "white",
                  borderColor: isCheckoutValid
                    ? cart.restaurantAccentColor
                    : "",
                }}
              >
                <ScanBarcode size={20} />
                {!isCheckoutValid
                  ? "Enter Delivery Address"
                  : "Proceed to Checkout"}
              </button>

              <Link
                href="/"
                className="btn btn-md w-full mb-3"
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
              Rs.{(totalPrice + (deliveryFee || 0)).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!isCheckoutValid}
            className={`btn px-8 ${!isCheckoutValid ? "btn-disabled" : ""}`}
            style={{
              backgroundColor: isCheckoutValid
                ? cart.restaurantAccentColor
                : "",
              color: "white",
              borderColor: isCheckoutValid ? cart.restaurantAccentColor : "",
            }}
          >
            <ScanBarcode size={20} />
            {!isCheckoutValid ? "Enter Address" : "Checkout"}
          </button>
        </div>
      </div>

      {/* Add padding at the bottom to account for mobile sticky bar */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
