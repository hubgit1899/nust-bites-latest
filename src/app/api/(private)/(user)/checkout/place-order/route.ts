import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/models/Order";
import RestaurantModel from "@/models/Restaurant";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";
import { validateCart } from "@/lib/cartValidation";
import { getNextSequence } from "@/helpers/getNextSequence";
import mongoose from "mongoose";
import { errorMessages } from "@/app/constants/errorMessages";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  // Check if user is authenticated and verified
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

  let body;
  try {
    body = await req.json();
    const {
      restaurantId,
      items,
      deliveryLocation,
      specialInstructions,
      paymentSlipURL,
    } = body;

    // Validate required fields
    if (!restaurantId || !items || !deliveryLocation) {
      if (paymentSlipURL) await cleanupCloudinaryImage(paymentSlipURL);
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Get restaurant details
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      if (paymentSlipURL) await cleanupCloudinaryImage(paymentSlipURL);
      return NextResponse.json(
        { success: false, message: "Restaurant not found." },
        { status: 404 }
      );
    }

    // Validate items
    const validationData = await validateCart(
      items,
      restaurantId,
      deliveryLocation
    );

    if (!validationData.success) {
      if (paymentSlipURL) await cleanupCloudinaryImage(paymentSlipURL);
      return NextResponse.json(
        {
          success: false,
          message: validationData.message,
          removedItems: validationData.removedItems,
        },
        { status: 400 }
      );
    }

    // Ensure verifiedOrderItems exists
    if (
      !validationData.verifiedOrderItems ||
      validationData.verifiedOrderItems.length === 0
    ) {
      if (paymentSlipURL) await cleanupCloudinaryImage(paymentSlipURL);
      return NextResponse.json(
        {
          success: false,
          message: "No valid items found in the order.",
        },
        { status: 400 }
      );
    }

    // Calculate order amount (total of all items including options)
    const orderAmount = validationData.verifiedOrderItems!.reduce(
      (total, item) => {
        let itemTotal = item.basePrice * item.quantity;

        // Add option prices if present
        if (item.options && item.options.length > 0) {
          const optionsTotal = item.options.reduce(
            (sum: number, option: { additionalPrice: number }) =>
              sum + option.additionalPrice,
            0
          );
          itemTotal += optionsTotal * item.quantity;
        }

        return total + itemTotal;
      },
      0
    );

    const nextSequence = await getNextSequence("orderId");
    // Generate orderId
    const orderId = `${restaurant.orderCode}-${nextSequence}`;

    // Create order data object that matches the schema exactly
    const orderData = {
      orderId,
      customer: new mongoose.Types.ObjectId(session.user._id),
      restaurant: validationData.restaurantId,
      status: "PENDING" as const,
      pickupLocation: {
        lat: restaurant.location.lat,
        lng: restaurant.location.lng,
        address: restaurant.location.address,
      },
      dropoffLocation: {
        lat: deliveryLocation.lat,
        lng: deliveryLocation.lng,
        address: deliveryLocation.address,
      },
      distance: validationData.deliveryFeeDetails?.distance || 0,
      orderAmount: orderAmount,
      deliveryFee: validationData.deliveryFeeDetails?.deliveryFee || 0,
      paymentSlipURL: paymentSlipURL || "",
      paymentStatus: "UNPAID" as const,
      items: validationData.verifiedOrderItems!,
      specialInstructions: specialInstructions || "",
    };

    // Create and save the order
    const order = new OrderModel(orderData);
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);

    if (body?.paymentSlipURL) {
      await cleanupCloudinaryImage(body.paymentSlipURL);
    }
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
