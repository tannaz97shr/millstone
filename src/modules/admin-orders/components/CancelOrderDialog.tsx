"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { Dialog } from "@/shared/components/organisms/Dialog/Dialog";
import { CANCELLATION_NOTE_MAX, CANCELLATION_REASONS } from "@/shared/domain";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { logError } from "@/shared/utils/logError";
import { adminOrdersContent } from "../content/adminOrdersContent";
import type { ActionTarget, CancelInput } from "../hooks/useOrderActions";
import { cancelButtonLabel, cancelFormSchema, type CancelFormOutput, type CancelFormValues } from "../lib/cancelFormSchema";

const content = adminOrdersContent.cancelDialog;
const EMPTY: CancelFormValues = { reason: "", note: "" };

// Looks unavailable until the form is complete, but stays focusable and
// clickable so a tap explains what's missing.
const blockedClasses =
  "aria-disabled:cursor-not-allowed aria-disabled:border-flour-sunk! aria-disabled:bg-flour-sunk! aria-disabled:text-ink-muted!";

export interface CancelOrderDialogProps {
  order: ActionTarget | null;
  pending: boolean;
  onSubmit: (input: CancelInput) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Cancel with a reason (AC-A8), from the order panel. A paid-online order
 * shows the refund reminder: cancelling doesn't send the money back.
 */
export function CancelOrderDialog({ order, pending, onSubmit, onClose }: CancelOrderDialogProps) {
  const form = useForm<CancelFormValues, unknown, CancelFormOutput>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: EMPTY,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const values: CancelFormValues = { ...EMPTY, ...useWatch({ control: form.control }) };
  const blocked = cancelButtonLabel(values) !== content.confirm;

  // A fresh form each time it opens.
  const orderId = order?.id ?? null;
  useEffect(() => {
    if (orderId) form.reset(EMPTY);
  }, [orderId, form]);

  if (!order) return <Dialog open={false} onClose={onClose} title="" />;

  const total = formatCents(order.totalCents);
  const paidOnline = order.paymentMethod === "online" && order.paymentStatus === "paid";

  const submit = form.handleSubmit(
    async (output) => {
      if (pending) return;
      await onSubmit({ reason: output.reason, note: output.reason === "other" ? output.note.trim() : undefined });
    },
    (errors) => logError(new Error(`cancel form: ${Object.keys(errors).join(", ")}`), "CancelOrderDialog", { level: "warn" }),
  );

  return (
    <Dialog
      open
      onClose={onClose}
      adminLayout="form"
      title={content.title(order.orderNumber)}
      description={content.summary(order.contactName, total, formatPickupDay(order.pickupDate))}
      actions={
        <>
          <Button
            type="submit"
            form="cancel-order-form"
            variant="danger"
            counter
            icon="cross"
            aria-disabled={blocked || pending || undefined}
            className={blockedClasses}
          >
            {cancelButtonLabel(values)}
          </Button>
          <Button variant="secondary" counter onClick={onClose}>
            {content.keep}
          </Button>
        </>
      }
    >
      <form id="cancel-order-form" noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <ChoiceGroup
              ref={field.ref}
              label={content.reasonLabel}
              name={field.name}
              value={field.value || null}
              onChange={field.onChange}
              error={fieldState.error?.message}
              options={CANCELLATION_REASONS.map((reason) => ({
                value: reason,
                label: adminOrdersContent.reasons[reason].label,
                hint: adminOrdersContent.reasons[reason].hint,
              }))}
            />
          )}
        />
        {values.reason === "other" && (
          <TextField
            label={content.noteLabel}
            hint={content.noteHint}
            maxLength={CANCELLATION_NOTE_MAX}
            error={form.formState.errors.note?.message}
            {...form.register("note")}
          />
        )}
        {paidOnline && (
          <Notice tone="error" role="note" title={content.refundTitle}>
            {content.refundBody(total)}
          </Notice>
        )}
      </form>
    </Dialog>
  );
}
