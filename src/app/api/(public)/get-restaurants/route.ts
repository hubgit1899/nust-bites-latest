import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { unstable_cache } from "next/cache";
import { calculateRestaurantOnlineStatus } from "@/lib/onlineStatus";

const getCachedVerifiedRestaurants = unstable_cache(
  async () => {
    await dbConnect();
    const restaurants = await RestaurantModel.find(
      { isVerified: true },
      {
        name: 1,
        logoImageURL: 1,
        accentColor: 1,
        onlineTime: 1,
        forceOnlineOverride: 1,
        isVerified: 1,
      }
    );

    return restaurants;
  },
  ["verified-restaurants"],
  { revalidate: 60 * 5, tags: ["verified-restaurants"] } // TODO: Adjust revalidation time as needed
);

export async function GET() {
  try {
    const restaurants = await getCachedVerifiedRestaurants();

    // Convert to plain objects and calculate online status
    const plainRestaurants = JSON.parse(JSON.stringify(restaurants));
    const restaurantsWithOnlineStatus =
      calculateRestaurantOnlineStatus(plainRestaurants);

    return NextResponse.json({
      success: true,
      restaurants: restaurantsWithOnlineStatus,
    });
  } catch (error) {
    console.error("Error fetching verified restaurants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load restaurants." },
      { status: 500 }
    );
  }
}
