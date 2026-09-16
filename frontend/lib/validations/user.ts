import { z } from "zod";

// Validates the body when creating a user. Zod's .email() enforces a valid
// email format before we ever write to DynamoDB.
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("A valid email is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
