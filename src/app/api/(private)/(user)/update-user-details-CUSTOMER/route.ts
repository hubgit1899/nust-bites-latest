import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { customerDetailsSchema } from "@/schemas/customerDetailsSchema";

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json();
  const session = await getServerSession(authOptions);

  if (!session?.user?._id || !session.user.isVerified) {
    return NextResponse.json(
      { success: false, message: "Unauthorized or unverified user." },
      { status: 401 }
    );
  }

  const parsed = customerDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { fullName, phoneNumber } = parsed.data;

  try {
    // Update user details
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.user._id,
      {
        $set: {
          fullName,
          phoneNumber,
          isCustomer: true, // Set isCustomer to true when details are completed
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer details updated successfully.",
        sessionRevalidated: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating customer details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer details. Please try again.",
      },
      { status: 500 }
    );
  }
}
