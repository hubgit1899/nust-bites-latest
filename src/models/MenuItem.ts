import mongoose, { Schema, Document, Types } from "mongoose";

export interface MenuOption {
  optionHeader: string;
  name: string[];
  additionalPrice: number[];
  required: boolean;
}

export interface MenuItem extends Document {
  _id: { toString(): string };
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
      ref: "restaurant",
      required: true,
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

const MenuItemModel =
  (mongoose.models.MenuItem as mongoose.Model<MenuItem>) ||
  mongoose.model<MenuItem>("MenuItem", MenuItemSchema);

export default MenuItemModel;
