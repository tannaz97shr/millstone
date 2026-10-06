"use client";

import { useEffect, useRef } from "react";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { focusWithoutTabStop } from "@/shared/utils/focusable";
import { confirmationContent } from "../content/confirmationContent";
import { useOrderConfirmationQuery } from "../hooks/useOrderConfirmationQuery";
import { ConfirmationDetails } from "./ConfirmationDetails";

const content = confirmationContent.page;

/**
 * C7. Shows the order only; the cart was already cleared by checkout once the
 * order was saved, so an old confirmation link never touches a new cart.
 */
export function ConfirmationScreen({ orderId, emailed }: { orderId: string; emailed: boolean }) {
  const query = useOrderConfirmationQuery(orderId);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasOrder = query.data?.state === "confirmed";

  // Arriving from Place order: start reading at "Your order is in".
  useEffect(() => {
    if (hasOrder && titleRef.current) focusWithoutTabStop(titleRef.current);
  }, [hasOrder]);

  // Until C6 is built (step 10, Batch B), an order that isn't placed reads as not found, as before.
  if (query.data && query.data.state !== "confirmed") return <p>{content.notFound}</p>;
  if (query.data) return <ConfirmationDetails order={query.data} titleRef={titleRef} emailed={emailed} />;
  if (query.isError) {
    if (toApiFailure(query.error).status === 404) return <p>{content.notFound}</p>;
    return (
      <LoadErrorNotice retryLabel={content.retry} onRetry={() => void query.refetch()} retrying={query.isFetching}>
        {content.loadError}
      </LoadErrorNotice>
    );
  }
  return <LoadingMessage>{content.loading}</LoadingMessage>;
}
