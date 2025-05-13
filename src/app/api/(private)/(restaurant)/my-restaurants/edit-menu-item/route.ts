import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import { hasRestaurantAccess } from "@/lib/auth";
import { addMenuItemSchema } from "@/schemas/addMenuItemSchema";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import mongoose from "mongoose";
import {
  calculateMenuItemOnlineStatus,
  PlainRestaurant,
} from "@/lib/onlineStatus";

export async function PUT(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { _id, imageURL: newImageURL } = body || {};

  if (!session?.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!_id) {
    return NextResponse.json(
      { success: false, message: "Menu item ID is required" },
      { status: 400 }
    );
  }

  // Create a partial schema for updates
  const updateMenuItemSchema = addMenuItemSchema.partial();
  const parsed = updateMenuItemSchema.safeParse(body);

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
    // First find the menu item to get its restaurant
    const existingMenuItem = await MenuItem.findById(_id).session(mongoSession);

    if (!existingMenuItem) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    // Get the restaurant to check access
    const restaurant = await RestaurantModel.findById(
      existingMenuItem.restaurant
    ).session(mongoSession);

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

    // If there's a new image URL and it's different from the existing one,
    // clean up the old image
    if (newImageURL && newImageURL !== existingMenuItem.imageURL) {
      await cleanupCloudinaryImage(existingMenuItem.imageURL);
    }

    // Update the menu item
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      _id,
      { $set: parsed.data },
      { session: mongoSession, new: true }
    );

    if (!updatedMenuItem) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Failed to update menu item" },
        { status: 500 }
      );
    }

    // Convert restaurant to plain object and ensure menu is an empty array
    const plainRestaurant: PlainRestaurant = {
      ...JSON.parse(JSON.stringify(restaurant)),
      menu: [],
    };

    // Calculate online status for the updated item
    const menuItemsWithStatus = calculateMenuItemOnlineStatus(
      [updatedMenuItem.toObject()],
      plainRestaurant
    );

    if (
      !Array.isArray(menuItemsWithStatus) ||
      menuItemsWithStatus.length === 0
    ) {
      throw new Error("Failed to calculate menu item status");
    }

    // Commit the transaction
    await mongoSession.commitTransaction();

    return NextResponse.json(
      {
        success: true,
        message: "Menu item updated successfully",
        menuItem: menuItemsWithStatus[0],
      },
      { status: 200 }
    );
  } catch (error) {
    // Abort the transaction on error
    await mongoSession.abortTransaction();
    console.error("❌ Error updating menu item:", error);

    // If we have a new image URL and the update failed, clean it up
    if (newImageURL) {
      await cleanupCloudinaryImage(newImageURL);
    }

    return NextResponse.json(
      { success: false, message: "Failed to update menu item" },
      { status: 500 }
    );
  } finally {
    // End the session
    mongoSession.endSession();
  }
}
