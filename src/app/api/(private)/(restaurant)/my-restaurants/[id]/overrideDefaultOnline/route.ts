import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { hasRestaurantAccess } from "@/lib/auth";
import { revalidateTag } from "next/cache";

// Next.js 15 expects this exact type signature
export async function PATCH(request: NextRequest) {
  // Extract the ID from the URL instead of using params
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.indexOf("my-restaurants") + 1];

  await dbConnect();

  const session = await getServerSession(authOptions);

  const user = session?.user;
  if (!user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { override } = await request.json(); // -1 | 1 | 0

  try {
    const restaurant = await RestaurantModel.findById(id);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!hasRestaurantAccess(user, restaurant.owner)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    restaurant.forceOnlineOverride = override;
    await restaurant.save();

    const updatedRestaurant = restaurant.toObject({ virtuals: true });
    // Revalidate the cache for restaurants
    revalidateTag("verified-restaurants");

    return NextResponse.json({ success: true, restaurant: updatedRestaurant });
  } catch (error) {
    console.error("Error updating override:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update override" },
      { status: 500 }
    );
  }
}
