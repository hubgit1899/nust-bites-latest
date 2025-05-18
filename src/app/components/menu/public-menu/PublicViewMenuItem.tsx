"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  Info,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff,
  ShoppingCart,
  Plus,
  Minus,
  LogIn,
  UserCheck,
  UserX,
} from "lucide-react";
import { formatTime } from "@/helpers/localTime";
import { MenuItem, MenuOption } from "@/models/MenuItem";
import hexToRGBA from "@/lib/hexToRGBA";
import { useCart, CartItem } from "@/app/context/CartContext";
import { toast } from "sonner";
import { Restaurant } from "@/models/Restaurant";
import { useSession } from "next-auth/react";

interface ViewMenuItemProps {
  menuItem: MenuItem;
  accentColor: string;
  restaurant: Restaurant;
}

const ViewMenuItem: React.FC<ViewMenuItemProps> = ({
  menuItem,
  accentColor,
  restaurant,
}) => {
  const { addItem } = useCart();
  const { data: session } = useSession();
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
  >({});
  const [expandedOptions, setExpandedOptions] = useState<
    Record<string, boolean>
  >({});

  // Calculate total price based on base price and selected options
  const calculateTotalPrice = () => {
    let total = menuItem.basePrice;

    // Add price from selected options
    if (menuItem.options && menuItem.options.length > 0) {
      Object.entries(selectedOptions).forEach(([header, selectedIndex]) => {
        const option = menuItem.options?.find(
          (opt) => opt.optionHeader === header
        );
        if (option && selectedIndex >= 0) {
          total += option.additionalPrice[selectedIndex] || 0;
        }
      });
    }

    // Multiply by quantity
    return total * quantity;
  };

  // Initialize selected options when modal opens
  const openModal = () => {
    // Reset quantity
    setQuantity(1);

    // Initialize with empty selections (no default options selected)
    setSelectedOptions({});

    // Reset expanded options
    setExpandedOptions({});

    // Open modal
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  // Handle option selection
  const handleOptionSelect = (headerName: string, optionIndex: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [headerName]: optionIndex,
    }));
  };

  // Toggle option group expansion
  const toggleOptionExpansion = (headerName: string) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [headerName]: !prev[headerName],
    }));
  };

  // Render option group using custom implementation
  const renderOptionGroup = (option: MenuOption) => {
    const isExpanded = expandedOptions[option.optionHeader] || false;

    return (
      <div key={option.optionHeader} className="mb-2">
        <div className="bg-base-100 border-base-300 border rounded-lg overflow-hidden">
          <div
            className="p-3 font-semibold text-sm flex items-center justify-between cursor-pointer hover:bg-base-300/50"
            onClick={() => toggleOptionExpansion(option.optionHeader)}
          >
            <span className="flex items-center">
              {option.optionHeader}
              {option.required && <span className="text-error ml-1">*</span>}
            </span>
            <div className="flex items-center gap-2">
              {!option.required ? (
                <span className="badge badge-soft badge-success text-xs rounded-md">
                  Optional
                </span>
              ) : (
                <span className="badge badge-soft badge-error text-xs rounded-md">
                  Required
                </span>
              )}
              <span
                className="transition-transform duration-200"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          {isExpanded && (
            <div className="text-sm p-3 pt-0 overflow-y-auto max-h-60">
              <div className="mt-2 space-y-2">
                {option.name.map((name, index) => {
                  const isSelected =
                    selectedOptions[option.optionHeader] === index;
                  const additionalPrice = option.additionalPrice[index];

                  return (
                    <div
                      key={`${option.optionHeader}-${index}`}
                      className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-all ${
                        isSelected
                          ? "bg-base-300 border-2"
                          : "bg-base-200 hover:bg-base-300/50"
                      }`}
                      style={isSelected ? { borderColor: accentColor } : {}}
                      onClick={() =>
                        handleOptionSelect(option.optionHeader, index)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <div style={{ color: accentColor }}>
                            <CheckCircle size={16} />
                          </div>
                        ) : (
                          <div className="w-4"></div>
                        )}
                        <span>{name}</span>
                      </div>
                      {additionalPrice > 0 && (
                        <span className="text-sm">+Rs. {additionalPrice}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Check if all required options are selected
  const allRequiredOptionsSelected = () => {
    if (!menuItem.options) return true;

    return menuItem.options
      .filter((option) => option.required)
      .every((option) => selectedOptions[option.optionHeader] !== undefined);
  };

  // Get button text and icon based on user status
  const getButtonContent = () => {
    if (!session?.user) {
      return {
        text: "Sign in to Order",
        icon: <LogIn size={16} />,
        disabled: true,
      };
    }
    if (!session.user.isVerified) {
      return {
        text: "Verify Account",
        icon: <UserCheck size={16} />,
        disabled: true,
      };
    }
    if (!session.user.isCustomer) {
      return {
        text: "Customers Only",
        icon: <UserX size={16} />,
        disabled: true,
      };
    }
    return {
      text: "Add to Cart",
      icon: <ShoppingCart size={16} />,
      disabled: !allRequiredOptionsSelected(),
    };
  };

  const buttonContent = getButtonContent();

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!allRequiredOptionsSelected()) {
      toast.error("Please select all required options");
      return;
    }

    // Ensure we have a valid restaurant ID
    if (!menuItem.restaurant || !menuItem.restaurant) {
      toast.error("Invalid restaurant information");
      return;
    }

    // Convert selected options to the format needed for CartItem
    const formattedOptions = Object.entries(selectedOptions).map(
      ([header, index]) => {
        const option = menuItem.options?.find(
          (opt) => opt.optionHeader === header
        );
        return {
          optionHeader: header,
          selected: option?.name[index] || "",
          additionalPrice: option?.additionalPrice[index] || 0,
        };
      }
    );

    const cartItem: CartItem = {
      menuItemId: menuItem._id.toString(),
      name: menuItem.name,
      basePrice: menuItem.basePrice,
      imageURL: menuItem.imageURL,
      category: menuItem.category,
      quantity: quantity,
      options: formattedOptions.length > 0 ? formattedOptions : undefined,
    };

    const success = await addItem(cartItem, {
      restaurantId: restaurant._id.toString(),
      restaurantName: restaurant.name,
      restaurantAccentColor: restaurant.accentColor,
      restaurantLocation: {
        lat: restaurant.location.lat,
        lng: restaurant.location.lng,
      },
    });

    if (success) {
      toast.success(`Added ${menuItem.name} to cart.`);
      if (modalRef.current) {
        modalRef.current.close();
      }
    }
  };

  return (
    <>
      {/* View Button */}
      <button
        className="btn btn-xs sm:btn-sm gap-2 text-xs"
        style={{
          backgroundColor: accentColor,
          borderColor: hexToRGBA(accentColor, 0.5),
          color: "white",
        }}
        onClick={openModal}
      >
        View Item
      </button>

      {/* Main Modal Dialog */}
      <dialog
        ref={modalRef}
        id={`modal-${menuItem._id}`}
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box max-w-4xl bg-base-200 max-h-[90vh] p-0 flex flex-col">
          {/* Content wrapper with fixed header, scrollable content, and fixed footer */}
          <div className="flex flex-col h-full">
            {/* Header - Fixed position */}
            <div className="p-4 bg-base-200 sticky top-0 z-10">
              {/* Image section with fixed rounded corners */}
              <div className="relative w-full mb-3 rounded-lg overflow-hidden">
                <Image
                  src={menuItem.imageURL}
                  alt={menuItem.name}
                  width={300}
                  height={150}
                  className="w-full aspect-[16/9] object-contain bg-base-300 rounded-lg"
                />

                {/* Category badge */}
                <div
                  className="absolute bottom-2 left-2 badge border-none"
                  style={{
                    backgroundColor: hexToRGBA(accentColor, 0.8),
                    color: "white",
                  }}
                >
                  {menuItem.category}
                </div>
              </div>

              {/* Item details */}
              <h2 className="text-lg font-bold mb-1">{menuItem.name}</h2>
              <p className="text-base-content/80 text-xs mb-3">
                {menuItem.description}
              </p>

              {/* Info section */}
              <div className="bg-base-300 rounded-md p-2 mb-0">
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center gap-1 text-xs text-base-content/70">
                    <Clock size={12} />
                    <span>
                      {menuItem.forceOnlineOverride && menuItem.onlineTime
                        ? `Available: ${formatTime(menuItem.onlineTime.start)} - ${formatTime(menuItem.onlineTime.end)}`
                        : "Follows restaurant schedule"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-base-content/70">
                    <Info size={12} />
                    <span>
                      {menuItem.options && menuItem.options.length > 0
                        ? `${menuItem.options.length} option${menuItem.options.length > 1 ? "s" : ""} available`
                        : "No customization options"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {menuItem.options && menuItem.options.length > 0 && (
                <div className="pb-4">
                  <h3 className="font-semibold mb-2 sticky top-0 bg-base-200 py-2 text-sm">
                    Customize Your Order
                  </h3>
                  <div className="space-y-2">
                    {menuItem.options.map((option) =>
                      renderOptionGroup(option)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed position */}
            <div className="p-4 border-t border-base-300 bg-base-200 sticky bottom-0 z-10">
              {/* Quantity and price */}
              <div className="flex justify-between items-center mb-4 mr-2 ml-2">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-base-100 rounded-full px-1 py-0.5">
                  {/* Decrease Button */}
                  <button
                    className="p-1 rounded-full transition-colors"
                    style={{ color: accentColor }}
                    onClick={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                      e.currentTarget.style.color = "#fff";
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = accentColor;
                    }}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>

                  {/* Quantity Display */}
                  <span className="font-medium">{quantity}</span>

                  {/* Increase Button */}
                  <button
                    className="p-1 rounded-full transition-colors"
                    style={{ color: accentColor }}
                    onClick={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                      e.currentTarget.style.color = "#fff";
                      setQuantity(quantity + 1);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = accentColor;
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = accentColor;
                    }}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-xl font-bold">
                  Rs. {calculateTotalPrice()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <form method="dialog" className="flex-1">
                  <button className="btn btn-secondary w-full">Cancel</button>
                </form>

                <button
                  className="btn flex-1 gap-2"
                  disabled={buttonContent.disabled}
                  style={{
                    backgroundColor: !buttonContent.disabled
                      ? accentColor
                      : undefined,
                    color: !buttonContent.disabled ? "white" : undefined,
                  }}
                  onClick={handleAddToCart}
                >
                  {buttonContent.icon}
                  {buttonContent.text}
                </button>
              </div>
            </div>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop backdrop-blur-xs">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default ViewMenuItem;
