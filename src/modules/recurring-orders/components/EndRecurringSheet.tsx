"use client";

import { useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { Sheet } from "@/shared/components/organisms/Sheet/Sheet";
import type { IsoDate } from "@/shared/domain";
import { addDays, PICKUP_STRIP_DAYS } from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import { endConfirmLabel, type EndChoice } from "../lib/recurringText";
import type { RecurringOrderDetail } from "../types/recurringOrderView";

const content = recurringContent.end;

export interface EndRecurringSheetProps {
  open: boolean;
  detail: RecurringOrderDetail;
  onClose: () => void;
  onEndNow: () => void;
  onEndAfter: (date: IsoDate) => void;
  pending: boolean;
}

/**
 * C12's "End this recurring order?" (RecDetailEnd.dc.html, AC-R7): the
 * confirm step. "Stop now", or the last of its own pickup days from the
 * strip (anything else struck through). "Keep it going", Escape or a tap
 * outside closes it, and focus goes back to "End recurring order".
 */
export function EndRecurringSheet({ open, detail, onClose, onEndNow, onEndAfter, pending }: EndRecurringSheetProps) {
  const [choice, setChoice] = useState<EndChoice>("now");
  const [date, setDate] = useState<IsoDate | null>(detail.endDateOptions[0] ?? null);

  const start = detail.firstChangeable;
  const options = new Set(detail.endDateOptions);
  const strip = Array.from({ length: PICKUP_STRIP_DAYS }, (_, i) => addDays(start, i));
  const ready = choice === "now" || date !== null;

  const confirm = () => {
    if (pending || !ready) return;
    if (choice === "now") onEndNow();
    else if (date) onEndAfter(date);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={content.title}
      actions={
        <>
          <Button variant="danger" block onClick={confirm} aria-disabled={pending || !ready || undefined}>
            {pending ? content.ending : endConfirmLabel(choice, date)}
          </Button>
          <Button variant="secondary" block onClick={onClose}>
            {content.keep}
          </Button>
        </>
      }
    >
      <p>{content.body}</p>
      <ChoiceGroup
        label={content.question}
        name="end-when"
        value={choice}
        onChange={(value) => setChoice(value as EndChoice)}
        options={[
          { value: "now", label: content.now.label, hint: content.now.hint },
          { value: "date", label: content.after.label, hint: content.after.hint },
        ]}
      />
      {choice === "date" && (
        <DatePicker
          label={content.lastPickup}
          value={date}
          onChange={setDate}
          earliest={start}
          start={start}
          days={PICKUP_STRIP_DAYS}
          unavailable={strip.filter((day) => !options.has(day))}
          closedWeekdays={detail.branch.closedDays}
          note={content.lastPickupNote}
        />
      )}
    </Sheet>
  );
}
