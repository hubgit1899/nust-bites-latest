import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/models/Order";
import RestaurantModel from "@/models/Restaurant";
import { errorMessages } from "@/app/constants/errorMessages";

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.isVerified) {
    return NextResponse.json(
      { success: false, message: errorMessages.USER_NOT_VERIFIED },
      { status: 401 }
    );
  }

  if (!session?.user?.isCustomer) {
    return NextResponse.json(
      { success: false, message: errorMessages.USER_NOT_CUSTOMER },
      { status: 401 }
    );
  }

  try {
    // Find active orders (not delivered or cancelled)
    const orders = await OrderModel.find({
      customer: session.user._id,
      status: { $nin: ["DELIVERED", "CANCELLED"] },
    })
      .populate({
        path: "restaurant",
        select: "name accentColor",
        model: RestaurantModel,
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => {
        const orderObj = order.toObject();
        return {
          orderId: orderObj.orderId,
          status: orderObj.status,
          orderAmount: orderObj.orderAmount,
          deliveryFee: orderObj.deliveryFee,
          items: orderObj.items,
          dropoffLocation: orderObj.dropoffLocation,
          createdAt: orderObj.createdAt,
          restaurant: orderObj.restaurant,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch active orders" },
      { status: 500 }
    );
  }
}
