"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  checkoutFormSchema,
  type CheckoutFormOutput,
  type CheckoutFormValues,
} from "../lib/checkoutSchema";
import type { AccountProfile } from "@/modules/account/types/accountSession";
import {
  newCheckoutKey,
  readCheckoutDraft,
  takeGuestCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
} from "../lib/checkoutDraftStorage";
import { draftAfterSignIn } from "../lib/draftAfterSignIn";

const blankValues = (onlinePayments: boolean): CheckoutFormValues => ({
  name: "",
  phone: "",
  email: "",
  notes: "",
  // With online payment switched off, pay at pickup is the only choice, so it's already chosen.
  paymentMethod: onlinePayments ? "" : "at_pickup",
});

/**
 * The draft to start from. Signed in with no draft of their own yet (just
 * signed in from checkout, or a new visit), the details come from the account
 * and anything typed as a guest in this tab is kept (AC-U2, AC-C4).
 */
function storedDraft(profile: AccountProfile | null): CheckoutDraft | null {
  const stored = readCheckoutDraft();
  if (stored || !profile) return stored;
  return draftAfterSignIn(takeGuestCheckoutDraft(), profile, newCheckoutKey);
}

function initialDraft(
  onlinePayments: boolean,
  backFromPayment: boolean,
  profile: AccountProfile | null,
): CheckoutDraft {
  const stored = storedDraft(profile);
  const values = { ...blankValues(onlinePayments), ...stored?.values };
  if (!onlinePayments) values.paymentMethod = "at_pickup";
  // Back from the payment page unpaid: online was the choice, whatever the draft kept.
  else if (backFromPayment) values.paymentMethod = "online";
  return { version: 1, checkoutKey: stored?.checkoutKey ?? newCheckoutKey(), values };
}

/**
 * C5's form (React Hook Form + the shared Zod schema), restored from and saved
 * to this tab's draft, and the checkout key that goes with it. Browser only:
 * mount it once the cart and the session have loaded. `backFromPayment`: the
 * customer came back from the payment page without paying, so "Pay online
 * now" stays chosen. `profile`: the signed-in customer, whose details fill in.
 */
export function useCheckoutForm(onlinePayments: boolean, backFromPayment: boolean, profile: AccountProfile | null) {
  const [initial] = useState(() => initialDraft(onlinePayments, backFromPayment, profile));
  const checkoutKey = useRef(initial.checkoutKey);

  const form = useForm<CheckoutFormValues, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: initial.values,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const save = useCallback(
    (values: Partial<CheckoutFormValues>) =>
      writeCheckoutDraft({
        version: 1,
        checkoutKey: checkoutKey.current,
        values: { ...blankValues(onlinePayments), ...values },
      }),
    [onlinePayments],
  );

  useEffect(() => {
    save(form.getValues());
    return form.subscribe({ formState: { values: true }, callback: ({ values }) => save(values) });
  }, [form, save]);

  /** The key for the next Place order. */
  const getCheckoutKey = useCallback(() => checkoutKey.current, []);

  /** A fresh key, so the cart as it is now is placed as a new order. */
  const renewCheckoutKey = useCallback(() => {
    checkoutKey.current = newCheckoutKey();
    save(form.getValues());
  }, [form, save]);

  return { form, getCheckoutKey, renewCheckoutKey };
}
