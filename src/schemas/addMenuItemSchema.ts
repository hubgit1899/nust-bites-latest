import { z } from "zod";

// Schema for individual menu option
export const menuOptionSchema = z
  .object({
    optionHeader: z
      .string()
      .min(1, { message: "Option header is required." })
      .max(30, {
        message: "Option header must be at most 30 characters long.",
      }),

    name: z
      .array(z.string().min(1, { message: "Option name cannot be empty." }))
      .min(1, { message: "At least one option name is required." }),

    additionalPrice: z
      .array(
        z.number().min(0, { message: "Additional price cannot be negative." })
      )
      .min(1, { message: "At least one price value is required." }),

    required: z.boolean(),
  })
  .refine((data) => data.name.length === data.additionalPrice.length, {
    message:
      "Each option name must have a corresponding additional price value.",
    path: ["additionalPrice"],
  });

// Schema for adding a menu item
export const addMenuItemSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name must be at most 50 characters long." }),

  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long." })
    .max(300, { message: "Description must be at most 300 characters long." }),

  basePrice: z
    .number({ invalid_type_error: "Base price must be a number." })
    .min(1, { message: "Base price should be greater than 0." })
    .max(100000, { message: "Base price cannot exceed 100,000." }),

  imageURL: z.string().url({ message: "Image URL must be a valid URL." }),

  category: z
    .string()
    .min(1, { message: "Category is required." })
    .max(30, { message: "Category must be at most 30 characters long." }),

  available: z.boolean().default(true), // Changed from isAvailable to available

  forceOnlineOverride: z.boolean().default(false), // Added field

  onlineTime: z
    .object({
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
    })
    .optional(),

  options: z.array(menuOptionSchema).optional().default([]),
});

// For partial updates to menu items
export const updateMenuItemSchema = addMenuItemSchema.partial();

// Schema for adding menu options to an existing menu item
export const addMenuOptionSchema = z.object({
  menuItemId: z.string().min(1, { message: "Menu item ID is required." }),
  option: menuOptionSchema,
});

// Add a validation schema for online time when forceOnlineOverride is true
export const onlineTimeValidationSchema = z
  .object({
    forceOnlineOverride: z.literal(true),
    onlineTime: z
      .object({
        start: z.number().min(0).max(1439),
        end: z.number().min(0).max(1439),
      })
      .refine((data) => data.start !== data.end, {
        message: "Start and end times cannot be the same",
      }),
  })
  .refine(
    (data) =>
      data.forceOnlineOverride === true && data.onlineTime !== undefined,
    {
      message:
        "Online time must be provided when force online override is true",
      path: ["onlineTime"],
    }
  );
