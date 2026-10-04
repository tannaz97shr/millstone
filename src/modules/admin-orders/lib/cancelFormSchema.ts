import { z } from "zod";
import { CANCELLATION_NOTE_MAX, CANCELLATION_REASONS } from "@/shared/domain";
import { adminOrdersContent } from "../content/adminOrdersContent";

const content = adminOrdersContent.cancelDialog;

/** The cancel dialog's form (AC-A8): a reason, and for "Other", what happened. */
export const cancelFormSchema = z
  .object({
    // A string in the form ("" until one is chosen), a reason once it's valid.
    reason: z.string().pipe(z.enum(CANCELLATION_REASONS, { error: content.reasonError })),
    note: z.string().max(CANCELLATION_NOTE_MAX, content.noteTooLong(CANCELLATION_NOTE_MAX)),
  })
  .refine((values) => values.reason !== "other" || values.note.trim().length > 0, {
    message: content.noteError,
    path: ["note"],
  });

export type CancelFormValues = z.input<typeof cancelFormSchema>;

export type CancelFormOutput = z.output<typeof cancelFormSchema>;

/** What the main button says: the design names the missing step instead of greying out silently. */
export function cancelButtonLabel(values: CancelFormValues): string {
  if (!values.reason) return content.chooseReason;
  if (values.reason === "other" && !values.note.trim()) return content.sayWhat;
  return content.confirm;
}
