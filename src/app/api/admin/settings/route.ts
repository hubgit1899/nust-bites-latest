import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import AdminSettingsModel from "@/models/AdminSettings";
import { revalidateTag } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin only." },
        { status: 403 }
      );
    }
    await dbConnect();
    const settings = await AdminSettingsModel.findOne().lean();
    return NextResponse.json({
      success: true,
      settings: {
        baseDeliveryFee: settings?.baseDeliveryFee ?? 75,
        deliveryFeePerKm: settings?.deliveryFeePerKm ?? 25,
        darkTheme: settings?.darkTheme ?? "dark",
        lightTheme: settings?.lightTheme ?? "light",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin only." },
        { status: 403 }
      );
    }
    const { baseDeliveryFee, deliveryFeePerKm, darkTheme, lightTheme } =
      await request.json();
    if (
      typeof baseDeliveryFee !== "number" ||
      typeof deliveryFeePerKm !== "number" ||
      typeof darkTheme !== "string" ||
      typeof lightTheme !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 }
      );
    }
    if (baseDeliveryFee < 0 || deliveryFeePerKm < 0) {
      return NextResponse.json(
        { success: false, message: "Fees cannot be negative" },
        { status: 400 }
      );
    }
    await dbConnect();
    const settings = await AdminSettingsModel.findOneAndUpdate(
      {},
      { baseDeliveryFee, deliveryFeePerKm, darkTheme, lightTheme },
      { new: true, upsert: true }
    );
    revalidateTag("admin-settings");
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update admin settings" },
      { status: 500 }
    );
  }
}
