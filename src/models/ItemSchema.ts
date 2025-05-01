import { Schema } from "mongoose";

const ItemSchema = new Schema(
  {
    restaurantId: { type: Number, required: true },
    menuItemId: { type: Number, required: true },
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    imageURL: { type: String, required: true },
    category: { type: String, required: true },
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
  },
  { _id: false }
);

export default ItemSchema;
