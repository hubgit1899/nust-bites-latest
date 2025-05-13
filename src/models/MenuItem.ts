import { getCurrentMinutesInPakistan } from "@/helpers/localTime";
import mongoose, { Schema, Document, Types } from "mongoose";
import autopopulate from "mongoose-autopopulate";

export interface MenuOption {
  optionHeader: string;
  name: string[];
  additionalPrice: number[];
  required: boolean;
}

export interface MenuItem extends Document {
  name: string;
  description: string;
  basePrice: number;
  imageURL: string;
  category: string;
  options?: MenuOption[];
  restaurant: Types.ObjectId | any;
  available: boolean;
  forceOnlineOverride: boolean;
  onlineTime?: {
    start: number;
    end: number;
  };
  online?: boolean; // virtual
}

const MenuOptionSchema: Schema<MenuOption> = new Schema({
  optionHeader: { type: String, required: true },
  name: { type: [String], required: true },
  additionalPrice: { type: [Number], required: true },
  required: { type: Boolean, required: true },
});

const MenuItemSchema: Schema<MenuItem> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    imageURL: { type: String, required: true },
    category: { type: String, required: true },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      autopopulate: {
        select: "online forceOnlineOverride isVerified onlineTime",
      },
    },
    available: { type: Boolean, default: true },
    forceOnlineOverride: { type: Boolean, default: false },
    onlineTime: {
      start: { type: Number },
      end: { type: Number },
    },
    options: { type: [MenuOptionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugin
MenuItemSchema.plugin(autopopulate);

// Virtual field for online
MenuItemSchema.virtual("online").get(function (this: any) {
  if (!this.available) return false;

  const restaurant = this.restaurant;
  if (!restaurant || typeof restaurant !== "object" || !restaurant._id) {
    return false;
  }

  if (!restaurant.online) return false;

  if (!this.forceOnlineOverride) {
    return true;
  }

  if (
    !this.onlineTime ||
    this.onlineTime.start === undefined ||
    this.onlineTime.end === undefined
  ) {
    return true;
  }

  const minutesNow = getCurrentMinutesInPakistan();
  const { start, end } = this.onlineTime;

  return start > end
    ? minutesNow >= start || minutesNow < end
    : minutesNow >= start && minutesNow < end;
});

const MenuItemModel =
  (mongoose.models.MenuItem as mongoose.Model<MenuItem>) ||
  mongoose.model<MenuItem>("MenuItem", MenuItemSchema);

export default MenuItemModel;
