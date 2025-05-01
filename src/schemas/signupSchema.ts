import { errorMessages } from "@/app/constants/errorMessages";
import { z } from "zod";

export const usernameValidation = z
  .string()
  .min(3, { message: "Username must be at least 3 characters long." })
  .max(20, { message: "Username must be at most 20 characters long." })
  .regex(/^[a-z0-9_.]+$/, {
    message: errorMessages.USERNAME_REQUIRES,
  });

export const signupSchema = z
  .object({
    username: usernameValidation,
    email: z.string().email({ message: errorMessages.INVALID_EMAIL_FORMAT }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .max(20, { message: "Password must be at most 20 characters long." })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errorMessages.PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });
