import mongoose, { Schema, Document, Types } from "mongoose";
import type { Location } from "@/types/location";

export interface Restaurant extends Document {
  name: string;
  logoImageURL: string;
  accentColor: string;
  orderCode: string;
  location: Location;
  online: boolean;
  onlineTime: {
    start: number;
    end: number;
  };
  orders: Types.ObjectId[]; // <- Changed to ObjectId[]
  owner: Types.ObjectId; // <- Changed to ObjectId
  menu: Types.ObjectId[]; // <- Changed to ObjectId[]
  isVerified: boolean;
  rating: number;
  ratingCount: number;
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
    online: { type: Boolean, default: false },
    onlineTime: {
      start: { type: Number, required: true },
      end: { type: Number, required: true },
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    menu: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const RestaurantModel =
  (mongoose.models.Restaurant as mongoose.Model<Restaurant>) ||
  mongoose.model<Restaurant>("Restaurant", RestaurantSchema);
export default RestaurantModel;
