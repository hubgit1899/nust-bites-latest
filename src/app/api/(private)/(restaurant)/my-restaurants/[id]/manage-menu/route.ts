import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import MenuItem, { MenuItem as MenuItemType } from "@/models/MenuItem";
import { hasRestaurantAccess } from "@/lib/auth";
import { addMenuItemSchema } from "@/schemas/addMenuItemSchema";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import mongoose from "mongoose";
import { calculateMenuItemOnlineStatus } from "@/lib/onlineStatus";

export async function GET(request: NextRequest) {
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

  try {
    const results = await RestaurantModel.aggregate([
      // Match the restaurant by ID
      { $match: { _id: new mongoose.Types.ObjectId(restaurantId) } },
      // Lookup related menu items
      {
        $lookup: {
          from: "menuitems", // The collection name in MongoDB
          localField: "_id",
          foreignField: "restaurant",
          as: "menuItems",
        },
      },
      // Sort the menu items by category and name
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

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    const restaurant = results[0];

    // Check access after fetching the data
    if (!hasRestaurantAccess(session.user, restaurant.owner)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Calculate the online status for each menu item
    const menuItems = calculateMenuItemOnlineStatus(
      restaurant.menuItems,
      restaurant
    );

    console.log("✅ Fetched menu items successfully:", menuItems);

    return NextResponse.json(
      {
        success: true,
        menuItems,
        restaurant: { ...restaurant, menuItems: undefined },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching menu items:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const restaurantId = segments[segments.indexOf("my-restaurants") + 1];
  const body = await request.json();
  const { logoImageURL } = body || {};

  if (!session?.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const parsed = addMenuItemSchema.safeParse(body);
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
    // First verify restaurant exists and user has access
    const restaurant =
      await RestaurantModel.findById(restaurantId).session(mongoSession);

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

    // Create and save the menu item within the transaction
    const menuItem = new MenuItem({
      ...parsed.data,
      restaurant: restaurant._id,
    });
    await menuItem.save({ session: mongoSession });

    // Update the restaurant using findOneAndUpdate to avoid race conditions
    await RestaurantModel.findByIdAndUpdate(
      restaurantId,
      { $push: { menu: menuItem._id } },
      { session: mongoSession, new: true }
    );

    // Commit the transaction
    await mongoSession.commitTransaction();

    return NextResponse.json(
      { success: true, message: "Menu item added successfully", menuItem },
      { status: 201 }
    );
  } catch (error) {
    // Abort the transaction on error
    await mongoSession.abortTransaction();
    console.error("❌ Error adding menu item:", error);
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL); // Cleanup
    return NextResponse.json(
      { success: false, message: "Failed to add menu item" },
      { status: 500 }
    );
  } finally {
    // End the session
    mongoSession.endSession();
  }
}
