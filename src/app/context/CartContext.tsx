"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  restaurantId: number;
  menuItemId: number;
  name: string;
  basePrice: number;
  imageURL: string;
  category: string;
  quantity: number;
  options?: {
    optionHeader: string;
    selected: string;
    additionalPrice: number;
  }[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: number, options?: CartItem["options"]) => void;
  updateQuantity: (
    menuItemId: number,
    quantity: number,
    options?: CartItem["options"]
  ) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getCartItemKey: (item: CartItem) => string;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on client side
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Check if item already exists in cart with the same options
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.menuItemId === newItem.menuItemId &&
          areOptionsEqual(item.options, newItem.options)
      );

      if (existingItemIndex >= 0) {
        // If item exists with the same options, update quantity only
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity:
            updatedItems[existingItemIndex].quantity + (newItem.quantity || 1),
        };
        return updatedItems;
      } else {
        // Otherwise add as a new item
        return [...prevItems, { ...newItem, quantity: newItem.quantity || 1 }];
      }
    });
  };

  // Helper function to compare options equality
  const areOptionsEqual = (
    options1?: CartItem["options"],
    options2?: CartItem["options"]
  ): boolean => {
    // If both are undefined or empty, they're equal
    if (!options1 && !options2) return true;
    if (!options1 || !options2) return false;
    if (options1.length !== options2.length) return false;

    // Create a copy of options that we can sort
    const sortedOptions1 = [...options1].sort((a, b) =>
      a.optionHeader.localeCompare(b.optionHeader)
    );
    const sortedOptions2 = [...options2].sort((a, b) =>
      a.optionHeader.localeCompare(b.optionHeader)
    );

    // Compare each option
    return sortedOptions1.every(
      (option, index) =>
        option.optionHeader === sortedOptions2[index].optionHeader &&
        option.selected === sortedOptions2[index].selected &&
        option.additionalPrice === sortedOptions2[index].additionalPrice
    );
  };

  // Create a unique identifier for each cart item based on ID and options
  const getCartItemKey = (item: CartItem): string => {
    const optionsKey = item.options
      ? item.options
          .map(
            (opt) =>
              `${opt.optionHeader}:${opt.selected}:${opt.additionalPrice}`
          )
          .sort()
          .join("|")
      : "";
    return `${item.menuItemId}-${optionsKey}`;
  };

  const removeItem = (menuItemId: number, options?: CartItem["options"]) => {
    setItems((prevItems) => {
      if (options) {
        // Remove specific item with matching options
        return prevItems.filter(
          (item) =>
            !(
              item.menuItemId === menuItemId &&
              areOptionsEqual(item.options, options)
            )
        );
      } else {
        // Remove all items with this menuItemId, regardless of options
        return prevItems.filter((item) => item.menuItemId !== menuItemId);
      }
    });
  };

  const updateQuantity = (
    menuItemId: number,
    quantity: number,
    options?: CartItem["options"]
  ) => {
    if (quantity <= 0) {
      removeItem(menuItemId, options);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItemId === menuItemId && areOptionsEqual(item.options, options)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate total items and price
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const optionsPrice =
      item.options?.reduce(
        (total, option) => total + option.additionalPrice,
        0
      ) || 0;
    return sum + (item.basePrice + optionsPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getCartItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
