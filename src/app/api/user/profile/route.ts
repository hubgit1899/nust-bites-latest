import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { errorMessages } from "@/app/constants/errorMessages";

export async function GET() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.isVerified) {
    return NextResponse.json(
      { success: false, message: errorMessages.USER_NOT_VERIFIED },
      { status: 401 }
    );
  }

  try {
    const user = await UserModel.findById(session.user._id).select(
      "username email fullName phoneNumber isUniStudent university studentId isHostelite hostelName roomNumber"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        isUniStudent: user.isUniStudent,
        university: user.university,
        studentId: user.studentId,
        isHostelite: user.isHostelite,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
