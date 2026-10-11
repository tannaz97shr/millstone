import type { UnavailableReason } from "@/shared/lib/api/apiError";

// Recurring orders: C10 to C12, from design/customer/AccountArea.dc.html
// (the Rec*.dc.html states) unless marked undesigned.

export const recurringContent = {
  /**
   * The note saved on a generated order (spec 8, AC-R9) and shown to staff
   * (A2/A3) and the customer (C9). Stored text, in the designs' wording:
   * "Sourdough rye loaf ×4 skipped: sold out".
   */
  generationNote: {
    reason: {
      sold_out: "sold out",
      not_available: "not on the menu",
    } satisfies Record<UnavailableReason, string>,
    /** One dropped item. */
    line: (name: string, quantity: number, reason: string) => `${name} ×${quantity} skipped: ${reason}`,
    /** Between dropped items (undesigned: the designs only show one). */
    separator: "; ",
  },

  /** C11 field errors (RecFormErrors.dc.html). */
  errors: {
    branch: "Choose a branch.",
    days: "Choose at least one day.",
    items: "Add at least one item.",
    endsOn: "Choose the last pickup day.",
    /** Undesigned: past the length limit. */
    notesTooLong: "Keep notes to 500 characters or fewer.",
    /** Undesigned: more lines than the form allows. */
    tooManyItems: "That's more items than one recurring order can hold. Remove a few.",
    /** Undesigned: an end before the start. */
    endBeforeStart: "Choose a last pickup day on or after the first.",
  },
} as const;
