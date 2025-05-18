import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import RestaurantModel from "@/models/Restaurant";
import MenuItem, { MenuItem as MenuItemType } from "@/models/MenuItem";
import {
  calculateMenuItemOnlineStatus,
  calculateRestaurantOnlineStatus,
} from "@/lib/onlineStatus";
import { calculateStreetDistance } from "@/lib/distance";
import { getAdminSettings } from "./getAdminSettings";
import { Item as OrderItem } from "@/models/Order";

// Define types for our function parameters and return values
export interface CartItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  restaurantId?: Types.ObjectId;
  options?: {
    optionHeader: string;
    selected: string;
    additionalPrice: number;
  }[];
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
}

export interface RestaurantLocation {
  lat: number;
  lng: number;
}

interface ValidateCartResult {
  success: boolean;
  message: string;
  removedItems?: CartItem[];
  verifiedItems?: CartItem[];
  deliveryFeeDetails?: {
    deliveryFee: number;
    baseFee: number;
    distance: number;
  };

  verifiedOrderItems?: OrderItem[];
  restaurantId?: Types.ObjectId;
}

/**
 * Validates the cart items against the current menu and calculates delivery fee
 * @param items Array of cart items to validate
 * @param restaurantId ID of the restaurant
 * @param deliveryLocation Customer's delivery location coordinates
 * @returns Validation result with success status, message, removed items, verified items, and delivery fee
 */
