"use client";

import { useRef, useState } from "react";
import { QuantityStepper } from "@/shared/components/molecules/QuantityStepper/QuantityStepper";
import { Button } from "@/shared/components/atoms/Button/Button";
import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { devComponentsContent } from "../../content/devComponents";

const content = devComponentsContent;

function ValueReadout({ value }: { value: string }) {
  return (
    <p className="caption text-ink-muted">
      {content.valueLabel}: <span data-testid="controlled-value">{value}</span>
    </p>
  );
}

export function ControlledStepper() {
  const [count, setCount] = useState(2);
  return (
    <div className="flex flex-col gap-2">
      <QuantityStepper value={count} onChange={setCount} label={content.quantityStepper.product} />
      <ValueReadout value={String(count)} />
    </div>
  );
}

export function ControlledToggle() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <Toggle
        label={content.toggle.product}
        onText={content.toggle.onText}
        offText={content.toggle.offText}
        checked={on}
        onChange={setOn}
      />
      <ValueReadout value={String(on)} />
    </div>
  );
}

export interface ControlledChoiceGroupProps {
  /** Show the "nothing chosen" error until something is picked. */
  requireChoice?: boolean;
}

export function ControlledChoiceGroup({ requireChoice = false }: ControlledChoiceGroupProps) {
  const [method, setMethod] = useState<string | null>(null);
  const payment = content.choiceGroup.payment;
  return (
    <div className="flex flex-col gap-2">
      <ChoiceGroup
        label={payment.label}
        options={[...payment.options]}
        value={method}
        onChange={setMethod}
        error={requireChoice && method === null ? payment.error : undefined}
      />
      <ValueReadout value={method ?? content.choiceGroup.none} />
    </div>
  );
}

export function DismissibleNotice() {
  const [shown, setShown] = useState(true);
  if (!shown) return <p className="caption text-ink-muted">{content.notice.dismissed}</p>;
  return <Notice onDismiss={() => setShown(false)}>{content.notice.neutral}</Notice>;
}

/** The consumer says where focus goes: here, back to the button above the notice. */
export function DismissibleNoticeWithTarget() {
  const [shown, setShown] = useState(true);
  const target = useRef<HTMLButtonElement>(null);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button ref={target} data-testid="focus-target">
        {content.notice.targetButton}
      </Button>
      {shown ? (
        <Notice onDismiss={() => setShown(false)} focusAfterDismiss={target} className="self-stretch">
          {content.notice.neutral}
        </Notice>
      ) : (
        <p className="caption text-ink-muted">{content.notice.dismissed}</p>
      )}
    </div>
  );
}
