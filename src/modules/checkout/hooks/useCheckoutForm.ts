"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  checkoutFormSchema,
  type CheckoutFormOutput,
  type CheckoutFormValues,
} from "../lib/checkoutSchema";
import {
  newCheckoutKey,
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
} from "../lib/checkoutDraftStorage";

const blankValues = (onlinePayments: boolean): CheckoutFormValues => ({
  name: "",
  phone: "",
  email: "",
  notes: "",
  // With online payment switched off, pay at pickup is the only choice, so it's already chosen.
  paymentMethod: onlinePayments ? "" : "at_pickup",
});

function initialDraft(onlinePayments: boolean, backFromPayment: boolean): CheckoutDraft {
  const stored = readCheckoutDraft();
  const values = { ...blankValues(onlinePayments), ...stored?.values };
  if (!onlinePayments) values.paymentMethod = "at_pickup";
  // Back from the payment page unpaid: online was the choice, whatever the draft kept.
  else if (backFromPayment) values.paymentMethod = "online";
  return { version: 1, checkoutKey: stored?.checkoutKey ?? newCheckoutKey(), values };
}

/**
 * C5's form (React Hook Form + the shared Zod schema), restored from and saved
 * to this tab's draft, and the checkout key that goes with it. Browser only:
 * mount it once the cart has loaded. `backFromPayment`: the customer came back
 * from the payment page without paying, so "Pay online now" stays chosen.
 */
export function useCheckoutForm(onlinePayments: boolean, backFromPayment: boolean) {
  const [initial] = useState(() => initialDraft(onlinePayments, backFromPayment));
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
