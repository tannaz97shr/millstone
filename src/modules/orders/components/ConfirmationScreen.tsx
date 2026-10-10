"use client";

import { useEffect, useRef } from "react";
import { useAccountSession } from "@/modules/account/hooks/useAccountSession";
import { updateCart } from "@/modules/cart/hooks/useCart";
import { clearCheckoutDraft, readCheckoutDraft } from "@/modules/checkout/lib/checkoutDraftStorage";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { confirmationContent } from "../content/confirmationContent";
import { useOrderConfirmationQuery } from "../hooks/useOrderConfirmationQuery";
import { ConfirmationDetails } from "./ConfirmationDetails";
import { ConfirmingScreen } from "./ConfirmingScreen";
import { ExpiredOrderNotice } from "./ExpiredOrderNotice";

const content = confirmationContent.page;

/**
 * C6 while an online payment is being confirmed, then C7 on the same URL
 * (the payment page's success link), or the expired notice if it never was.
 * The cart and checkout draft are cleared once the order is confirmed, and
 * only when this tab's checkout made it (the checkout key is the order ID),
 * so an old link never touches a new cart.
 */
export function ConfirmationScreen({ orderId, emailed }: { orderId: string; emailed: boolean }) {
  const { query, phase, checkAgain } = useOrderConfirmationQuery(orderId);
  const signedIn = Boolean(useAccountSession().data?.customer);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const state = query.data?.state;
  const confirmed = state === "confirmed";

  const cleared = useRef(false);
  useEffect(() => {
    if (!confirmed || cleared.current) return;
    cleared.current = true;
    if (readCheckoutDraft()?.checkoutKey !== orderId) return;
    updateCart(() => null);
    clearCheckoutDraft();
  }, [confirmed, orderId]);

  // Arriving from Place order, or C6 turning into C7: start reading at "Your order is in".
  useEffect(() => {
    if (confirmed && titleRef.current) focusWithoutTabStop(titleRef.current);
  }, [confirmed]);

  if (query.data) {
    switch (query.data.state) {
      case "confirmed":
        return <ConfirmationDetails order={query.data} titleRef={titleRef} emailed={emailed} signedIn={signedIn} />;
      case "awaiting_payment":
        return (
          <ConfirmingScreen
            order={query.data}
            phase={phase}
            emailed={emailed}
            onCheckAgain={checkAgain}
            checking={query.isFetching}
          />
        );
      case "expired":
        return <ExpiredOrderNotice order={query.data} />;
    }
  }
  if (query.isError) {
    if (toApiFailure(query.error).status === 404) {
      return (
        <section className="flex flex-col items-start gap-4">
          <p>{content.notFound}</p>
          <ButtonLink href={routes.home} variant="secondary">
            {content.notFoundLink}
          </ButtonLink>
        </section>
      );
    }
    return (
      <LoadErrorNotice retryLabel={content.retry} onRetry={() => void query.refetch()} retrying={query.isFetching}>
        {content.loadError}
      </LoadErrorNotice>
    );
  }
  return <LoadingMessage>{content.loading}</LoadingMessage>;
}
