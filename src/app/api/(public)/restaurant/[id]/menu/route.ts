import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import MenuItemModel from "@/models/MenuItem"; // Add this import
import { unstable_cache } from "next/cache";
import {
  calculateMenuItemOnlineStatus,
  calculateRestaurantOnlineStatus,
} from "@/lib/onlineStatus";

// Function to get restaurant with only the requested fields and available menu items
const getCachedRestaurantWithMenu = (restaurantId: string) =>
  unstable_cache(
    async () => {
      await dbConnect();

      // First, find the restaurant to make sure it exists with only the specified fields
      const restaurant = await RestaurantModel.findOne(
        {
          _id: restaurantId,
          isVerified: true,
        },
        {
          name: 1,
          logoImageURL: 1,
          accentColor: 1,
          onlineTime: 1,
          forceOnlineOverride: 1,
          isVerified: 1,
        }
      ).lean();

      if (!restaurant) {
        return null;
      }

      // Then, separately find all menu items for this restaurant
      const menuItems = await MenuItemModel.find({
        restaurant: restaurantId,
        available: true,
      })
        .sort({ category: 1, name: 1 })
        .lean();

      // Combine them into the expected structure
      return {
        ...restaurant,
        menu: menuItems,
      };
    },
    [`restaurant-menu-${restaurantId}`],
    { revalidate: 60 * 10, tags: [`restaurant-menu-${restaurantId}`] } // TODO: Adjust revalidation time as needed
  )();

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const restaurantId = segments[segments.indexOf("menu") - 1];

    console.log("Fetching menu for restaurant ID:", restaurantId);

    const restaurant = await getCachedRestaurantWithMenu(restaurantId);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found or not verified." },
        { status: 404 }
      );
    }

    let plainRestaurant = JSON.parse(JSON.stringify(restaurant));
    plainRestaurant = calculateRestaurantOnlineStatus(plainRestaurant);

    // If restaurant is offline, return restaurant only (exclude menu)
    if (!plainRestaurant.online) {
      return NextResponse.json({
        success: true,
        restaurant: {
          ...plainRestaurant,
          menu: undefined, // explicitly remove menu
        },
        message: "Restaurant is currently offline.",
      });
    }

    // If restaurant is online, filter for online menu items only
    if (plainRestaurant.menu && plainRestaurant.menu.length > 0) {
      plainRestaurant.menu = calculateMenuItemOnlineStatus(
        plainRestaurant.menu,
        plainRestaurant
      ).filter((item: { online: boolean }) => item.online); // 👈 Only include online items
    } else {
      return NextResponse.json({
        success: true,
        restaurant: plainRestaurant,
        message: "Restaurant has no available menu items.",
      });
    }

    return NextResponse.json({
      success: true,
      restaurant: plainRestaurant,
    });
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load restaurant menu.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
