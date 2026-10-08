import type { AccountProfile } from "@/modules/account/types/accountSession";
import { formatPhone } from "@/shared/utils/phone";
import type { CheckoutDraft } from "./checkoutDraftStorage";

/**
 * C5 after signing in from checkout (AC-U2): the contact fields come from the
 * account, and the notes, payment choice and checkout key are kept from what
 * was typed as a guest, so a retry still can't place the order twice.
 * `newCheckoutKey` is used only when there was no guest draft.
 */
export function draftAfterSignIn(
  guestDraft: CheckoutDraft | null,
  profile: AccountProfile,
  newCheckoutKey: () => string,
): CheckoutDraft {
  return {
    version: 1,
    checkoutKey: guestDraft?.checkoutKey ?? newCheckoutKey(),
    values: {
      name: profile.name,
      phone: formatPhone(profile.phone),
      email: profile.email,
      notes: guestDraft?.values.notes ?? "",
      paymentMethod: guestDraft?.values.paymentMethod ?? "",
    },
  };
}
