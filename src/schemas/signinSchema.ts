import { errorMessages } from "@/app/constants/errorMessages";
import { z } from "zod";

export const signInSchema = z.object({
  identifier: z.string().min(1, errorMessages.FIELD_REQUIRED),
  password: z.string().min(1, errorMessages.FIELD_REQUIRED),
});
