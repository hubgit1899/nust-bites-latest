import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { unstable_cache } from "next/cache";

const getCachedVerifiedRestaurants = unstable_cache(
  async () => {
    await dbConnect();
    const restaurants = await RestaurantModel.find({ isVerified: true })
      .select(
        "name logoImageURL accentColor orderCode location online onlineTime rating ratingCount"
      )
      .lean();
    return restaurants;
  },
  ["verified-restaurants"],
  { revalidate: 60 * 5, tags: ["verified-restaurants"] } // Cache 5 minutes
);

export async function GET() {
  try {
    const restaurants = await getCachedVerifiedRestaurants();
    console.log("Restaurants: ", restaurants);
    return NextResponse.json({ success: true, restaurants });
  } catch (error) {
    console.error("Error fetching verified restaurants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load restaurants." },
      { status: 500 }
    );
  }
}
