import { z } from "zod";

// Schema for menu item options in cart
const cartItemOptionSchema = z.object({
  optionHeader: z.string(),
  selected: z.string(),
  additionalPrice: z.number(),
});

// Schema for cart items
const cartItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  basePrice: z.number(),
  imageURL: z.string().url(),
  category: z.string(),
  quantity: z.number().min(1),
  options: z.array(cartItemOptionSchema).optional(),
});

// Schema for delivery location
const deliveryLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z
    .string()
    .min(
      10,
      "Delivery address is required and must be at least 10 characters long"
    )
    .max(200, "Delivery address cannot exceed 200 characters"),
});

// Main checkout schema
export const checkoutSchema = z.object({
  restaurantId: z.string(),
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  deliveryLocation: deliveryLocationSchema,
  specialInstructions: z.string().max(500).optional(),
});
