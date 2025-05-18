// lib/getBaseUrlFromRequest.ts
import { NextRequest } from "next/server";

export function getBaseUrlFromRequest(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
