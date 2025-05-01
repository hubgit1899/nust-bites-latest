import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { User } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !session.user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  // Connect to the database
  await dbConnect();

  const userId = user._id;
  const { riderAvailable } = await request.json();

  try {
    // Update the user's rider availabilty status
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isRiderAvailable: riderAvailable },
      { new: true }
    );

    if (!updatedUser) {
      // User not found
      return Response.json(
        {
          success: false,
          message: "Unable to find user to update rider availabilty status",
        },
        { status: 404 }
      );
    }

    // Successfully updated rider availabilty status
    return Response.json(
      {
        success: true,
        message: "rider availabilty status updated successfully",
        updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating rider availabilty status:", error);
    return Response.json(
      { success: false, message: "Error updating rider availabilty status" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Get the user session
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Check if the user is authenticated
  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  // Connect to the database
  await dbConnect();

  try {
    // Retrieve the user from the database using the ID
    const foundUser = await UserModel.findById(user._id);

    if (!foundUser) {
      // User not found
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return the user's rider availabilty status
    return Response.json(
      {
        success: true,
        isRiderAvailable: foundUser.isRiderAvailable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving rider availabilty status:", error);
    return Response.json(
      { success: false, message: "Error retrieving rider availabilty status" },
      { status: 500 }
    );
  }
}
