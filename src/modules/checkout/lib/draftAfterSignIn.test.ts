import { describe, expect, test } from "bun:test";
import type { AccountProfile } from "@/modules/account/types/accountSession";
import type { CustomerId } from "@/shared/domain";
import type { CheckoutDraft } from "./checkoutDraftStorage";
import { draftAfterSignIn } from "./draftAfterSignIn";

const profile: AccountProfile = {
  id: "cust-1" as CustomerId,
  name: "Sam Carter",
  phone: "0491570156",
  email: "sam.carter@example.com",
};
const KEY = "0b7c5a2e-3f4d-4c1b-9a8e-6d5f4c3b2a10";
const NEW_KEY = "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f";

describe("draftAfterSignIn", () => {
  test("contact details come from the account; notes, payment and key are kept", () => {
    const guest: CheckoutDraft = {
      version: 1,
      checkoutKey: KEY,
      values: { name: "S", phone: "0491", email: "typo@", notes: "Sliced, please", paymentMethod: "at_pickup" },
    };
    expect(draftAfterSignIn(guest, profile, () => NEW_KEY)).toEqual({
      version: 1,
      checkoutKey: KEY,
      values: {
        name: "Sam Carter",
        phone: "0491 570 156",
        email: "sam.carter@example.com",
        notes: "Sliced, please",
        paymentMethod: "at_pickup",
      },
    });
  });

  test("with no guest draft, a fresh key and empty notes and payment", () => {
    const draft = draftAfterSignIn(null, profile, () => NEW_KEY);
    expect(draft.checkoutKey).toBe(NEW_KEY);
    expect(draft.values.notes).toBe("");
    expect(draft.values.paymentMethod).toBe("");
    expect(draft.values.name).toBe("Sam Carter");
  });
});
