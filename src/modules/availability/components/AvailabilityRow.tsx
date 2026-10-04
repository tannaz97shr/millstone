"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Stamp } from "@/shared/components/atoms/Stamp/Stamp";
import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import type { IsoDate } from "@/shared/domain";
import { cx } from "@/shared/utils/cx";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { availabilityContent } from "../content/availabilityContent";
import type { AvailabilityChange } from "../lib/availabilityRules";
import type { AvailabilityProduct } from "../types/availability";

const content = availabilityContent.row;

export interface AvailabilityRowProps {
  product: AvailabilityProduct;
  branchName: string;
  /** The "Mark sold out for" day. */
  date: IsoDate;
  onChange: (product: AvailabilityProduct, change: AvailabilityChange) => void;
}

/**
 * One product at one branch (A4): the on/off Toggle, then either "Sold out
 * {day}" with Back on sale, "Sold out for {day}", or, when it's off, who
 * won't see it. A row sold out for one day only offers Back on sale.
 */
export function AvailabilityRow({ product, branchName, date, onChange }: AvailabilityRowProps) {
  const { name, state } = product;
  const on = state.isAvailable;
  const soldOutDay = on && state.soldOutOn ? formatPickupDay(state.soldOutOn) : null;
  const day = formatPickupDay(date);

  return (
    <div
      data-availability-row={product.id}
      className={cx(
        "flex min-h-22 flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border-2 border-line px-6 py-3",
        on ? "bg-flour-raised shadow-card" : "border-dashed bg-flour",
      )}
    >
      <div className="min-w-0 grow">
        <Toggle
          label={name}
          checked={on}
          onChange={(next) => onChange(product, { action: next ? "switch_on" : "switch_off" })}
          onText={content.onText}
          offText={content.offText}
        />
      </div>
      {soldOutDay ? (
        <>
          <Stamp shape="tag" icon="cross" toneClassName="bg-brick-soft text-brick border-brick">
            {content.soldOutTag(soldOutDay)}
          </Stamp>
          <Button
            variant="secondary"
            icon="refund"
            data-row-action="back-on-sale"
            aria-label={content.backOnSaleLabel(name, soldOutDay)}
            onClick={() => onChange(product, { action: "back_on_sale" })}
          >
            {content.backOnSale}
          </Button>
        </>
      ) : on ? (
        <Button
          variant="secondary"
          data-row-action="sold-out"
          aria-label={content.markSoldOutLabel(name, day)}
          onClick={() => onChange(product, { action: "mark_sold_out", date })}
        >
          {content.markSoldOut(day)}
        </Button>
      ) : (
        <span className="text-[18px]/[24px] text-ink-muted">{content.offNote(branchName)}</span>
      )}
    </div>
  );
}
