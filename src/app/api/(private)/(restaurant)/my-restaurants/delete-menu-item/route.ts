import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import { hasRestaurantAccess } from "@/lib/auth";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import mongoose from "mongoose";
import { revalidateTag } from "next/cache";

export async function DELETE(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const menuItemId = searchParams.get("id");

  if (!session?.user?._id || !session.user.isVerified) {
    return NextResponse.json(
      { success: false, message: "Unauthorized or unverified user." },
      { status: 401 }
    );
  }

  if (!menuItemId) {
    return NextResponse.json(
      { success: false, message: "Menu item ID is required." },
      { status: 400 }
    );
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Get the menu item and its restaurant
    const menuItem = await MenuItem.findById(menuItemId).session(mongoSession);

    if (!menuItem) {
      throw new Error("Menu item not found.");
    }

    const restaurant = await RestaurantModel.findById(
      menuItem.restaurant
    ).session(mongoSession);

    if (!restaurant) {
      throw new Error("Associated restaurant not found.");
    }

    if (!hasRestaurantAccess(session.user, restaurant.owner)) {
      throw new Error("You do not have permission to modify this restaurant.");
    }

    // Remove menu item reference from the restaurant
    await RestaurantModel.findByIdAndUpdate(
      restaurant._id,
      { $pull: { menu: menuItemId } },
      { session: mongoSession }
    );

    // Delete the menu item itself
    await MenuItem.findByIdAndDelete(menuItemId).session(mongoSession);

    // Clean up Cloudinary image
    if (menuItem.imageURL) {
      try {
        await cleanupCloudinaryImage(menuItem.imageURL);
      } catch (cloudErr) {
        console.error("⚠️ Failed to delete image from Cloudinary:", cloudErr);
        // Still commit transaction, just warn in response
        await mongoSession.commitTransaction();
        return NextResponse.json(
          {
            success: true,
            message:
              "Menu item deleted, but failed to delete image from Cloudinary.",
            warning: "Image cleanup failed",
          },
          { status: 200 }
        );
      }
    }

    await mongoSession.commitTransaction();

    // Revalidate the cache for the restaurant
    revalidateTag(`restaurant-menu-${menuItem.restaurant}`);
    revalidateTag(`restaurant-status-${menuItem.restaurant}`);

    return NextResponse.json(
      { success: true, message: "Menu item deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    await mongoSession.abortTransaction();
    console.error("❌ Delete menu item error:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  } finally {
    mongoSession.endSession();
  }
}
