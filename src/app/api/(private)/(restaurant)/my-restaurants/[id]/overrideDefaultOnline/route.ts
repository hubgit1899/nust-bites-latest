import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { hasRestaurantAccess } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Already destructured
  await dbConnect();
  const session = await getServerSession(authOptions);

  const user = session?.user;
  if (!user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { override } = await req.json(); // -1 | 1 | 0

  try {
    const restaurant = await RestaurantModel.findById(params.id);
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
    console.log("Updated restaurant:", updatedRestaurant);

    return NextResponse.json({ success: true, restaurant: updatedRestaurant });
  } catch (error) {
    console.error("Error updating override:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update override" },
      { status: 500 }
    );
  }
}
