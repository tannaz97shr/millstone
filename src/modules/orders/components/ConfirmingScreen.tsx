import { Button } from "@/shared/components/atoms/Button/Button";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Icon } from "@/shared/components/atoms/Icon/Icon";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { confirmationContent } from "../content/confirmationContent";
import type { ConfirmingPhase } from "../lib/confirmingPhase";
import type { OrderConfirmation } from "../types/orderConfirmation";

const content = confirmationContent.confirming;

export interface ConfirmingScreenProps {
  order: OrderConfirmation;
  phase: ConfirmingPhase;
  /** Whether the confirmation email goes anywhere (sendEmail's emailDeliveryEnabled). */
  emailed: boolean;
  onCheckAgain: () => void;
  /** A Check again is on its way. */
  checking: boolean;
}

/**
 * C6 (AC-C6): back from the payment page, waiting for the provider's webhook.
 * Confirming, then ConfirmingSlow with Check again. The same URL becomes C7
 * once the order is confirmed.
 */
export function ConfirmingScreen({ order, phase, emailed, onCheckAgain, checking }: ConfirmingScreenProps) {
  const slow = phase !== "fast";
  const count = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 pb-4">
      {/* Only the words are live, so a phase change is read out and the card isn't. */}
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="flex text-[48px] text-ink-muted">
          <Icon name="ring" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="page-title">{slow ? content.slowTitle : content.title}</h1>
          <p>
            {!slow ? content.body : emailed ? content.slowBody(order.contactEmail) : content.slowBodyNoEmail}
          </p>
        </div>
      </div>
      <Card className="flex flex-col gap-1 shadow-none">
        <span className="body-strong">{content.pickup(formatPickupDay(order.pickupDate), order.branch.name)}</span>
        <span className="caption text-ink-muted tabular-nums">
          {content.count(count)} · {formatCents(order.totalCents)}
        </span>
      </Card>
      {slow && (
        <Button variant="secondary" onClick={onCheckAgain} aria-disabled={checking || undefined}>
          {content.checkAgain}
        </Button>
      )}
    </div>
  );
}
