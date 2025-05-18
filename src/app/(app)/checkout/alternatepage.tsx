//this design will be used in future
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Clock,
  AlertCircle,
  Upload,
  CreditCard,
  Banknote,
  Copy,
  Check,
  Navigation,
  MessageSquare,
  CheckCircle2,
  Camera,
  TriangleAlert,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, deliveryAddress, deliveryFee, userLocation } = useCart();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [isValidImage, setIsValidImage] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const orderSummaryRef = useRef<HTMLDivElement>(null);
  const deliveryDetailsRef = useRef<HTMLDivElement>(null);
  const specialInstructionsRef = useRef<HTMLDivElement>(null);
  const paymentInstructionsRef = useRef<HTMLDivElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

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

  // Intersection Observer to track section visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.id;
            switch (section) {
              case "order-summary":
                setActiveStep(1);
                break;
              case "delivery-details":
                setActiveStep(2);
                break;
              case "special-instructions":
                setActiveStep(3);
                break;
              case "payment-instructions":
                setActiveStep(4);
                break;
              case "upload-section":
                setActiveStep(5);
                break;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = [
      orderSummaryRef.current,
      deliveryDetailsRef.current,
      specialInstructionsRef.current,
      paymentInstructionsRef.current,
      uploadSectionRef.current,
    ].filter(Boolean);

    sections.forEach((section) => observer.observe(section!));

    return () => observer.disconnect();
  }, []);

  const scrollToUploadSection = () => {
    uploadSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleButtonClick = () => {
    if (!isValidImage) {
      toast.error("Please upload a valid payment slip");
      scrollToUploadSection();
    } else {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = () => {
    // This will be implemented later
    toast.info("Order confirmation coming soon!");
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
      toast.success("Payment slip uploaded successfully!");
    }
  };

  const copyToClipboard = (text: string, accountType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(accountType);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Section data for easier mapping
  const sections = [
    {
      ref: orderSummaryRef,
      icon: ShoppingBag,
      label: "Review Order",
      id: "order-summary",
      show: true,
    },
    {
      ref: deliveryDetailsRef,
      icon: MapPin,
      label: "Delivery Details",
      id: "delivery-details",
      show: true,
    },
    {
      ref: specialInstructionsRef,
      icon: MessageSquare,
      label: "Special Instructions",
      id: "special-instructions",
      show: !!cart.specialInstructions,
    },
    {
      ref: paymentInstructionsRef,
      icon: CreditCard,
      label: "Payment Instructions",
      id: "payment-instructions",
      show: true,
    },
    {
      ref: uploadSectionRef,
      icon: Upload,
      label: "Upload Slip",
      id: "upload-section",
      show: true,
    },
  ].filter((s) => s.show);

  // Accent color for inline styles
  const accent = cart.restaurantAccentColor || "#00b894";

  return (
    <div className="flex flex-col flex-grow min-h-[calc(100vh-var(--navbar-height)-var(--footer-height,4rem))]">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-0 relative">
              {/* Sections Content with Bar/Icons next to headers */}
              {sections.map((section, idx) => {
                const Icon = section.icon;
                const isActive = activeStep >= idx + 1;
                return (
                  <div
                    key={section.id}
                    className="flex flex-row items-start min-h-[120px]"
                  >
                    {/* Bar + Icon next to header */}
                    <div
                      className="flex flex-col items-center mr-2 relative"
                      style={{ minWidth: 32 }}
                    >
                      {/* Bar above icon (only for not first) */}
                      {idx !== 0 && (
                        <div
                          className="w-1"
                          style={{
                            height: 24,
                            background:
                              activeStep > idx
                                ? accent
                                : "var(--fallback-bc,oklch(var(--bc)))",
                            borderRadius: 4,
                            transition: "background 0.3s",
                          }}
                        />
                      )}
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300`}
                        style={{
                          background: isActive
                            ? accent
                            : "var(--fallback-bc,oklch(var(--bc)))",
                          color: isActive
                            ? "#fff"
                            : "var(--fallback-bc,oklch(var(--bc)))",
                          border: isActive
                            ? `2px solid ${accent}`
                            : "2px solid var(--fallback-bc,oklch(var(--bc)))",
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      {/* Bar below icon (only for not last) */}
                      {idx !== sections.length - 1 && (
                        <div
                          className="w-1"
                          style={{
                            height: 24,
                            background:
                              activeStep > idx + 1
                                ? accent
                                : "var(--fallback-bc,oklch(var(--bc)))",
                            borderRadius: 4,
                            transition: "background 0.3s",
                          }}
                        />
                      )}
                    </div>
                    {/* Section Content */}
                    <div className="flex-1 flex flex-col justify-center py-2">
                      {/* Section Title (accent color) */}
                      <h2
                        className="text-lg font-semibold mb-2 flex items-center gap-2"
                        style={{ color: accent }}
                      >
                        {section.label}
                      </h2>
                      {/* Section Details */}
                      {section.id === "order-summary" && (
                        <div
                          id="order-summary"
                          ref={orderSummaryRef}
                          className="bg-base-200/30 rounded-2xl p-6 shadow-sm"
                        >
                          <div className="space-y-4">
                            {cart.items.map((item) => (
                              <div
                                key={item.menuItemId}
                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-base-300/20 transition-colors"
                              >
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.imageURL}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">
                                        {item.name}
                                      </h3>
                                      <p className="text-sm text-base-content/70">
                                        Quantity: {item.quantity}
                                      </p>
                                      {item.options &&
                                        item.options.length > 0 && (
                                          <div className="mt-1 space-y-0.5">
                                            {item.options.map((option) => (
                                              <p
                                                key={option.optionHeader}
                                                className="text-sm text-base-content/70"
                                              >
                                                {option.optionHeader}:{" "}
                                                {option.selected}
                                                {option.additionalPrice > 0 && (
                                                  <span className="ml-1">
                                                    (+Rs.
                                                    {option.additionalPrice.toFixed(
                                                      2
                                                    )}
                                                    )
                                                  </span>
                                                )}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                    <p className="font-medium">
                                      Rs.
                                      {(item.basePrice * item.quantity).toFixed(
                                        2
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {section.id === "delivery-details" && (
                        <div
                          id="delivery-details"
                          ref={deliveryDetailsRef}
                          className="bg-base-200/30 rounded-2xl p-6 shadow-sm"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-base-300/50">
                                <MapPin
                                  size={20}
                                  className="text-base-content/70"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">
                                  Delivery Address
                                </h3>
                                <p className="text-base-content/70">
                                  {deliveryAddress}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-base-300/50">
                                <Navigation
                                  size={20}
                                  className="text-base-content/70"
                                />
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
                              <div className="p-2 rounded-full bg-base-300/50">
                                <Clock
                                  size={20}
                                  className="text-base-content/70"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">
                                  Estimated Delivery Time
                                </h3>
                                <p className="text-base-content/70">
                                  30-45 minutes
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {section.id === "special-instructions" && (
                        <div
                          id="special-instructions"
                          ref={specialInstructionsRef}
                          className="bg-base-200/30 rounded-2xl p-6 shadow-sm"
                        >
                          <div className="bg-base-300/30 rounded-xl p-4">
                            <p className="text-base-content/70">
                              {cart.specialInstructions}
                            </p>
                          </div>
                        </div>
                      )}
                      {section.id === "payment-instructions" && (
                        <div
                          id="payment-instructions"
                          ref={paymentInstructionsRef}
                          className="bg-base-200/30 rounded-2xl p-6 shadow-sm"
                        >
                          <div className="space-y-6">
                            <p className="text-base-content/70">
                              Please transfer the total amount of Rs.
                              {(
                                cart.items.reduce(
                                  (sum, item) =>
                                    sum + item.basePrice * item.quantity,
                                  0
                                ) + (deliveryFee || 0)
                              ).toFixed(2)}{" "}
                              to one of the following accounts:
                            </p>
                            <div className="space-y-4">
                              {/* SadaPay */}
                              <div className="bg-base-300/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CreditCard
                                    size={20}
                                    className="text-base-content/70"
                                  />
                                  <h3 className="font-medium">SadaPay</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">
                                      Account Number:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        03020738766
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            "03020738766",
                                            "sadapay"
                                          )
                                        }
                                        className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                                      >
                                        {copiedAccount === "sadapay" ? (
                                          <Check
                                            size={16}
                                            className="text-success"
                                          />
                                        ) : (
                                          <Copy
                                            size={16}
                                            className="text-base-content/70"
                                          />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">
                                      Account Name:
                                    </span>
                                    <span className="font-medium">
                                      Junaid Alam
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* NayaPay */}
                              <div className="bg-base-300/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CreditCard
                                    size={20}
                                    className="text-base-content/70"
                                  />
                                  <h3 className="font-medium">NayaPay</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">
                                      Account Number:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        03020738766
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            "03020738766",
                                            "nayapay"
                                          )
                                        }
                                        className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                                      >
                                        {copiedAccount === "nayapay" ? (
                                          <Check
                                            size={16}
                                            className="text-success"
                                          />
                                        ) : (
                                          <Copy
                                            size={16}
                                            className="text-base-content/70"
                                          />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">
                                      Account Name:
                                    </span>
                                    <span className="font-medium">
                                      Junaid Alam
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Meezan Bank */}
                              <div className="bg-base-300/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Banknote
                                    size={20}
                                    className="text-base-content/70"
                                  />
                                  <h3 className="font-medium">Meezan Bank</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">
                                      Account Number:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        05160105311832
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            "05160105311832",
                                            "meezan"
                                          )
                                        }
                                        className="p-1 hover:bg-base-300 rounded-lg transition-colors"
                                      >
                                        {copiedAccount === "meezan" ? (
                                          <Check
                                            size={16}
                                            className="text-success"
                                          />
                                        ) : (
                                          <Copy
                                            size={16}
                                            className="text-base-content/70"
                                          />
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

                            <div className="bg-base-300/30 rounded-xl p-4">
                              <p className="text-sm text-base-content/70">
                                <span className="font-medium text-error">
                                  *
                                </span>{" "}
                                Only payments sent to the specified bank
                                accounts will be accepted. Payments sent to any
                                other account, such as JazzCash or EasyPaisa,
                                will not be received and cannot be refunded.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {section.id === "upload-section" && (
                        <div
                          id="upload-section"
                          ref={uploadSectionRef}
                          className="bg-base-200/30 rounded-2xl p-6 shadow-sm"
                        >
                          <label className="block">
                            <div className="flex items-center gap-4">
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="file-input file-input-bordered w-full"
                              />
                              <span className="text-xs text-base-content/70">
                                Max size: 2.5 MB
                              </span>
                            </div>
                            {fileError && (
                              <div className="mt-2 text-error text-sm bg-error/10 p-2 rounded-md flex items-center gap-2">
                                <span>
                                  <TriangleAlert />
                                </span>
                                <span>{fileError}</span>
                              </div>
                            )}
                            {paymentSlip ? (
                              <>
                                <div className="flex items-center gap-2 mt-2 text-success">
                                  <CheckCircle2 size={16} />
                                  <span className="text-sm">
                                    Selected: {paymentSlip.name}
                                  </span>
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                  <div className="avatar">
                                    <div className="w-40 rounded-lg shadow-md">
                                      <img
                                        src={URL.createObjectURL(paymentSlip)}
                                        alt="Payment Slip"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-sm mt-2">
                                    Size:{" "}
                                    {(paymentSlip.size / (1024 * 1024)).toFixed(
                                      2
                                    )}{" "}
                                    MB
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="border-2 border-dashed border-base-300 rounded-lg mt-4 p-6 flex flex-col items-center justify-center bg-base-100">
                                <div className="text-4xl text-base-300 mb-2">
                                  <Camera size={48} />
                                </div>
                                <p className="text-center text-base-content/70">
                                  Select a payment slip to preview
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Total Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <div className="bg-base-300/50 rounded-2xl p-6 shadow-sm">
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
                    <span style={{ color: cart.restaurantAccentColor }}>
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
                >
                  {isValidImage ? "Confirm Order" : "Upload Payment Slip"}
                </button>

                <p className="text-sm text-base-content/70 text-center mt-4">
                  You will be redirected to payment gateway
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200 shadow-lg border-t border-base-300 p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base-content/70 text-sm">Total</span>
            <div
              className="font-bold"
              style={{ color: cart.restaurantAccentColor }}
            >
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
            className={`btn px-8`}
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
          >
            {isValidImage ? "Confirm Order" : "Upload Slip"}
          </button>
        </div>
      </div>

      {/* Add padding at the bottom to account for mobile sticky bar */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
