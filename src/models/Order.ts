import mongoose, { Schema, Document, Types } from "mongoose";
import type { Location } from "@/types/location";

export interface Order extends Document {
  _id: { toString(): string };
  orderId: string;
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
    | "CANCELLED";
  restaurant: Types.ObjectId; // <- Changed to ObjectId
  pickupLocation: Location;
  pickupAddress: string;
  dropoffLocation: Location;
  dropoffAddress: string;
  distance: number;
  pickupTime: Date;
  dropoffTime: Date;
  orderAmount: number;
  deliveryFee: number;
  paymentSlipURL?: string;
  paymentStatus: "PAID" | "UNPAID" | "VERIFIED" | "REFUNDED";
  items: Item[];
  specialInstructions?: string;
  riderRating?: number;
  riderReview?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Item {
  menuItem: Types.ObjectId | any;
  name: string;
  basePrice: number;
  imageURL: string;
  category: string;
  options?: {
    optionHeader: string;
    selected: string;
    additionalPrice: number;
  }[];
  quantity: number; // Added
  restaurant?: Types.ObjectId | any;
}

const ItemSchema: Schema<Item> = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: "menuitems",
    required: true,
  },
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },

  imageURL: { type: String },
  category: { type: String },
  options: {
    type: [
      {
        optionHeader: { type: String, required: true },
        selected: { type: String, required: true },
        additionalPrice: { type: Number, required: true },
      },
    ],
    default: [],
  },
  quantity: { type: Number, required: true },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "restaurant",
  },
});

const OrderSchema: Schema<Order> = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
        "CANCELLED",
      ],
      default: "PENDING",
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "restaurant",
      required: true,
    },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    dropoffLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    distance: { type: Number, required: true },
    pickupTime: { type: Date },
    dropoffTime: { type: Date },
    orderAmount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    paymentSlipURL: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["PAID", "UNPAID", "VERIFIED", "REFUNDED"],
      default: "UNPAID",
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

const OrderModel =
  (mongoose.models.Order as mongoose.Model<Order>) ||
  mongoose.model<Order>("Order", OrderSchema);
export default OrderModel;
