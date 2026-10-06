import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { routes } from "@/shared/routes";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { checkoutContent } from "../content/checkoutContent";
import type { CheckoutNotice as Problem } from "../hooks/usePlaceOrder";

const content = checkoutContent.outcome;

export interface CheckoutNoticeProps {
  notice: Problem;
  /** The order's branch: a rate-limited customer can call it instead. */
  branch: Pick<BranchSummary, "name" | "phone">;
  /** Places the order again with the same checkout key. */
  onRetry: () => void;
  /** Places the cart as it is now with a fresh checkout key. */
  onPlaceNew: () => void;
  /** Payment page unavailable: switch to Pay at pickup (the customer still presses Place order). */
  onPayAtPickup: () => void;
}

/** What the server said after Place order, when C5 stays open. */
export function CheckoutNotice({ notice, branch, onRetry, onPlaceNew, onPayAtPickup }: CheckoutNoticeProps) {
  switch (notice.kind) {
    case "price_changed":
      return <Notice tone="error">{content.priceChanged(formatCents(notice.totalCents))}</Notice>;
    case "rate_limited":
      return (
        <Notice tone="error">
          {content.rateLimited.body(notice.waitMinutes)}
          {content.rateLimited.call(branch.name)}
          <a
            href={`tel:${branch.phone}`}
            className="font-bold whitespace-nowrap text-crust underline underline-offset-3 hover:text-crust-deep"
          >
            {formatPhone(branch.phone)}
          </a>
          {content.rateLimited.after}
        </Notice>
      );
    case "payment_unavailable":
      return (
        <Notice tone="error" title={content.paymentUnavailable.title}>
          <div className="flex flex-col items-start gap-3">
            <p>{content.paymentUnavailable.body}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onRetry}>{content.paymentUnavailable.retry}</Button>
              <Button onClick={onPayAtPickup}>{content.paymentUnavailable.atPickup}</Button>
            </div>
          </div>
        </Notice>
      );
    case "key_mismatch":
      return (
        <Notice tone="error" title={content.keyMismatch.title(notice.orderNumber)}>
          <div className="flex flex-col items-start gap-3">
            <p>{content.keyMismatch.body}</p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={routes.orderConfirmation(notice.orderId)}>
                {content.keyMismatch.see(notice.orderNumber)}
              </ButtonLink>
              <Button onClick={onPlaceNew}>{content.keyMismatch.placeNew}</Button>
            </div>
          </div>
        </Notice>
      );
    case "failed":
      return (
        <Notice
          tone="error"
          title={content.failed.title}
          action={<Button onClick={onRetry}>{content.failed.retry}</Button>}
        >
          {content.failed.body}
        </Notice>
      );
  }
}
