import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import cloudinary from "@/lib/cloudinary";

interface UploadRequestBody {
  uploadPreset?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isVerified) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await req.json()) as UploadRequestBody;
  const { uploadPreset } = body;

  if (!uploadPreset) {
    return NextResponse.json(
      { success: false, message: "Upload preset is required" },
      { status: 400 }
    );
  }

  const allowedPresets =
    process.env.ALLOWED_UPLOAD_PRESETS?.split(",").map((preset) =>
      preset.trim()
    ) ?? [];
  if (!allowedPresets.includes(uploadPreset)) {
    return NextResponse.json(
      { success: false, message: "Invalid upload preset" },
      { status: 400 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, upload_preset: uploadPreset },
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
