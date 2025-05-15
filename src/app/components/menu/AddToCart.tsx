"use client";

import React, { useState } from "react";
import { useCart, CartItem } from "@/app/context/CartContext";
import { toast } from "sonner";
import { MenuItem, MenuOption } from "@/models/MenuItem";
import { PlusIcon, MinusIcon, ShoppingCartIcon } from "lucide-react";

interface AddToCartProps {
  menuItem: MenuItem;
}

export default function AddToCart({ menuItem }: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { name: string; price: number }>
  >({});

  // Handle option selection
  const handleOptionSelect = (
    optionHeader: string,
    name: string,
    price: number,
    required: boolean
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionHeader]: { name, price },
    }));
  };

  // Validate if all required options are selected
  const validateOptions = () => {
    if (!menuItem.options || menuItem.options.length === 0) return true;

    const requiredOptions = menuItem.options.filter(
      (option) => option.required
    );

    for (const option of requiredOptions) {
      if (!selectedOptions[option.optionHeader]) {
        return false;
      }
    }

    return true;
  };

  // Add to cart function
  const handleAddToCart = () => {
    if (!validateOptions()) {
      toast.error("Please select all required options");
      return;
    }

    // Convert selected options to the format needed for CartItem
    const formattedOptions = Object.entries(selectedOptions).map(
      ([optionHeader, { name, price }]) => ({
        optionHeader,
        selected: name,
        additionalPrice: price,
      })
    );

    const cartItem: CartItem = {
      restaurantId: menuItem.restaurant._id, // Assuming restaurant has _id
      menuItemId: menuItem._id as unknown as number, // MongoDB ObjectId will be cast to number
      name: menuItem.name,
      basePrice: menuItem.basePrice,
      imageURL: menuItem.imageURL,
      category: menuItem.category,
      quantity: quantity,
      options: formattedOptions.length > 0 ? formattedOptions : undefined,
    };

    addItem(cartItem);
    toast.success(`${menuItem.name} added to cart!`);
  };

  // Calculate total price including options
  const calculateTotalPrice = () => {
    let total = menuItem.basePrice;

    // Add option prices
    Object.values(selectedOptions).forEach((option) => {
      total += option.price;
    });

    return total * quantity;
  };

  return (
    <div className="mt-4">
      {/* Options selection */}
      {menuItem.options && menuItem.options.length > 0 && (
        <div className="space-y-4 mb-4">
          {menuItem.options.map((option: MenuOption) => (
            <div key={option.optionHeader} className="space-y-2">
              <h3 className="font-semibold">
                {option.optionHeader}{" "}
                {option.required && <span className="text-error">*</span>}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {option.name.map((name, index) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={option.optionHeader}
                      checked={
                        selectedOptions[option.optionHeader]?.name === name
                      }
                      onChange={() =>
                        handleOptionSelect(
                          option.optionHeader,
                          name,
                          option.additionalPrice[index],
                          option.required
                        )
                      }
                      className="radio radio-sm"
                    />
                    <span>{name}</span>
                    {option.additionalPrice[index] > 0 && (
                      <span className="text-sm text-gray-500">
                        (+Rs.{option.additionalPrice[index].toFixed(2)})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity and add to cart */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="btn btn-sm btn-circle"
          >
            <MinusIcon size={16} />
          </button>
          <span className="mx-2 font-medium w-8 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((prev) => prev + 1)}
            className="btn btn-sm btn-circle"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        <div className="text-xl font-semibold">
          Rs.{calculateTotalPrice().toFixed(2)}
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className="btn btn-primary w-full mt-4"
        disabled={!menuItem.available || !menuItem.online}
      >
        <ShoppingCartIcon size={18} />
        Add to Cart
      </button>

      {(!menuItem.available || !menuItem.online) && (
        <p className="text-error text-sm mt-1">
          This item is currently unavailable
        </p>
      )}
    </div>
  );
}
