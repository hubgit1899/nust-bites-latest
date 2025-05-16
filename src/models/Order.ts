import mongoose, { Schema, Document, Types } from "mongoose";
import { getNextSequence } from "@/helpers/getNextSequence";
import type { Location } from "@/types/location";
import ItemSchema from "./ItemSchema";

export interface Order extends Document {
  _id: { toString(): string };
  orderId: number;
  customer: Types.ObjectId; // <- Changed to ObjectId
  rider: Types.ObjectId; // <- Changed to ObjectId
  status:
    | "PENDING"
    | "PLACED"
    | "ACCEPTED"
    | "EN ROUTE A"
    | "PICKED UP"
    | "EN ROUTE B"
    | "DELIVERED"
    | "REFUNDED"
    | "CANCELLED";
  restaurant: Types.ObjectId; // <- Changed to ObjectId
  pickupLocation: Location;
  pickupAddress: string;
  dropoffLocation: Location;
  dropoffAddress: string;
  pickupTime: Date;
  dropoffTime: Date;
  totalAmount: number;
  deliveryFee: number;
  paymentStatus: "paid" | "unpaid";
  items: Item[]; // TS interface (not enforced by schema)
  specialInstructions?: string;
  riderRating?: number;
  riderReview?: string;
}
export interface Item {
  menuItemId: number;
  name: string;
  basePrice: number;
  imageURL: string;
  category: string;
  options?: {
    optionHeader: string;
    selected: string;
    additionalPrice: number;
  }[];
}

const OrderSchema: Schema<Order> = new Schema(
  {
    orderId: { type: Number, required: true, unique: true },
    customer: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    rider: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PLACED",
        "ACCEPTED",
        "EN ROUTE A",
        "PICKED UP",
        "EN ROUTE B",
        "DELIVERED",
        "REFUNDED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    restaurant: [
      { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    ],
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      required: true,
    },
    pickupAddress: { type: String, required: true },
    dropoffLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      required: true,
    },
    dropoffAddress: { type: String, required: true },
    pickupTime: { type: Date, required: true },
    dropoffTime: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      required: true,
    },
    items: {
      type: [ItemSchema],
      required: true,
    },
    specialInstructions: { type: String, default: "" },
    riderRating: { type: Number, default: null },
    riderReview: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Auto-increment orderId
OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.orderId = await getNextSequence("orderId");
  }
  next();
});

const OrderModel =
  (mongoose.models.Order as mongoose.Model<Order>) ||
  mongoose.model<Order>("Order", OrderSchema);
export default OrderModel;
