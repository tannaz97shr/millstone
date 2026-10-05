"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCartMessages } from "@/modules/cart/hooks/useCartMessages";
import { useCartPage } from "@/modules/cart/hooks/useCartPage";
import { cartCount } from "@/modules/cart/lib/cartLogic";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { routes } from "@/shared/routes";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { checkoutContent } from "../content/checkoutContent";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSummary } from "./CheckoutSummary";

const content = checkoutContent.page;

export interface CheckoutScreenProps {
  /** The server's ONLINE_PAYMENTS_ENABLED switch. */
  onlinePayments: boolean;
  /** Whether the confirmation email goes anywhere (sendEmail's emailDeliveryEnabled). */
  emailed: boolean;
}

/**
 * C5. The cart, its branch and day, and their live prices come from the same
 * hook as C4, with the same checks. Anything those checks change (a day that
 * can't be ordered, an item that can't be sold) is explained on C4, so C5
 * sends the customer there; an empty cart goes there too.
 */
export function CheckoutScreen({ onlinePayments, emailed }: CheckoutScreenProps) {
  // C4's notices were read there; only what changes from here on sends the customer back.
  useEffect(() => clearCartMessages(), []);

  const router = useRouter();
  const page = useCartPage();
  /** Placed: the cart is about to be cleared and C7 is opening. */
  const [placed, setPlaced] = useState(false);
  const { cart, branch, date, branchesQuery, menuQuery } = page;

  const loading = !page.cartReady || branchesQuery.isPending;
  const leave =
    !placed &&
    page.cartReady &&
    branchesQuery.isSuccess &&
    (!cart || !branch || !date || cartCount(cart) === 0 || page.messages.length > 0);

  useEffect(() => {
    if (leave) router.replace(routes.cart);
  }, [leave, router]);

  const canPlace = page.menuIsCurrent && page.lines.length > 0;
  const status = menuQuery.isError ? (
    <LoadErrorNotice retryLabel={content.retry} onRetry={page.retry} retrying={menuQuery.isFetching}>
      {content.loadError}
    </LoadErrorNotice>
  ) : !page.menuIsCurrent && date ? (
    <LoadingMessage>{content.checking(formatPickupDay(date))}</LoadingMessage>
  ) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* -ml-2: the quiet button's text lines up with the design's 8px header inset. */}
      <ButtonLink href={routes.cart} variant="quiet" icon="left" className="-ml-2 self-start">
        {content.back}
      </ButtonLink>
      <h1 className="page-title">{content.title}</h1>

      {placed && <LoadingMessage>{content.opening}</LoadingMessage>}
      {!placed && (loading || leave) && !branchesQuery.isError && (
        <LoadingMessage>{content.loading}</LoadingMessage>
      )}
      {branchesQuery.isError && (
        <LoadErrorNotice retryLabel={content.retry} onRetry={page.retry} retrying={branchesQuery.isFetching}>
          {content.loadError}
        </LoadErrorNotice>
      )}

      {!placed && !loading && !leave && cart && branch && date && (
        <CheckoutForm
          branch={branch}
          date={date}
          lines={page.lines}
          totalCents={page.summary.totalCents}
          canPlace={canPlace}
          onlinePayments={onlinePayments}
          emailed={emailed}
          onPlaced={() => setPlaced(true)}
          summary={
            <CheckoutSummary
              branch={branch}
              date={date}
              lines={page.lines}
              count={canPlace ? page.summary.count : cartCount(cart)}
              status={status}
            />
          }
        />
      )}
    </div>
  );
}
