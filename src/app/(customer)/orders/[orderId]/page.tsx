import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ConfirmationScreen } from "@/modules/orders/components/ConfirmationScreen";
import { orderRouteParamsSchema } from "@/modules/orders/lib/orderParams";
import { prefetchOrderConfirmation } from "@/modules/orders/lib/prefetchOrderConfirmation";
import { emailDeliveryEnabled } from "@/shared/lib/email/sendEmail";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

// C6 then C7 (the payment page's success URL), or C7 straight from Place
// order. Public: the order's unguessable ID is the only credential (see
// specs/known-issues.md). A malformed or unknown ID is the customer 404.
export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const parsed = orderRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { orderId } = parsed.data;

  const queryClient = getQueryClient();
  if ((await prefetchOrderConfirmation(queryClient, orderId)) === "not_found") notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConfirmationScreen orderId={orderId} emailed={emailDeliveryEnabled()} />
    </HydrationBoundary>
  );
}
