// lib/getAdminSettings.ts
import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import AdminSettingsModel from "@/models/AdminSettings";

export const getAdminSettings = unstable_cache(
  async () => {
    await dbConnect();
    const settings = await AdminSettingsModel.findOne().lean();

    return {
      baseDeliveryFee: settings?.baseDeliveryFee ?? 75,
      deliveryFeePerKm: settings?.deliveryFeePerKm ?? 25,
      lightTheme: settings?.lightTheme ?? "default",
      darkTheme: settings?.darkTheme ?? "default",
    };
  },
  ["admin-settings"],
  { revalidate: 600, tags: ["admin-settings"] } // 10 minutes
);
