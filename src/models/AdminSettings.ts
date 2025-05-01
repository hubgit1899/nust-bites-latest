import mongoose, { Schema, Document } from "mongoose";

export interface AdminSettings extends Document {
  baseDeliveryFee: number;
  deliveryFeePerKm: number;
  darkTheme: string;
  lightTheme: string;
}

const AdminSettingsSchema: Schema<AdminSettings> = new Schema(
  {
    baseDeliveryFee: { type: Number, required: true },
    deliveryFeePerKm: { type: Number, required: true },
    darkTheme: { type: String },
    lightTheme: { type: String },
  },
  {
    timestamps: true,
  }
);

const AdminSettingsModel =
  (mongoose.models.AdminSettings as mongoose.Model<AdminSettings>) ||
  mongoose.model<AdminSettings>("AdminSettings", AdminSettingsSchema);
export default AdminSettingsModel;
