import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { calculateRestaurantOnlineStatus } from "@/lib/onlineStatus";
import mongoose from "mongoose";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Use aggregation pipeline to get restaurants with proper sorting
    const restaurants = await RestaurantModel.aggregate([
      // Match restaurants owned by the user
      { $match: { owner: new mongoose.Types.ObjectId(session.user._id) } },
      // Sort by menu in descending order
      { $sort: { menu: -1 } },
      // Lookup related menu items
      {
        $lookup: {
          from: "menuitems",
          localField: "_id",
          foreignField: "restaurant",
          as: "menuItems",
        },
      },
      // Sort menu items by category and name
      {
        $addFields: {
          menuItems: {
            $sortArray: {
              input: "$menuItems",
              sortBy: { category: 1, name: 1 },
            },
          },
        },
      },
    ]);

    // Convert to plain objects and calculate online status
    const plainRestaurants = JSON.parse(JSON.stringify(restaurants));
    const restaurantsWithOnlineStatus =
      calculateRestaurantOnlineStatus(plainRestaurants);

    console.log(
      "✅ Fetched restaurants successfully:",
      restaurantsWithOnlineStatus.length
    );

    return NextResponse.json({
      success: true,
      restaurants: restaurantsWithOnlineStatus,
    });
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
