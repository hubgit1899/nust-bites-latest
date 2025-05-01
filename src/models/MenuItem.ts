import mongoose, { Schema, Document, Types } from "mongoose";
import { getNextSequence } from "@/helpers/getNextSequence"; // Adjust the path if needed

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
  restaurant: Types.ObjectId; // <- Changed to ObjectId
  isAvailable: boolean;
  options?: MenuOption[];
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
    },
    isAvailable: { type: Boolean, default: true },
    options: { type: [MenuOptionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// // Auto-increment menuItemId
// MenuItemSchema.pre("save", async function (next) {
//   if (!this.isNew || this.menuItemId) return next();
//   try {
//     this.menuItemId = await getNextSequence("menuItemId");
//     next();
//   } catch (err) {
//     next(err as Error);
//   }
// });

const MenuItemModel =
  (mongoose.models.MenuItem as mongoose.Model<MenuItem>) ||
  mongoose.model<MenuItem>("MenuItem", MenuItemSchema);
export default MenuItemModel;
