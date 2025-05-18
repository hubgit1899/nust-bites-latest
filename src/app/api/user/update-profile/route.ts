import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { errorMessages } from "@/app/constants/errorMessages";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.isVerified) {
    return NextResponse.json(
      { success: false, message: errorMessages.USER_NOT_VERIFIED },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      username,
      email,
      fullName,
      phoneNumber,
      isUniStudent,
      university,
      studentId,
      isHostelite,
      hostelName,
      roomNumber,
    } = body;

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: "Username and email are required" },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = await UserModel.findOne({
      username,
      _id: { $ne: session.user._id },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Username is already taken" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingEmail = await UserModel.findOne({
      email,
      _id: { $ne: session.user._id },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email is already taken" },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.user._id,
      {
        username,
        email,
        fullName,
        phoneNumber,
        isUniStudent,
        university,
        studentId,
        isHostelite,
        hostelName,
        roomNumber,
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        isUniStudent: updatedUser.isUniStudent,
        university: updatedUser.university,
        studentId: updatedUser.studentId,
        isHostelite: updatedUser.isHostelite,
        hostelName: updatedUser.hostelName,
        roomNumber: updatedUser.roomNumber,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
