import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { hasRestaurantAccess } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import mongoose from "mongoose";
import { calculateRestaurantOnlineStatus } from "@/lib/onlineStatus";

// Next.js 15 expects this exact type signature
export async function PATCH(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const restaurantId = segments[segments.indexOf("my-restaurants") + 1];

  if (!session?.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { override } = await request.json(); // -1 | 1 | 0

  // Start a MongoDB session for transaction
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Use aggregation pipeline to get restaurant data
    const results = await RestaurantModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(restaurantId),
          isVerified: true,
        },
      },
    ]).session(mongoSession);

    if (results.length === 0) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Restaurant not found or is not verified." },
        { status: 404 }
      );
    }

    const restaurant = results[0];

    // Check access after fetching the data
    if (!hasRestaurantAccess(session.user, restaurant.owner)) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if the override value has changed
    if (restaurant.forceOnlineOverride === override) {
      await mongoSession.abortTransaction();
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
        restaurant: calculateRestaurantOnlineStatus(restaurant),
      });
    }

    // Update the restaurant using findOneAndUpdate to avoid race conditions
    const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
      restaurantId,
      { $set: { forceOnlineOverride: override } },
      { session: mongoSession, new: true }
    );

    if (!updatedRestaurant) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Failed to update restaurant" },
        { status: 500 }
      );
    }

    // Commit the transaction
    await mongoSession.commitTransaction();

    // Convert Mongoose document to plain object and calculate online status
    const plainRestaurant = JSON.parse(JSON.stringify(updatedRestaurant));
    const restaurantWithOnlineStatus =
      calculateRestaurantOnlineStatus(plainRestaurant);

    // Revalidate the cache for restaurants
    revalidateTag("verified-restaurants");
    revalidateTag(`menu-items-${restaurantId}`);

    return NextResponse.json({
      success: true,
      restaurant: restaurantWithOnlineStatus,
    });
  } catch (error) {
    // Abort the transaction on error
    await mongoSession.abortTransaction();
    console.error("❌ Error updating override:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update override" },
      { status: 500 }
    );
  } finally {
    // End the session
    mongoSession.endSession();
  }
}
