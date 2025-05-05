import mongoose, { Schema, Document, Types } from "mongoose";
import type { Location } from "@/types/location";

export interface Restaurant extends Document {
  name: string;
  logoImageURL: string;
  accentColor: string;
  orderCode: string;
  location: Location;
  onlineTime: {
    start: number;
    end: number;
  };
  forceOnlineOverride: boolean | null;
  orders: Types.ObjectId[];
  owner: Types.ObjectId;
  menu: Types.ObjectId[];
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  online?: boolean; // virtual
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
    forceOnlineOverride: { type: Boolean, default: null },
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
  if (this.forceOnlineOverride !== null) return this.forceOnlineOverride;

  if (!this.onlineTime) return false;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const { start, end } = this.onlineTime;

  if (start <= end) {
    return minutesNow >= start && minutesNow < end;
  } else {
    return minutesNow >= start || minutesNow < end;
  }
});

const RestaurantModel =
  (mongoose.models.Restaurant as mongoose.Model<Restaurant>) ||
  mongoose.model<Restaurant>("Restaurant", RestaurantSchema);

export default RestaurantModel;
