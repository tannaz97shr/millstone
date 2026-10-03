"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import type { CartLineView } from "@/modules/cart/lib/cartLogic";
import type { Cents, IsoDate } from "@/shared/domain";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { checkoutContent } from "../content/checkoutContent";
import { useCheckoutForm } from "../hooks/useCheckoutForm";
import { usePlaceOrder } from "../hooks/usePlaceOrder";
import type { CheckoutFormValues } from "../lib/checkoutSchema";
import { CheckoutBar } from "./CheckoutBar";
import { CheckoutNotice } from "./CheckoutNotice";
import { ContactFields } from "./ContactFields";
import { PaymentChoice } from "./PaymentChoice";

/** The sentence each field shows when the server refuses it. */
const SERVER_FIELD_ERRORS: Record<keyof CheckoutFormValues, string> = {
  name: checkoutContent.errors.name,
  phone: checkoutContent.errors.phone,
  email: checkoutContent.errors.email,
  notes: checkoutContent.errors.notesTooLong,
  paymentMethod: checkoutContent.errors.paymentMethod,
};

export interface CheckoutFormProps {
  branch: BranchSummary;
  date: IsoDate;
  lines: readonly CartLineView[];
  totalCents: Cents;
  /** The lines are priced from the current menu, so the order can be placed. */
  canPlace: boolean;
  onlinePayments: boolean;
  /** The order is saved; C7 opens next. */
  onPlaced: () => void;
  /** The order summary card, rendered first inside the form. */
  summary: React.ReactNode;
}

/**
 * C5's form: contact details, notes, payment and Place order. Browser only
 * (it restores this tab's draft as it mounts).
 */
export function CheckoutForm({
  branch,
  date,
  lines,
  totalCents,
  canPlace,
  onlinePayments,
  onPlaced,
  summary,
}: CheckoutFormProps) {
  const { form, getCheckoutKey, renewCheckoutKey } = useCheckoutForm(onlinePayments);

  const onFieldErrors = useCallback(
    (fields: (keyof CheckoutFormValues)[]) => {
      for (const field of fields) form.setError(field, { message: SERVER_FIELD_ERRORS[field] });
      form.setFocus(fields[0]);
    },
    [form],
  );

  const place = usePlaceOrder({ branch, date, lines, totalCents, getCheckoutKey, onFieldErrors, onPlaced });
  const pending = place.pending;

  // One Place order at a time: a double tap, or Enter while it's sending, does nothing.
  const busy = useRef(false);
  const submit = useCallback(() => {
    if (busy.current || !canPlace) return;
    busy.current = true;
    void form
      .handleSubmit(place.placeOrder, () => place.dismissNotice())()
      .finally(() => {
        busy.current = false;
      });
  }, [canPlace, form, place]);

  const placeAsNew = useCallback(() => {
    renewCheckoutKey();
    submit();
  }, [renewCheckoutKey, submit]);

  // A notice appears after the button was pressed: take focus there so it's read.
  const noticeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (place.notice && noticeRef.current) focusWithoutTabStop(noticeRef.current);
  }, [place.notice]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-1 flex-col gap-6"
    >
      {summary}
      <div inert={pending} className="flex flex-col gap-6">
        <ContactFields form={form} />
        <PaymentChoice control={form.control} onlinePayments={onlinePayments} />
      </div>
      {place.notice && (
        <div ref={noticeRef} className="focus-visible:shadow-none">
          <CheckoutNotice notice={place.notice} onRetry={submit} onPlaceNew={placeAsNew} />
        </div>
      )}
      {canPlace && <CheckoutBar control={form.control} totalCents={totalCents} pending={pending} />}
    </form>
  );
}
