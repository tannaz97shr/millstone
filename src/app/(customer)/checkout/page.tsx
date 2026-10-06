import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { CheckoutScreen } from "@/modules/checkout/components/CheckoutScreen";
import { onlinePaymentsEnabled } from "@/shared/lib/payments/paymentsConfig";
import { emailDeliveryEnabled } from "@/shared/lib/email/sendEmail";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";

// C5. Rendered per request, like C4: pickup dates depend on the time of day,
// and the cart (with its prices) is only in the browser.
export default async function CheckoutPage() {
  await connection();
  const queryClient = getQueryClient();
  await prefetchBranches(queryClient, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CheckoutScreen onlinePayments={onlinePaymentsEnabled()} emailed={emailDeliveryEnabled()} />
    </HydrationBoundary>
  );
}
