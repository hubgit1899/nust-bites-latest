import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.isVerified) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // ✅ Read the preset from frontend body
  const { uploadPreset } = await req.json();

  if (!uploadPreset) {
    return NextResponse.json(
      { success: false, message: "Upload preset is required" },
      { status: 400 }
    );
  }

  // Only allow specific safe presets (extra protection)
  const allowedPresets = ["restaurants-logos", "another-preset"];
  if (!allowedPresets.includes(uploadPreset)) {
    return NextResponse.json(
      { success: false, message: "Invalid upload preset" },
      { status: 400 }
    );
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      upload_preset: uploadPreset, // dynamic from frontend
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    success: true,
    signature,
    timestamp,
    uploadPreset,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
