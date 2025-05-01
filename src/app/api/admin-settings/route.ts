import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AdminSettingsModel from "@/models/AdminSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

import { getAdminSettings } from "@/lib/getAdminSettings";
import { revalidateTag } from "next/cache";

export async function GET() {
  const data = await getAdminSettings();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    // Step 1: Authenticate the user
    const session = await getServerSession(authOptions);

    // Step 2: Check if user is authenticated and has admin role
    if (!session || !session.user.isSuperAdmin) {
      return NextResponse.json(
        { message: "Unauthorized. Super Admin only." },
        { status: 403 } // Forbidden
      );
    }

    // Step 3: Proceed with settings update if user is admin
    const { baseDeliveryFee, deliveryFeePerKm, lightTheme, darkTheme } =
      await request.json();

    await dbConnect();

    const settings = await AdminSettingsModel.findOneAndUpdate(
      {},
      {
        baseDeliveryFee,
        deliveryFeePerKm,
        lightTheme,
        darkTheme,
      },
      { new: true, upsert: true }
    );

    revalidateTag("admin-settings");
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
