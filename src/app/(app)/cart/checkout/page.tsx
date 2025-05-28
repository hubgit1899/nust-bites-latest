"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Copy,
  Check,
  Navigation,
  MessageSquare,
  CheckCircle2,
  TriangleAlert,
  ImageUp,
  ScanBarcode,
  PackageCheck,
} from "lucide-react";
import axios from "axios";
import PageLoading from "@/app/components/loading/PageLoading";

export default function CheckoutPage() {
  const {
    cart,
    deliveryAddress,
    deliveryFee,
    userLocation,
    clearCart,
    removeItem,
  } = useCart();
  const router = useRouter();
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [isValidImage, setIsValidImage] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRedirecting && (!cart.items || cart.items.length === 0)) {
      toast.error("Your cart is empty");
      router.push("/cart");
    } else {
      setIsChecking(false);
    }
  }, [cart.items, router, isRedirecting]);

  useEffect(() => {
    const calculateDistance = async () => {
      if (userLocation && cart.restaurantLocation) {
        try {
          const result = await fetch("/api/get-delivery-fee-details", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              deliveryLocation: userLocation,
              restaurantLocation: cart.restaurantLocation,
            }),
          });
          const data = await result.json();
          if (data.success) {
            setDistance(data.distance);
          }
        } catch (error) {
          console.error("Error calculating distance:", error);
        }
      }
    };

    calculateDistance();
  }, [userLocation, cart.restaurantLocation]);

  const scrollToUploadSection = () => {
    uploadSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => {
      fileInputRef.current?.focus();
      fileInputRef.current?.click();
    }, 500);
  };

  const handleButtonClick = () => {
    if (!isValidImage) {
      scrollToUploadSection();
    } else {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentSlip) {
      toast.error("Please upload a payment slip");
      scrollToUploadSection();
      return;
    }

    setIsPlacingOrder(true);
    try {
      // 1. Get signed Cloudinary upload credentials
      const signatureRes = await axios.post("/api/sign-cloudinary-upload", {
        uploadPreset: "payment-slips",
      });

      if (signatureRes.status !== 200) {
        toast.error("Failed to authorize upload");
        setIsPlacingOrder(false);
        return;
      }

      const { signature, timestamp, uploadPreset, cloudName, apiKey } =
        signatureRes.data;

      // 2. Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", paymentSlip);
      formData.append("upload_preset", uploadPreset);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      // 3. Create order with payment slip URL
      const orderResponse = await axios.post("/api/checkout/place-order", {
        restaurantId: cart.restaurantId,
        items: cart.items,
        deliveryLocation: {
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          address: deliveryAddress,
        },
        specialInstructions: cart.specialInstructions,
        paymentSlipURL: cloudRes.data.secure_url,
      });

      if (orderResponse.data.success) {
        toast.success("Order placed successfully!");
        setIsRedirecting(true);

        // Store order ID in session storage
        sessionStorage.setItem("lastOrderId", orderResponse.data.orderId);

        // Clear cart first
        clearCart();

        // Then redirect to order confirmation
        router.push(
          `/cart/checkout/order-placed?orderId=${orderResponse.data.orderId}`
        );
      } else {
        // Handle removed items
        if (orderResponse.data.removedItems?.length > 0) {
          orderResponse.data.removedItems.forEach((item: any) => {
            removeItem(item.menuItemId, item.options);
          });

          const errorMessages = orderResponse.data.removedItems.map(
            (item: any) => `${item.name}: ${item.reason}`
          );

          toast.error(
            `Some items were removed from your cart:\n${errorMessages.join("\n")}`
          );
          router.push("/cart");
        } else {
          toast.error(orderResponse.data.message || "Failed to place order");
        }
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > 2.5 * 1024 * 1024) {
        toast.error("File size should not exceed 2.5 MB");
        setPaymentSlip(null);
        setIsValidImage(false);
        setFileError("File size should not exceed 2.5 MB");
        return;
      }

      // Check file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPG, JPEG, or PNG)");
        setPaymentSlip(null);
        setIsValidImage(false);
        setFileError("Please upload a valid image file (JPG, JPEG, or PNG)");
        return;
      }

      setPaymentSlip(file);
      setIsValidImage(true);
      setFileError(null);
    }
  };

  const copyToClipboard = (text: string, accountType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(accountType);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-base-200/50 rounded-2xl shadow-sm overflow-hidden">
            {/* Order Summary Header */}
            <div className="p-4 md:p-6 bg-base-300/50 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: `${cart.restaurantAccentColor}20`,
                    }}
                  >
                    <ScanBarcode
                      size={20}
                      style={{ color: cart.restaurantAccentColor }}
                    />
                  </div>
                  <div>
                    <h2 className="font-medium flex items-center gap-2">
                      <span>Checkout</span>
                      <span className="px-2 py-0.5 bg-base-300 rounded-full text-xs font-semibold">
                        {cart.items.length}{" "}
                        {cart.items.length === 1 ? "item" : "items"}
                      </span>
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {cart.restaurantName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-base-300/50">
              {cart.items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="p-2 lg:p-4 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="flex bg-base-300/50 rounded-xl sm:hidden gap-3 px-2 py-2">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm truncate pr-2">
                            {item.name}
                          </h3>
                          <p className="text-sm text-base-content/70">
                            Quantity: {item.quantity}
                          </p>
                          {item.options && item.options.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.options.map((option) => (
                                <p
                                  key={option.optionHeader}
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
                      <p className="text-sm text-base-content/70">
                        Quantity: {item.quantity}
                      </p>
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

                    <div className="font-medium text-base w-24 text-right">
                      Rs.{(item.basePrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details Card */}
          <div className="bg-base-300/50 rounded-2xl p-4 md:p-6 shadow-sm mt-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-base-300">
                  <MapPin size={20} className="text-base-content/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Delivery Address</h3>
                  <p className="text-base-content/70">{deliveryAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-base-300">
                  <Navigation size={20} className="text-base-content/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Distance</h3>
                  <p className="text-base-content/70">
                    {distance
                      ? `${distance.toFixed(1)} km from restaurant`
                      : "Calculating distance..."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-base-300">
                  <Clock size={20} className="text-base-content/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Estimated Delivery Time</h3>
                  <p className="text-base-content/70">30-45 minutes</p>
                </div>
              </div>

              {cart.specialInstructions && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-base-300">
                    <MessageSquare size={20} className="text-base-content/70" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Special Instructions</h3>
                    <p className="text-base-content/70">
                      {cart.specialInstructions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Instructions Card */}
          <div className="bg-base-300/50 rounded-2xl p-4 md:p-6 shadow-sm mt-6">
            <h2 className="text-lg font-semibold mb-4">Payment Instructions</h2>
            <div className="space-y-6">
              <p className="text-base-content/70">
                Please transfer the total amount of Rs.
                {(
                  cart.items.reduce(
                    (sum, item) => sum + item.basePrice * item.quantity,
                    0
                  ) + (deliveryFee || 0)
                ).toFixed(2)}{" "}
                to one of the following accounts:
              </p>

              <div className="space-y-4">
                {/* Payment Methods */}
                <div className="bg-base-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={20} className="text-base-content/70" />
                    <h3 className="font-medium">SadaPay</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Number:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">03020738766</span>
                        <button
                          onClick={() =>
                            copyToClipboard("03020738766", "sadapay")
                          }
                          className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                        >
                          {copiedAccount === "sadapay" ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} className="text-base-content/70" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Name:
                      </span>
                      <span className="font-medium">Junaid Alam</span>
                    </div>
                  </div>
                </div>

                {/* NayaPay */}
                <div className="bg-base-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={20} className="text-base-content/70" />
                    <h3 className="font-medium">NayaPay</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Number:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">03020738766</span>
                        <button
                          onClick={() =>
                            copyToClipboard("03020738766", "nayapay")
                          }
                          className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                        >
                          {copiedAccount === "nayapay" ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} className="text-base-content/70" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Name:
                      </span>
                      <span className="font-medium">Junaid Alam</span>
                    </div>
                  </div>
                </div>

                {/* Meezan Bank */}
                <div className="bg-base-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote size={20} className="text-base-content/70" />
                    <h3 className="font-medium">Meezan Bank</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Number:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">05160105311832</span>
                        <button
                          onClick={() =>
                            copyToClipboard("05160105311832", "meezan")
                          }
                          className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                        >
                          {copiedAccount === "meezan" ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} className="text-base-content/70" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">
                        Account Name:
                      </span>
                      <span className="font-medium">
                        JUNAID ALAM (ASAAN AC)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-error bg-error/10 rounded-xl p-4">
                <p className="text-sm font-medium  rounded-md">
                  <span className="font-bold">Note:&nbsp;</span> Only payments
                  sent to the specified bank accounts will be accepted. Payments
                  sent to any other account, such as JazzCash or EasyPaisa, will
                  not be received and cannot be refunded.
                </p>
              </div>

              <div ref={uploadSectionRef} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium mb-2 block">
                    Upload Payment Slip
                  </span>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="file-input file-input-bordered w-full"
                    />
                    <span className="text-xs text-base-content/70">
                      Max size: 2.5 MB
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-base-300 rounded-lg mt-4 p-6 flex flex-col items-center justify-center bg-base-100">
                    {paymentSlip ? (
                      <>
                        <div className="lg:m-2 flex flex-col items-center">
                          <div className="">
                            <div className="w-xs scale-95 lg:scale-100 rounded-lg shadow-md">
                              <img
                                src={URL.createObjectURL(paymentSlip)}
                                alt="Payment Slip"
                              />
                            </div>
                          </div>
                          <p className="text-sm lg:mt-2 -mb-4 italic">
                            <span className="font-semibold">Size:&nbsp;</span>
                            {(paymentSlip.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl text-base-300 mb-2">
                          <ImageUp size={48} />
                        </div>
                        <p className="text-center text-base-content/70">
                          Select a payment slip to preview
                        </p>
                      </>
                    )}
                  </div>

                  {fileError && (
                    <div className="mt-2 text-error text-sm bg-error/10 p-2 rounded-md flex items-center gap-2">
                      <span>
                        <TriangleAlert size={20} />
                      </span>
                      <span>{fileError}</span>
                    </div>
                  )}
                  {isValidImage && paymentSlip && (
                    <div className="mt-2 text-success text-sm bg-success/10 p-2 rounded-md flex items-center gap-2">
                      <span>
                        <CheckCircle2 size={20} />
                      </span>
                      <span>
                        <span className="font-semibold">Selected:&nbsp;</span>
                        {paymentSlip.name}
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <div className="bg-base-300/50 rounded-2xl p-4 md:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Order Total</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-base-content/70">
                  <span>Subtotal</span>
                  <span>
                    Rs.
                    {cart.items
                      .reduce(
                        (sum, item) => sum + item.basePrice * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Delivery Fee</span>
                  <span>Rs.{deliveryFee?.toFixed(2)}</span>
                </div>
                <div className="h-px bg-base-300 my-3"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    Rs.
                    {(
                      cart.items.reduce(
                        (sum, item) => sum + item.basePrice * item.quantity,
                        0
                      ) + (deliveryFee || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleButtonClick}
                className={`btn btn-md w-full mt-6 shadow-sm`}
                style={{
                  backgroundColor: isValidImage
                    ? cart.restaurantAccentColor
                    : "var(--fallback-bc,oklch(var(--bc)))",
                  color: isValidImage
                    ? "white"
                    : "var(--fallback-bc,oklch(var(--bc)))",
                  borderColor: isValidImage
                    ? cart.restaurantAccentColor
                    : "var(--fallback-bc,oklch(var(--bc)))",
                }}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Placing Order...
                  </>
                ) : isValidImage ? (
                  <>
                    <PackageCheck size={20} />
                    Place Order
                  </>
                ) : (
                  <>
                    <ImageUp size={20} />
                    Upload Slip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 shadow-lg border-t border-base-300 p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base-content/70 text-sm">Total</span>
            <div className="font-bold">
              Rs.
              {(
                cart.items.reduce(
                  (sum, item) => sum + item.basePrice * item.quantity,
                  0
                ) + (deliveryFee || 0)
              ).toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleButtonClick}
            className={`btn px-8 gap-2`}
            style={{
              backgroundColor: isValidImage
                ? cart.restaurantAccentColor
                : "var(--fallback-bc,oklch(var(--bc)))",
              color: isValidImage
                ? "white"
                : "var(--fallback-bc,oklch(var(--bc)))",
              borderColor: isValidImage
                ? cart.restaurantAccentColor
                : "var(--fallback-bc,oklch(var(--bc)))",
            }}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Placing...
              </>
            ) : isValidImage ? (
              <>
                <PackageCheck size={20} />
                Place Order
              </>
            ) : (
              <>
                <ImageUp size={20} />
                Upload Slip
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add padding at the bottom to account for mobile sticky bar */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
