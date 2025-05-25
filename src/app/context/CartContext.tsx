"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";

export interface CartItem {
  menuItemId: string;
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

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  restaurantAccentColor: string;
  restaurantLocation: {
    lat: number;
    lng: number;
  };
  items: CartItem[];
  specialInstructions?: string;
}

interface CartContextType {
  cart: Cart;
  addItem: (
    item: CartItem,
    restaurantInfo: {
      restaurantId: string;
      restaurantName: string;
      restaurantAccentColor: string;
      restaurantLocation: {
        lat: number;
        lng: number;
      };
    }
  ) => Promise<boolean>;
  removeItem: (menuItemId: string, options?: CartItem["options"]) => void;
  updateQuantity: (
    menuItemId: string,
    quantity: number,
    options?: CartItem["options"]
  ) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getCartItemKey: (item: CartItem) => string;
  currentRestaurantId: string;
  calculateDeliveryFee: (userLocation: {
    lat: number;
    lng: number;
  }) => Promise<{ deliveryFee: number; baseFee: number; distance: number }>;
  deliveryFee: number | null;
  setDeliveryFee: (fee: number) => void;
  calculateItemTotal: (item: CartItem) => number;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
}

// Default empty cart state
const defaultCart: Cart = {
  restaurantId: "",
  restaurantName: "",
  restaurantAccentColor: "",
  restaurantLocation: {
    lat: 0,
    lng: 0,
  },
  items: [],
  specialInstructions: "",
};

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { data: session } = useSession();

  // Calculate delivery fee when user location changes
  useEffect(() => {
    const calculateFee = async () => {
      if (userLocation && cart.restaurantId) {
        const result = await calculateDeliveryFee(userLocation);
        setDeliveryFee(result.deliveryFee);
      }
    };
    calculateFee();
  }, [userLocation, cart.restaurantId]);

  useEffect(() => {
    // Load cart from localStorage
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      const savedAddress = localStorage.getItem("deliveryAddress");
      const savedLocation = localStorage.getItem("userLocation");

      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
        }
      }

      if (savedAddress) {
        setDeliveryAddress(savedAddress);
      }

      if (savedLocation) {
        try {
          setUserLocation(JSON.parse(savedLocation));
        } catch (error) {
          console.error(
            "Failed to parse user location from localStorage",
            error
          );
        }
      }
    }
  }, []);

  // Save cart and delivery address to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
      localStorage.setItem("deliveryAddress", deliveryAddress);
      if (userLocation) {
        localStorage.setItem("userLocation", JSON.stringify(userLocation));
      }
    }
  }, [cart, deliveryAddress, userLocation]);

  const addItem = (
    newItem: CartItem,
    restaurantInfo: {
      restaurantId: string;
      restaurantName: string;
      restaurantAccentColor: string;
      restaurantLocation: {
        lat: number;
        lng: number;
      };
    }
  ): Promise<boolean> => {
    // Check if user is authenticated, verified, and is a customer
    if (!session?.user) {
      toast.error("Please sign in to add items to cart");
      return Promise.resolve(false);
    }

    if (!session.user.isVerified) {
      toast.error("Please verify your account to add items to cart");
      return Promise.resolve(false);
    }

    if (!session.user.isCustomer) {
      toast.error("Only customers can add items to cart");
      return Promise.resolve(false);
    }

    console.log("Adding item:", {
      newItemRestaurantId: restaurantInfo.restaurantId,
      currentRestaurantId: cart.restaurantId,
      itemsLength: cart.items.length,
    });

    // Check if this is the first item or from the same restaurant
    if (cart.items.length === 0) {
      console.log("First item, adding to empty cart");
      setCart({
        restaurantId: restaurantInfo.restaurantId,
        restaurantName: restaurantInfo.restaurantName,
        restaurantAccentColor: restaurantInfo.restaurantAccentColor,
        restaurantLocation: restaurantInfo.restaurantLocation,
        items: [{ ...newItem, quantity: newItem.quantity || 1 }],
        specialInstructions: "",
      });
      return Promise.resolve(true);
    }

    // Convert both IDs to strings for comparison
    const currentId = String(cart.restaurantId);
    const newId = String(restaurantInfo.restaurantId);

    console.log("Comparing restaurant IDs:", {
      currentId,
      newId,
      areEqual: currentId === newId,
    });

    // Check if the item is from a different restaurant
    if (currentId !== newId) {
      console.log("Different restaurant detected, showing confirmation");

      if (typeof window === "undefined") {
        return Promise.resolve(false);
      }

      // Create and show custom confirmation dialog
      const dialog = document.createElement("dialog");
      dialog.className = "modal modal-bottom sm:modal-middle";

      dialog.innerHTML = `
        <div class="modal-box bg-base-200">
          <h3 class="font-bold text-lg mb-4">Clear Cart?</h3>
          <p class="py-4">Adding items from ${restaurantInfo.restaurantName} will clear your current cart. Do you want to continue?</p>
          <div class="modal-action">
            <form method="dialog" class="flex gap-2 w-full">
              <button class="btn btn-secondary flex-1">Cancel</button>
              <button class="btn flex-1" style="background-color: ${restaurantInfo.restaurantAccentColor}; color: white;">Clear & Add</button>
            </form>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop backdrop-blur-xs">
          <button>close</button>
        </form>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      // Return a promise that resolves with the result
      return new Promise((resolve) => {
        dialog.addEventListener("close", () => {
          const result = dialog.returnValue === "confirm";
          if (result) {
            console.log("User confirmed, clearing cart and adding new item");
            setCart({
              restaurantId: restaurantInfo.restaurantId,
              restaurantName: restaurantInfo.restaurantName,
              restaurantAccentColor: restaurantInfo.restaurantAccentColor,
              restaurantLocation: restaurantInfo.restaurantLocation,
              items: [{ ...newItem, quantity: newItem.quantity || 1 }],
              specialInstructions: "",
            });
            resolve(true);
          } else {
            console.log("User cancelled, keeping current cart");
            resolve(false);
          }
          document.body.removeChild(dialog);
        });

        // Handle the confirm button click
        const confirmButton = dialog.querySelector(
          'button[style*="background-color"]'
        );
        if (confirmButton) {
          confirmButton.addEventListener("click", () => {
            dialog.returnValue = "confirm";
            dialog.close();
          });
        }
      });
    }

    console.log("Same restaurant, proceeding with normal add logic");
    // Item is from the same restaurant, proceed with normal add logic
    setCart((prevCart) => {
      // Check if item already exists in cart with the same options
      const existingItemIndex = prevCart.items.findIndex(
        (item) =>
          item.menuItemId === newItem.menuItemId &&
          areOptionsEqual(item.options, newItem.options)
      );

      if (existingItemIndex >= 0) {
        // If item exists with the same options, update quantity only
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity:
            updatedItems[existingItemIndex].quantity + (newItem.quantity || 1),
        };
        return {
          ...prevCart,
          items: updatedItems,
        };
      } else {
        // Otherwise add as a new item
        return {
          ...prevCart,
          items: [
            ...prevCart.items,
            { ...newItem, quantity: newItem.quantity || 1 },
          ],
        };
      }
    });
    return Promise.resolve(true);
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

  const removeItem = (menuItemId: string, options?: CartItem["options"]) => {
    setCart((prevCart) => {
      const newItems = options
        ? prevCart.items.filter(
            (item) =>
              !(
                item.menuItemId === menuItemId &&
                areOptionsEqual(item.options, options)
              )
          )
        : prevCart.items.filter((item) => item.menuItemId !== menuItemId);

      // If cart becomes empty, reset to default state
      if (newItems.length === 0) {
        return defaultCart;
      }

      // Otherwise just update items
      return {
        ...prevCart,
        items: newItems,
      };
    });
  };

  const updateQuantity = (
    menuItemId: string,
    quantity: number,
    options?: CartItem["options"]
  ) => {
    if (quantity <= 0) {
      removeItem(menuItemId, options);
      return;
    }

    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.map((item) =>
        item.menuItemId === menuItemId && areOptionsEqual(item.options, options)
          ? { ...item, quantity }
          : item
      ),
    }));
  };

  const clearCart = () => {
    setCart(defaultCart);
  };

  // Calculate total items and price
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cart.items.reduce((sum, item) => {
    const optionsPrice =
      item.options?.reduce(
        (total, option) => total + option.additionalPrice,
        0
      ) || 0;
    return sum + (item.basePrice + optionsPrice) * item.quantity;
  }, 0);

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

  // Add new function to calculate delivery fee

  const calculateDeliveryFee = async (userLocation: {
    lat: number;
    lng: number;
  }): Promise<{
    deliveryFee: number;
    baseFee: number;
    distance: number;
  }> => {
    try {
      const response = await axios.post("/api/get-delivery-fee-details", {
        deliveryLocation: userLocation,
        restaurantLocation: cart.restaurantLocation,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to calculate delivery fee");
      }

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Failed to calculate delivery route";
        throw new Error(message);
      }
      throw error;
    }
  };

  const setSpecialInstructions = (instructions: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      specialInstructions: instructions,
    }));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getCartItemKey,
        currentRestaurantId: cart.restaurantId,
        calculateDeliveryFee,
        deliveryFee,
        setDeliveryFee,
        calculateItemTotal,
        deliveryAddress,
        setDeliveryAddress,
        setSpecialInstructions,
        userLocation,
        setUserLocation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
