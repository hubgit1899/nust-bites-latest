import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { checkoutSchema } from "@/schemas/checkoutSchema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorMessages } from "@/app/constants/errorMessages";
import { validateCart } from "@/lib/cartValidation";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
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

    // Validate request body
    const parsedResult = checkoutSchema.safeParse(body);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: errorMessages.INVALID_FORM_DATA,
          errors: parsedResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { restaurantId, items, deliveryLocation } = parsedResult.data;

    // Use the modular cart validation function
    const validationResult = await validateCart(
      items,
      restaurantId,
      deliveryLocation
    );

    // Return the validation result
    if (!validationResult.success) {
      // If validation failed because of invalid items
      if (validationResult.removedItems) {
        return NextResponse.json({
          success: false,
          message: validationResult.message,
          removedItems: validationResult.removedItems,
        });
      }

      // If validation failed for other reasons (restaurant offline, etc.)
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 }
      );
    }

    // Return successful validation result
    return NextResponse.json({
      success: true,
      message: validationResult.message,
      verifiedItems: validationResult.verifiedItems,
      deliveryFeeDetails: validationResult.deliveryFeeDetails,
    });
  } catch (error) {
    console.error("Checkout verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify checkout" },
      { status: 500 }
    );
  }
}
