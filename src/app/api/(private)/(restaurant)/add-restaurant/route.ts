import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { addRestaurantSchema } from "@/schemas/addRestaurantSchema";
import { sendRestaurantSubmissionEmail } from "@/helpers/sendNewRestaurantAddedEmail";
import UserModel from "@/models/User";
import { cleanupCloudinaryImage } from "@/helpers/cleanupCloudinaryImage";

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json();
  const { logoImageURL } = body || {};

  const session = await getServerSession(authOptions);
  if (!session?.user?.isVerified) {
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);
    return NextResponse.json(
      { success: false, message: "Unauthorized or unverified user." },
      { status: 401 }
    );
  }

  const { email, username, _id } = session.user;

  const parsed = addRestaurantSchema.safeParse(body);
  if (!parsed.success) {
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, accentColor, orderCode, location, onlineTime } = parsed.data;

  // Check order code uniqueness
  const existing = await RestaurantModel.findOne({ orderCode });
  if (existing) {
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);
    return NextResponse.json(
      { success: false, message: "Order code already in use." },
      { status: 400 }
    );
  }

  // Check user restaurant limits using aggregation
  const userAggregation = await UserModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(_id) } },
    {
      $lookup: {
        from: "restaurants",
        localField: "ownedRestaurantIds",
        foreignField: "_id",
        as: "ownedRestaurants",
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        maxOwnedRestaurants: 1,
        isRestaurantOwner: 1,
        currentOwnedCount: { $size: "$ownedRestaurants" },
      },
    },
  ]);

  const user = userAggregation[0];

  if (!user || user.maxOwnedRestaurants === undefined) {
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);
    return NextResponse.json(
      {
        success: false,
        message:
          "User configuration incomplete. Cannot determine restaurant ownership limit.",
      },
      { status: 500 }
    );
  }

  if (user.currentOwnedCount >= user.maxOwnedRestaurants) {
    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);
    return NextResponse.json(
      {
        success: false,
        message: `You can only own a maximum of ${user.maxOwnedRestaurants} restaurants.`,
      },
      { status: 400 }
    );
  }

  // Start a session for transaction
  const session2 = await mongoose.startSession();
  session2.startTransaction();

  try {
    // Create restaurant
    const restaurant = new RestaurantModel({
      name,
      logoImageURL,
      accentColor,
      orderCode,
      location,
      onlineTime,
      owner: _id,
    });

    // Save restaurant within transaction
    await restaurant.save({ session: session2 });

    // Update user using updateOne to add restaurant ID and set isRestaurantOwner to true
    const wasRestaurantOwner = user.isRestaurantOwner;

    await UserModel.updateOne(
      { _id: user._id },
      {
        $push: { ownedRestaurantIds: restaurant._id },
        $set: { isRestaurantOwner: true },
      },
      { session: session2 }
    );

    // Commit the transaction
    await session2.commitTransaction();
    session2.endSession();

    if (!email || !username) {
      return NextResponse.json(
        {
          success: false,
          message: "User email or username is missing.",
        },
        { status: 400 }
      );
    }

    const emailRes = await sendRestaurantSubmissionEmail(email, username, {
      name: restaurant.name!,
      orderCode: restaurant.orderCode!,
      address: restaurant.location!.address || "Address not provided",
      city: restaurant.location!.city || "City not provided",
      accentColor: restaurant.accentColor!,
    });

    if (!emailRes.success) {
      return NextResponse.json(
        {
          success: false,
          message: emailRes.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${restaurant.name} added successfully.`,
        restaurant,
        sessionRevalidated: !wasRestaurantOwner,
      },
      { status: 201 }
    );
  } catch (error) {
    // Abort transaction in case of error
    await session2.abortTransaction();
    session2.endSession();

    console.error("❌ Error during restaurant creation transaction:", error);

    if (logoImageURL) await cleanupCloudinaryImage(logoImageURL);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create restaurant. Please try again.",
      },
      { status: 500 }
    );
  }
}