export async function validateCart(
  items: CartItem[],
  restaurantId: string,
  deliveryLocation: DeliveryLocation
): Promise<ValidateCartResult> {
  try {
    // Fetch restaurant and verify it exists
    const restaurant = await RestaurantModel.findOne(
      {
        _id: restaurantId,
        isVerified: true,
      },
      {
        name: 1,
        onlineTime: 1,
        forceOnlineOverride: 1,
        isVerified: 1,
        location: 1,
      }
    ).lean();

    if (!restaurant) {
      return {
        success: false,
        message: "Restaurant not found",
      };
    }

    const plainRestaurant = JSON.parse(JSON.stringify(restaurant));
    const restaurantWithStatus =
      calculateRestaurantOnlineStatus(plainRestaurant);

    // Check if restaurant is online
    if (!restaurantWithStatus.online) {
      return {
        success: false,
        message: "Restaurant is currently offline",
      };
    }

    // Fetch all menu items from the cart
    const menuItemIds = items.map(
      (item) => new mongoose.Types.ObjectId(item.menuItemId)
    );

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurant: restaurantId,
    }).lean();

    if (!menuItems || menuItems.length === 0) {
      return {
        success: false,
        message: "No menu items found",
      };
    }

    // Convert to plain objects before calculating online status
    const plainMenuItems = JSON.parse(JSON.stringify(menuItems));

    // Calculate online status for menu items
    const onlineMenuItems = calculateMenuItemOnlineStatus(
      plainMenuItems,
      plainRestaurant
    ) as MenuItemType[];

    // Verify each item in the cart
    const removedItems: CartItem[] = [];
    const verifiedItems: CartItem[] = [];
    const verifiedOrderItems: OrderItem[] = [];

    for (const cartItem of items) {
      const menuItem = onlineMenuItems.find(
        (item: MenuItemType) =>
          item._id?.toString() === cartItem.menuItemId.toString()
      );

      // Check if item exists
      if (!menuItem) {
        removedItems.push({
          ...cartItem,
          reason: "Item no longer exists in the menu",
        } as CartItem & { reason: string });
        continue;
      }

      // Check if item is online
      if (!menuItem.online) {
        removedItems.push({
          ...cartItem,
          reason: "Item is currently unavailable",
        } as CartItem & { reason: string });
        continue;
      }

      // Verify base price
      if (menuItem.basePrice !== cartItem.basePrice) {
        removedItems.push({
          ...cartItem,
          reason: "Item price has changed",
        } as CartItem & { reason: string });
        continue;
      }

      // Check for required options first - moved outside of the cartItem.options check
      // to ensure we check for required options even if the cart item has no options
      if (menuItem.options && menuItem.options.length > 0) {
        const requiredOptions = menuItem.options.filter(
          (opt: any) => opt.required
        );

        // If there are required options, check if they are all included in the cart item
        if (requiredOptions.length > 0) {
          const cartItemOptions = cartItem.options || [];
          const missingRequiredOptions = requiredOptions.filter(
            (requiredOpt: any) =>
              !cartItemOptions.some(
                (cartOpt) => cartOpt.optionHeader === requiredOpt.optionHeader
              )
          );

          if (missingRequiredOptions.length > 0) {
            const missingOptionNames = missingRequiredOptions
              .map((opt: any) => opt.optionHeader)
              .join(", ");

            removedItems.push({
              ...cartItem,
              reason: `Required options are missing: ${missingOptionNames}`,
            } as CartItem & { reason: string });
            continue;
          }
        }
      }

      // Verify options if present
      let hasInvalidOptions = false;

      if (cartItem.options && cartItem.options.length > 0) {
        for (const cartOption of cartItem.options) {
          const menuOption = menuItem.options?.find(
            (opt: any) => opt.optionHeader === cartOption.optionHeader
          );

          if (!menuOption) {
            removedItems.push({
              ...cartItem,
              reason: `Option "${cartOption.optionHeader}" is no longer available`,
            } as CartItem & { reason: string });
            hasInvalidOptions = true;
            break;
          }

          // Check if selected option exists and price matches
          const optionIndex = menuOption.name.indexOf(cartOption.selected);
          if (optionIndex === -1) {
            removedItems.push({
              ...cartItem,
              reason: `Option "${cartOption.optionHeader}: ${cartOption.selected}" is no longer available`,
            } as CartItem & { reason: string });
            hasInvalidOptions = true;
            break;
          }

          if (
            menuOption.additionalPrice[optionIndex] !==
            cartOption.additionalPrice
          ) {
            removedItems.push({
              ...cartItem,
              reason: `Price for option "${cartOption.optionHeader}: ${cartOption.selected}" has changed`,
            } as CartItem & { reason: string });
            hasInvalidOptions = true;
            break;
          }
        }

        if (hasInvalidOptions) {
          continue;
        }
      }

      // Add the verified item with restaurant ID
      verifiedItems.push({
        ...cartItem,
        restaurantId: new Types.ObjectId(restaurantId),
      });
      verifiedOrderItems.push({
        menuItem: new Types.ObjectId(cartItem.menuItemId),
        name: cartItem.name,
        basePrice: cartItem.basePrice,
        imageURL: menuItem.imageURL,
        category: menuItem.category,
        options: cartItem.options,
        quantity: cartItem.quantity,
        restaurant: new Types.ObjectId(restaurant._id.toString()),
      });
    }

    // If any items were removed, return them
    if (removedItems.length > 0) {
      return {
        success: false,
        message: "Some items are no longer available or have been modified",
        removedItems: removedItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          basePrice: item.basePrice,
          quantity: item.quantity,
          options: item.options,
          reason: (item as any).reason,
        })),
        verifiedOrderItems: [],
      };
    }

    // Calculate delivery fee based on distance
    const deliveryFeeDetails = await calculateDeliveryFeeDetailsFromDistance(
      deliveryLocation,
      plainRestaurant.location
    );
    if (!deliveryFeeDetails) {
      return {
        success: false,
        message: "Failed to calculate delivery fee",
        verifiedOrderItems: [],
      };
    }

    return {
      success: true,
      message: "Order verified successfully",
      verifiedItems,
      deliveryFeeDetails,
      verifiedOrderItems,
      restaurantId: new Types.ObjectId(restaurant._id.toString()),
    };
  } catch (error) {
    console.error("Cart validation error:", error);
    return {
      success: false,
      message: "An error occurred while validating the cart",
      verifiedOrderItems: [],
    };
  }
}

/**
 * Calculates the delivery fee based on distance and admin settings
 * @param deliveryLocation Customer's delivery location
 * @param restaurantLocation Restaurant's location
 * @returns Object with deliveryFee, baseFee, and distance
 */
export async function calculateDeliveryFeeDetailsFromDistance(
  deliveryLocation: DeliveryLocation,
  restaurantLocation: RestaurantLocation
): Promise<{
  deliveryFee: number;
  baseFee: number;
  distance: number;
}> {
  try {
    const adminSettings = await getAdminSettings();

    if (!adminSettings) {
      throw new Error("Admin settings not found");
    }

    const baseFee = adminSettings.baseDeliveryFee ?? 0;
    const perKm = adminSettings.deliveryFeePerKm ?? 0;

    const distance = await calculateStreetDistance(
      deliveryLocation.lat,
      deliveryLocation.lng,
      restaurantLocation.lat,
      restaurantLocation.lng
    );

    const deliveryFee = Math.round(distance * perKm);
    if (deliveryFee < baseFee) {
      return { deliveryFee: baseFee, baseFee, distance };
    }

    return { deliveryFee, baseFee, distance };
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    return { deliveryFee: 0, baseFee: 0, distance: 0 };
  }
}
