import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { checkoutContent } from "../content/checkoutContent";
import type { CheckoutNotice as Problem } from "../hooks/usePlaceOrder";

const content = checkoutContent.outcome;

export interface CheckoutNoticeProps {
  notice: Problem;
  /** Places the order again with the same checkout key. */
  onRetry: () => void;
  /** Places the cart as it is now with a fresh checkout key. */
  onPlaceNew: () => void;
}

/** What the server said after Place order, when C5 stays open. */
export function CheckoutNotice({ notice, onRetry, onPlaceNew }: CheckoutNoticeProps) {
  switch (notice.kind) {
    case "price_changed":
      return <Notice tone="error">{content.priceChanged(formatCents(notice.totalCents))}</Notice>;
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
