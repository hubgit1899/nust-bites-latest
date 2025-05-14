"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  Info,
  Clock,
  CheckCircle,
  MinusCircle,
  PlusCircle,
  Wifi,
  WifiOff,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react";
import { formatTime } from "@/helpers/localTime";
import { MenuItem, MenuOption } from "@/models/MenuItem";
import hexToRGBA from "@/lib/hexToRGBA";

interface ViewMenuItemProps {
  menuItem: MenuItem;
  accentColor: string;
}

const ViewMenuItem: React.FC<ViewMenuItemProps> = ({
  menuItem,
  accentColor,
}) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
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

  // Render option group using collapse component
  const renderOptionGroup = (option: MenuOption) => {
    return (
      <div key={option.optionHeader} className="mb-2">
        <div
          tabIndex={0}
          className="collapse collapse-arrow bg-base-100 border-base-300 border"
        >
          <input type="checkbox" className="peer" defaultChecked={false} />
          <div className="collapse-title font-semibold text-sm flex items-center justify-between">
            <span className="flex items-center">
              {option.optionHeader}
              {option.required && <span className="text-error ml-1">*</span>}
            </span>
            {!option.required ? (
              <span className="badge badge-soft badge-success text-xs rounded-md">
                Optional
              </span>
            ) : (
              <span className="badge badge-soft badge-error text-xs rounded-md">
                Required
              </span>
            )}
          </div>
          <div className="collapse-content text-sm">
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
        <div className="modal-box max-w-4xl bg-base-200 overflow-hidden">
          {/* Fixed header section with image */}
          <div className="sticky top-0 bg-base-200 z-10 pb-4">
            {/* Image section with fixed rounded corners */}
            <div className="relative w-full mb-4 rounded-lg overflow-hidden">
              <Image
                src={menuItem.imageURL}
                alt={menuItem.name}
                width={300}
                height={200}
                className="w-full aspect-video object-contain bg-base-300 rounded-lg"
              />

              {/* Online/Offline badge */}
              <div
                className="absolute top-2 right-2 tooltip tooltip-left"
                data-tip={menuItem.online ? "Online" : "Offline"}
              >
                <div className="bg-base-100 rounded-full p-1 shadow-md">
                  {menuItem.online ? (
                    <Wifi size={16} className="text-success" />
                  ) : (
                    <WifiOff size={16} className="text-error" />
                  )}
                </div>
              </div>

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
            <h2 className="text-xl font-bold">{menuItem.name}</h2>
            <p className="text-base-content/80 mt-2 mb-4 text-sm">
              {menuItem.description}
            </p>

            {/* Info section */}
            <div className="bg-base-300 rounded-md p-3 mb-4">
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center gap-1 text-xs text-base-content/70">
                  <Clock size={14} />
                  <span>
                    {menuItem.forceOnlineOverride && menuItem.onlineTime
                      ? `Available: ${formatTime(menuItem.onlineTime.start)} - ${formatTime(menuItem.onlineTime.end)}`
                      : "Follows restaurant schedule"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-base-content/70">
                  <Info size={14} />
                  <span>
                    {menuItem.options && menuItem.options.length > 0
                      ? `${menuItem.options.length} option${menuItem.options.length > 1 ? "s" : ""} available`
                      : "No customization options"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable options section */}
          {menuItem.options && menuItem.options.length > 0 && (
            <div className="flex-grow overflow-y-auto mb-4 max-h-60 rounded-xl">
              <h3 className="font-semibold mb-2 px-1">Customize Your Order</h3>
              {menuItem.options.map((option) => renderOptionGroup(option))}
            </div>
          )}

          {/* Fixed footer section */}
          <div className="sticky bottom-0 bg-base-200 pt-2">
            {/* Quantity and price */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-sm btn-circle btn-outline border-none transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    color: accentColor,
                    borderColor: accentColor,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.1
                    );
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.2
                    );
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.1
                    );
                  }}
                >
                  <Minus />
                </button>

                <span className="text-lg font-medium w-8 text-center">
                  {quantity}
                </span>

                <button
                  className="btn btn-sm btn-circle btn-outline border-none transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    color: accentColor,
                    borderColor: accentColor,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.1
                    );
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.2
                    );
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRGBA(
                      accentColor,
                      0.1
                    );
                  }}
                >
                  <Plus />
                </button>
              </div>

              <div className="text-xl font-bold">
                Rs. {calculateTotalPrice()}
              </div>
            </div>

            {/* Actions */}
            <div className="modal-action">
              <form method="dialog" className="flex gap-2 w-full">
                <button className="btn btn-secondary flex-1">Cancel</button>

                <button
                  className="btn flex-1 gap-2"
                  disabled={!allRequiredOptionsSelected()}
                  style={{
                    backgroundColor: allRequiredOptionsSelected()
                      ? accentColor
                      : undefined,
                    color: allRequiredOptionsSelected() ? "white" : undefined,
                  }}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </form>
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
