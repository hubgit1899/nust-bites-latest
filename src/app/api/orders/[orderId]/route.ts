import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/models/Order";
import RestaurantModel from "@/models/Restaurant";
import { errorMessages } from "@/app/constants/errorMessages";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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
    const order = await OrderModel.findOne({
      orderId: params.orderId,
      customer: session.user._id,
    }).populate({
      path: "restaurant",
      select: "name accentColor",
      model: RestaurantModel,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Convert the order to a plain object to access timestamps
    const orderObj = order.toObject();

    return NextResponse.json({
      success: true,
      order: {
        orderId: orderObj.orderId,
        status: orderObj.status,
        orderAmount: orderObj.orderAmount,
        deliveryFee: orderObj.deliveryFee,
        items: orderObj.items,
        dropoffLocation: orderObj.dropoffLocation,
        createdAt: orderObj.createdAt,
        restaurant: orderObj.restaurant,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
