import { z } from "zod";

export const addRestaurantSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(25, { message: "Name must be at most 25 characters long." }),

  logoImageURL: z
    .string()
    .url({ message: "Logo image URL must be a valid URL." }),

  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, {
    message: "Accent color must be a valid 6-digit hex code (e.g. #A1B2C3).",
  }),

  orderCode: z
    .string()
    .min(1, { message: "Order code must be at least 1 character long." })
    .max(4, { message: "Order code must be at most 4 characters long." })
    .regex(/^[A-Z][A-Z0-9]*$/, {
      message:
        "Order code must start with an uppercase letter and contain only uppercase letters and numbers.",
    }),

  location: z.object({
    lat: z
      .number({ invalid_type_error: "Latitude must be a number." })
      .min(-90, { message: "Latitude must be at least -90." })
      .max(90, { message: "Latitude cannot exceed 90." }),

    lng: z
      .number({ invalid_type_error: "Longitude must be a number." })
      .min(-180, { message: "Longitude must be at least -180." })
      .max(180, { message: "Longitude cannot exceed 180." }),

    address: z
      .string()
      .min(10, { message: "Address must be at least 10 characters long." })
      .max(100, { message: "Address must be at most 100 characters long." }),

    city: z
      .string()
      .min(1, { message: "City is required." })
      .max(50, { message: "City must be at most 50 characters long." })
      .regex(/^[a-zA-Z\s]+$/, {
        message: "City can only contain letters and spaces.",
      }),
  }),

  onlineTime: z.object({
    start: z
      .number({ invalid_type_error: "Start time must be a number." })
      .min(0, { message: "Start time must be 0 or greater." })
      .max(1439, {
        message:
          "Start time must be less than or equal to 1439 (last minute of the day).",
      }),

    end: z
      .number({ invalid_type_error: "End time must be a number." })
      .min(0, { message: "End time must be 0 or greater." })
      .max(1439, {
        message:
          "End time must be less than or equal to 1439 (last minute of the day).",
      }),
    startTimeString: z.string().optional(),
    endTimeString: z.string().optional(),
  }),
});

// For partial updates to menu items
export const updateRestaurantSchema = addRestaurantSchema
  .partial()
  .omit({ orderCode: true });
