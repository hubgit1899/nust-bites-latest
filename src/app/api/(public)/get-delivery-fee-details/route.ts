import {
  calculateDeliveryFeeDetailsFromDistance,
  DeliveryLocation,
  RestaurantLocation,
} from "@/lib/cartValidation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deliveryLocation, restaurantLocation } = body;

    if (!deliveryLocation || !restaurantLocation) {
      return NextResponse.json(
        { success: false, message: "Missing location data." },
        { status: 400 }
      );
    }

    try {
      const result = await calculateDeliveryFeeDetailsFromDistance(
        deliveryLocation as DeliveryLocation,
        restaurantLocation as RestaurantLocation
      );

      return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
      // Handle route calculation error
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to calculate delivery route. The selected location may be too far or not accessible.",
          error: error.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
