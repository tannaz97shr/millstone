import { Card } from "@/shared/components/atoms/Card/Card";
import { QuantityStepper } from "@/shared/components/molecules/QuantityStepper/QuantityStepper";
import type { Cents, ProductId } from "@/shared/domain";
import { cx } from "@/shared/utils/cx";
import { formatCents } from "@/shared/utils/money";
import { recurringContent } from "../content/recurringContent";

export interface FormItem {
  productId: ProductId;
  name: string;
  /** Today's price, or null for an item already in the order that has left the menu. */
  priceCents: Cents | null;
  /** Off the menu: the quantity it has now, the most it can go back up to (it can't be added afresh). */
  keptQuantity?: number;
}

export interface RecurringItemRowsProps {
  items: readonly FormItem[];
  quantities: Readonly<Record<string, number>>;
  branchName: string;
  onChange: (productId: ProductId, quantity: number) => void;
}

/** C11 "What you need each time": every product the branch makes, "$X each today", with a stepper from 0. */
export function RecurringItemRows({ items, quantities, branchName, onChange }: RecurringItemRowsProps) {
  return (
    <Card padding="none" className="flex flex-col">
      {items.map((item, index) => (
        <div
          key={item.productId}
          className={cx("flex items-center justify-between gap-3 px-4 py-3", index > 0 && "border-t border-line")}
        >
          <div className="flex min-w-0 flex-col">
            <span className="product-name">{item.name}</span>
            <span className="caption text-ink-muted tabular-nums">
              {item.priceCents === null
                ? recurringContent.common.offMenu(branchName)
                : recurringContent.form.eachToday(formatCents(item.priceCents))}
            </span>
          </div>
          <QuantityStepper
            value={quantities[item.productId] ?? 0}
            min={0}
            max={item.keptQuantity}
            label={item.name}
            onChange={(quantity) => onChange(item.productId, quantity)}
            className="shrink-0"
          />
        </div>
      ))}
    </Card>
  );
}
