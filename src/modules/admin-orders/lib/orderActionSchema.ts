import { z } from "zod";
import {
  CANCELLATION_NOTE_MAX,
  CANCELLATION_REASONS,
  VISIBLE_ORDER_STATUSES,
} from "@/shared/domain";

// The body of POST /api/admin/orders/{id}/actions (AC-A6 to A10). Every
// action that moves an order carries the status the staff member saw, so a
// change made on another screen in the meantime is refused, not overwritten.

const expectedStatus = z.enum(VISIBLE_ORDER_STATUSES);

export const orderActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ready"), expectedStatus }),
  z.object({
    action: z.literal("collect"),
    expectedStatus,
    /** "Yes, paid · Collected" on an unpaid order. */
    paymentConfirmed: z.boolean(),
  }),
  z.object({ action: z.literal("undo_collect") }),
  z
    .object({
      action: z.literal("cancel"),
      expectedStatus,
      reason: z.enum(CANCELLATION_REASONS),
      note: z
        .string()
        .max(CANCELLATION_NOTE_MAX * 2)
        .optional()
        .transform((note) => note?.trim() || undefined),
    })
    .refine((body) => body.reason !== "other" || (body.note && body.note.length <= CANCELLATION_NOTE_MAX), {
      message: `"other" needs a note of up to ${CANCELLATION_NOTE_MAX} characters`,
      path: ["note"],
    }),
  z.object({ action: z.literal("mark_refunded") }),
]);

export type OrderActionRequest = z.input<typeof orderActionSchema>;
export type OrderAction = z.output<typeof orderActionSchema>;
export type OrderActionName = OrderAction["action"];

/** How long the browser shows Undo after a one-tap Collected (design: ~5s). */
export const UNDO_VISIBLE_MS = 5_000;

/**
 * How long the server still accepts Undo after the collect was saved. Longer
 * than the message, so an Undo tapped at 4.9s survives two slow round trips.
 */
export const UNDO_SERVER_WINDOW_MS = 10_000;
