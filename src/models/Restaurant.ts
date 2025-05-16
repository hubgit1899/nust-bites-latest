import mongoose, { Schema, Document, Types } from "mongoose";
import type { Location } from "@/types/location";
import { getCurrentMinutesInPakistan } from "@/helpers/localTime";

export interface Restaurant extends Document {
  _id: { toString(): string };
  name: string;
  logoImageURL: string;
  accentColor: string;
  orderCode: string;
  location: Location;
  onlineTime: {
    start: number;
    end: number;
  };
  forceOnlineOverride: number;
  orders: Types.ObjectId[];
  owner: Types.ObjectId;
  menu: Types.ObjectId[];
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  online?: boolean; // virtual

  createdAt?: Date;
  updatedAt?: Date;
}

const RestaurantSchema: Schema<Restaurant> = new Schema(
  {
    name: { type: String, required: true },
    logoImageURL: { type: String, required: true },
    accentColor: { type: String, required: true },
    orderCode: { type: String, required: true, unique: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    onlineTime: {
      start: { type: Number, required: true }, // minutes from midnight
      end: { type: Number, required: true },
    },
    forceOnlineOverride: { type: Number, default: 0 }, // 0: null, 1: true, -1: false
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    menu: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for dynamic "online" value
RestaurantSchema.virtual("online").get(function (this: any) {
  // Force override takes precedence
  if (this.forceOnlineOverride !== 0) {
    return this.forceOnlineOverride === 1;
  }

  // Not verified restaurants are never online
  if (this.isVerified === false) return false;
  if (!this.onlineTime) return false;

  // Get current time specifically in Pakistan timezone
  const minutesNow = getCurrentMinutesInPakistan();
  const { start, end } = this.onlineTime;

  // Handle overnight time ranges (when start > end)
  if (start > end) {
    // For overnight periods (e.g., 11:00 AM to 2:00 AM)
    return minutesNow >= start || minutesNow < end;
  } else {
    // For same-day periods (e.g., 8:00 AM to 8:00 PM)
    return minutesNow >= start && minutesNow < end;
  }
});

const RestaurantModel =
  (mongoose.models.Restaurant as mongoose.Model<Restaurant>) ||
  mongoose.model<Restaurant>("Restaurant", RestaurantSchema);

export default RestaurantModel;
