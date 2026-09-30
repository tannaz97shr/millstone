import "server-only";
import { z } from "zod";
import { emailField, phoneField, timestampField } from "@/shared/lib/firebase/fieldSchemas";

/** Stored shape of customers/{customerId}. A guest has no password. */
export const customerDocSchema = z.object({
  name: z.string().min(1),
  email: emailField,
  phone: phoneField,
  passwordHash: z.string().min(1).nullable(),
  createdAt: timestampField,
});

/** customerEmails/{normalizedEmail}: makes customer emails unique. */
export const customerEmailLockSchema = z.object({
  customerId: z.string().min(1),
});
