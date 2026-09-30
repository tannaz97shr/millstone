"use client";

import { useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { Dialog } from "@/shared/components/organisms/Dialog/Dialog";
import { Sheet } from "@/shared/components/organisms/Sheet/Sheet";
import { formatCents } from "@/shared/utils/money";
import { devComponentsContent } from "../../content/devComponents";

const content = devComponentsContent;

function Result({ value }: { value: string }) {
  return (
    <p className="caption text-ink-muted">
      {content.valueLabel}: <span data-testid="modal-result">{value}</span>
    </p>
  );
}

export function SheetDemo() {
  const copy = content.sheet;
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<string>(copy.branches[0]);
  const [pending, setPending] = useState<string>(copy.branches[0]);

  const close = () => {
    setOpen(false);
    setPending(branch);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>{copy.open}</Button>
      <Result value={branch} />
      <Sheet
        open={open}
        onClose={close}
        title={copy.title}
        actions={
          <>
            <Button
              variant="primary"
              block
              onClick={() => {
                setBranch(pending);
                setOpen(false);
              }}
            >
              {pending === branch ? copy.keep(branch) : copy.confirm(pending)}
            </Button>
            <Button block onClick={close}>
              {copy.cancel}
            </Button>
          </>
        }
      >
        <ChoiceGroup
          label={copy.question}
          options={copy.branches.map((name) => ({ value: name, label: name }))}
          value={pending}
          onChange={setPending}
        />
        <p className="caption text-ink-muted">{copy.note}</p>
      </Sheet>
    </div>
  );
}

/** The C4 "Change to Fitzroy?" warning: centred on the customer site. */
export function WarningDialogDemo() {
  const copy = content.dialog.warning;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>(content.datePicker.none);
  const finish = (value: string) => {
    setResult(value);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>{copy.open}</Button>
      <Result value={result} />
      <Dialog
        open={open}
        onClose={() => finish(content.dialog.results.closed)}
        role="alertdialog"
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Button variant="primary" block onClick={() => finish(content.dialog.results.confirmed)}>
              {copy.confirm}
            </Button>
            <Button block onClick={() => finish(content.dialog.results.closed)}>
              {copy.keep}
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-1 rounded-md bg-flour-sunk px-4 py-3">
          <li className="font-bold tabular-nums">{copy.removed}</li>
        </ul>
      </Dialog>
    </div>
  );
}

/** A2: collecting an unpaid order. */
export function ConfirmPaymentDialogDemo() {
  const copy = content.dialog.confirmPayment;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>(content.datePicker.none);
  const finish = (value: string) => {
    setResult(value);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>{copy.open}</Button>
      <Result value={result} />
      <Dialog
        open={open}
        onClose={() => finish(content.dialog.results.closed)}
        adminLayout="confirm"
        title={copy.title(copy.customerName)}
        eyebrow={
          <>
            <span className="admin-order-number">{copy.orderNumber}</span>
            <PaymentLabel status="unpaid" />
          </>
        }
        description={
          <>
            {copy.bodyBefore}
            <strong>{formatCents(copy.totalCents)}</strong>
            {copy.bodyAfter}
          </>
        }
        actions={
          <>
            <Button
              variant="ready"
              counter
              icon="check"
              onClick={() => finish(content.dialog.results.confirmed)}
            >
              {copy.confirm}
            </Button>
            <Button counter onClick={() => finish(content.dialog.results.closed)}>
              {copy.notYet}
            </Button>
          </>
        }
      />
    </div>
  );
}

export interface CancelDialogDemoProps {
  /** "Wed 30 Sep", from the pickup-date helpers. */
  pickupDay: string;
}

/** A3: cancel with a reason, with the refund reminder for an order paid online. */
export function CancelDialogDemo({ pickupDay }: CancelDialogDemoProps) {
  const copy = content.dialog.cancel;
  const reason = content.choiceGroup.reason;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<string>(content.datePicker.none);
  const total = formatCents(copy.totalCents);
  const finish = (value: string) => {
    setResult(value);
    setOpen(false);
    setPicked(null);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>{copy.open}</Button>
      <Result value={result} />
      <Dialog
        open={open}
        onClose={() => finish(content.dialog.results.closed)}
        title={copy.title}
        description={copy.description(total, pickupDay)}
        actions={
          <>
            <Button
              variant="danger"
              counter
              icon="cross"
              disabled={picked === null}
              onClick={() => finish(content.dialog.results.confirmed)}
            >
              {picked === null ? copy.chooseFirst : copy.confirm}
            </Button>
            <Button counter onClick={() => finish(content.dialog.results.closed)}>
              {copy.keep}
            </Button>
          </>
        }
      >
        <ChoiceGroup
          label={reason.label}
          options={[...reason.options]}
          value={picked}
          onChange={setPicked}
        />
        {picked === "other" && <TextField label={copy.otherLabel} hint={copy.otherHint} />}
        <Notice tone="error" role="note" title={copy.refundTitle}>
          {copy.refundBody(total)}
        </Notice>
      </Dialog>
    </div>
  );
}
