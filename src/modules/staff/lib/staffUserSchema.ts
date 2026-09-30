import "server-only";
import { z } from "zod";
import { STAFF_ROLES } from "@/shared/domain";
import { emailField } from "@/shared/lib/firebase/fieldSchemas";

/** Stored shape of staffUsers/{staffUserId}. */
export const staffUserDocSchema = z
  .object({
    name: z.string().min(1),
    email: emailField,
    passwordHash: z.string().min(1),
    role: z.enum(STAFF_ROLES),
    branchId: z.string().min(1).nullable(),
  })
  .refine((doc) => (doc.role === "owner") === (doc.branchId === null), {
    message: "owners have no branch; staff must have one",
    path: ["branchId"],
  });

/** staffEmails/{normalizedEmail}: makes staff emails unique. */
export const staffEmailLockSchema = z.object({
  staffUserId: z.string().min(1),
});
