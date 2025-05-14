import { z } from "zod";

export const customerDetailsSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Full name must be at least 3 characters long." })
    .max(50, { message: "Full name must be at most 50 characters long." })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Full name can only contain letters and spaces.",
    }),
  phoneNumber: z
    .string()
    .length(11, { message: "Phone number must be at least 11 digits long." })
    .regex(/^\d+$/, {
      message: "Phone number can only contain digits.",
    }),
});
