import type { Cents, PaymentStatus, VisibleOrderStatus } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { Button } from "../../atoms/Button/Button";
import { Icon } from "../../atoms/Icon/Icon";
import { PaymentLabel } from "../../atoms/PaymentLabel/PaymentLabel";
import { RecurringLabel } from "../../atoms/RecurringLabel/RecurringLabel";
import { StatusBadge } from "../../atoms/StatusBadge/StatusBadge";

export interface OrderItemSummary {
  name: string;
  quantity: number;
}

export interface OrderRowProps {
  /** e.g. "MS-1042". Read aloud at the counter. */
  orderNumber: string;
  status: VisibleOrderStatus;
  /** Leave out (or null) on a cancelled pay-at-pickup order: no money changed hands, so no label. */
  payment?: PaymentStatus | null;
  customerName: string;
  /** As stored (digits); formatted for display here. */
  phone?: string;
  /** A summary string, or items joined as "2 × Rye loaf, 6 × Plain bagel". */
  items?: string | OrderItemSummary[];
  /** Integer cents. */
  totalCents?: Cents;
  /** Show the Recurring label (recurring_order_id is set). */
  recurring?: boolean;
  /** Customer notes. */
  notes?: string;
  /** generation_note: highlights the whole row. */
  generationNote?: string;
  /** The order open in the side panel. */
  selected?: boolean;
  /** Placed → ready. */
  onReady?: () => void;
  /** Placed or ready → collected. Confirm payment first when payment is "unpaid". */
  onCollected?: () => void;
  /** Opens the order detail side panel. */
  onOpen?: () => void;
  className?: string;
}

const content = componentsContent.orderRow;

// 200px on a row (wider than Button's own counter width); side by side when the row stacks.
const counterButton = "min-w-50! max-[700px]:min-w-0! max-[700px]:flex-1";

/**
 * One order in the admin list, for a tablet at the counter. Use it only
 * inside data-context="admin". Every action is a visible button with a word.
 */
export function OrderRow({
  orderNumber,
  status,
  payment,
  customerName,
  phone,
  items,
  totalCents,
  recurring = false,
  notes,
  generationNote,
  selected = false,
  onReady,
  onCollected,
  onOpen,
  className,
}: OrderRowProps) {
  const final = status === "collected" || status === "cancelled";
  const flagged = Boolean(generationNote) && !final;
  const itemSummary = Array.isArray(items)
    ? items.map((item) => content.item(item.quantity, item.name)).join(content.itemSeparator)
    : items;
  const quiet = final && "text-ink-muted";

  return (
    <article
      aria-label={content.label(orderNumber)}
      className={cx(
        "grid grid-cols-1 items-start gap-6 rounded-lg border-2 px-6 py-5 text-ink min-[701px]:grid-cols-[minmax(0,1fr)_auto]",
        final ? "bg-flour" : flagged ? "bg-wheat-soft" : "bg-flour-raised",
        selected ? "border-crust" : flagged ? "border-wheat" : "border-line",
        !final && (selected ? "shadow-[var(--shadow-card),inset_0_0_0_1px_var(--color-crust)]" : "shadow-card"),
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cx("admin-order-number mr-1 tabular-nums", quiet)}>{orderNumber}</span>
          <StatusBadge status={status} />
          {payment && <PaymentLabel status={payment} />}
          {recurring && <RecurringLabel />}
          {totalCents !== undefined && (
            <span
              className={cx(
                "ml-auto text-[22px]/[28px] font-bold tabular-nums",
                quiet,
                status === "cancelled" && "line-through",
              )}
            >
              {formatCents(totalCents)}
            </span>
          )}
        </div>
        <div className={cx("admin-strong", quiet)}>
          {customerName}
          {phone && (
            <span className="font-normal tabular-nums">
              {content.nameAndPhone(formatPhone(phone))}
            </span>
          )}
        </div>
        {itemSummary && <p className={cx("admin-body", quiet)}>{itemSummary}</p>}
        {notes && (
          <p className="text-[18px]/[26px] text-ink-muted">
            <strong className="text-ink">{content.note}</strong> {notes}
          </p>
        )}
        {generationNote && (
          <p className="mt-1 flex items-start gap-2 rounded-md border-2 border-wheat bg-flour-raised px-4 py-3 text-[18px]/[26px] font-bold text-wheat-ink">
            <Icon name="alert" sizeClassName="size-5.5" className="mt-0.5" />
            <span>{generationNote}</span>
          </p>
        )}
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={content.detailsLabel(orderNumber)}
            className="-ml-2 inline-flex min-h-tap cursor-pointer items-center gap-1 self-start rounded-md px-2 text-[18px] font-bold text-crust underline underline-offset-3 hover:bg-crust-soft"
          >
            {content.details}
            <Icon name="right" />
          </button>
        )}
      </div>
      {!final && (
        <div className="flex flex-col gap-3 max-[700px]:flex-row">
          {status === "placed" && (
            <Button
              variant="primary"
              counter
              icon="check"
              onClick={onReady}
              aria-label={content.readyLabel(orderNumber)}
              className={counterButton}
            >
              {content.ready}
            </Button>
          )}
          <Button
            variant={status === "ready" ? "ready" : "secondary"}
            counter
            icon="check"
            onClick={onCollected}
            aria-label={content.collectedLabel(orderNumber)}
            className={counterButton}
          >
            {content.collected}
          </Button>
        </div>
      )}
    </article>
  );
}
