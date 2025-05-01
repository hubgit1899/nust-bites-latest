import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RestaurantModel from "@/models/Restaurant";
import { addRestaurantSchema } from "@/schemas/addRestaurantSchema";
import { sendRestaurantSubmissionEmail } from "@/helpers/sendNewRestaurantAddedEmail";
import UserModel from "@/models/User";
import extractPublicId from "@/helpers/extractPublicId";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json();

  // Get logoImageURL first to extract publicId
  const { logoImageURL } = body || {};
  const publicId = logoImageURL ? extractPublicId(logoImageURL) : null;

  const session = await getServerSession(authOptions);
  if (!session?.user?.isVerified) {
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
    return NextResponse.json(
      { success: false, message: "Unauthorized or unverified user." },
      { status: 401 }
    );
  }

  const { email, username, _id } = session.user;

  const parsed = addRestaurantSchema.safeParse(body);
  if (!parsed.success) {
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
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
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
    return NextResponse.json(
      { success: false, message: "Order code already in use." },
      { status: 400 }
    );
  }

  const user = await UserModel.findById(_id).populate("ownedRestaurantIds");

  if (!user || user.maxOwnedRestaurants === undefined) {
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
    return NextResponse.json(
      {
        success: false,
        message:
          "User configuration incomplete. Cannot determine restaurant ownership limit.",
      },
      { status: 500 }
    );
  }

  if (user.ownedRestaurantIds.length >= user.maxOwnedRestaurants) {
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
    return NextResponse.json(
      {
        success: false,
        message: `You can only own a maximum of ${user.maxOwnedRestaurants} restaurants.`,
      },
      { status: 400 }
    );
  }

  // Create restaurant first
  const restaurant = new RestaurantModel({
    name,
    logoImageURL,
    accentColor,
    orderCode,
    location,
    onlineTime,
    owner: _id,
  });

  try {
    await restaurant.save();

    // Update user to add ownership
    user!.isRestaurantOwner = true;
    if (user && restaurant._id) {
      user.ownedRestaurantIds.push(
        restaurant._id as (typeof user.ownedRestaurantIds)[0]
      );
    }
    await user!.save();
  } catch (err) {
    console.error("❌ Failed to update user, rolling back restaurant:", err);
    await RestaurantModel.findByIdAndDelete(restaurant._id); // Rollback
    if (publicId) await deleteCloudinaryImage(publicId); // Cleanup
    return NextResponse.json(
      {
        success: false,
        message: "Failed to finalize restaurant creation. Please try again.",
      },
      { status: 500 }
    );
  }

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
    },
    { status: 201 }
  );
}
