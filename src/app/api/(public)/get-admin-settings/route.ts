import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/getAdminSettings";

export async function GET() {
  const data = await getAdminSettings();
  return NextResponse.json(data);
}
