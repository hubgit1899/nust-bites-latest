import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import User from "@/models/User";
import { hasRestaurantAccess } from "@/lib/auth";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import mongoose from "mongoose";

export async function DELETE(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const restaurantId = segments[segments.indexOf("my-restaurants") + 1];

  if (!session?.user?._id || !session.user.isVerified) {
    return NextResponse.json(
      { success: false, message: "Unauthorized or unverified user." },
      { status: 401 }
    );
  }

  if (!restaurantId) {
    return NextResponse.json(
      { success: false, message: "Restaurant ID is required." },
      { status: 400 }
    );
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Get the restaurant
    const restaurant =
      await RestaurantModel.findById(restaurantId).session(mongoSession);

    if (!restaurant) {
      throw new Error("Restaurant not found.");
    }

    if (!hasRestaurantAccess(session.user, restaurant.owner)) {
      throw new Error("You do not have permission to delete this restaurant.");
    }

    // Get all menu items for this restaurant
    const menuItems = await MenuItem.find({ restaurant: restaurantId }).session(
      mongoSession
    );

    // Store image URLs for cleanup after transaction
    const imageUrlsToDelete = menuItems
      .map((item) => item.imageURL)
      .filter((url) => url) as string[];

    if (restaurant.logoImageURL) {
      imageUrlsToDelete.push(restaurant.logoImageURL);
    }

    // Perform all database operations in transaction
    // Delete all menu items
    for (const menuItem of menuItems) {
      await MenuItem.findByIdAndDelete(menuItem._id).session(mongoSession);
    }

    // Remove restaurant from user's ownedRestaurantIds
    await User.findByIdAndUpdate(
      session.user._id,
      { $pull: { ownedRestaurantIds: restaurantId } },
      { session: mongoSession }
    );

    // Delete the restaurant
    await RestaurantModel.findByIdAndDelete(restaurantId).session(mongoSession);

    // Commit the transaction
    await mongoSession.commitTransaction();

    // After successful transaction, clean up images
    const imageCleanupResults = await Promise.allSettled(
      imageUrlsToDelete.map((url) => cleanupCloudinaryImage(url))
    );

    // Check for any failed image deletions
    const failedImageDeletions = imageCleanupResults.filter(
      (result) => result.status === "rejected"
    );

    if (failedImageDeletions.length > 0) {
      console.error("⚠️ Some images failed to delete:", failedImageDeletions);
      return NextResponse.json(
        {
          success: true,
          message: "Restaurant deleted successfully.",
          warning: "Some images could not be deleted from storage.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Restaurant deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    await mongoSession.abortTransaction();
    console.error("❌ Delete restaurant error:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  } finally {
    mongoSession.endSession();
  }
}
