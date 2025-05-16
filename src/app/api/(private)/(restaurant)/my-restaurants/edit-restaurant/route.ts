import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { hasRestaurantAccess } from "@/lib/auth";
import { updateRestaurantSchema } from "@/schemas/addRestaurantSchema";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import mongoose from "mongoose";
import { calculateRestaurantOnlineStatus } from "@/lib/onlineStatus";
import { revalidateTag } from "next/cache";

export async function PUT(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { _id, logoImageURL: newLogoURL } = body || {};

  if (!session?.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!_id) {
    return NextResponse.json(
      { success: false, message: "Restaurant ID is required" },
      { status: 400 }
    );
  }

  const parsed = updateRestaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Start a MongoDB session for transaction
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // First find the restaurant to check access
    const restaurant =
      await RestaurantModel.findById(_id).session(mongoSession);

    if (!restaurant) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!hasRestaurantAccess(session.user, restaurant.owner)) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // If there's a new logo URL and it's different from the existing one,
    // clean up the old image
    if (newLogoURL && newLogoURL !== restaurant.logoImageURL) {
      await cleanupCloudinaryImage(restaurant.logoImageURL);
    }

    // Update the restaurant
    const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
      _id,
      { $set: parsed.data },
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
    revalidateTag(`restaurant-menu-${_id}`);
    revalidateTag(`restaurant-status-${_id}`);

    return NextResponse.json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant: restaurantWithOnlineStatus,
    });
  } catch (error) {
    // Abort the transaction on error
    await mongoSession.abortTransaction();
    console.error("❌ Error updating restaurant:", error);

    // If we have a new logo URL and the update failed, clean it up
    if (newLogoURL) {
      await cleanupCloudinaryImage(newLogoURL);
    }

    return NextResponse.json(
      { success: false, message: "Failed to update restaurant" },
      { status: 500 }
    );
  } finally {
    // End the session
    mongoSession.endSession();
  }
}
