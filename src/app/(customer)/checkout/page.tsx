import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { prefetchBranches } from "@/modules/branches/lib/prefetchBranches";
import { CheckoutScreen } from "@/modules/checkout/components/CheckoutScreen";
import { onlinePaymentsEnabled, paymentsTestMode } from "@/shared/lib/payments/paymentsConfig";
import { emailDeliveryEnabled } from "@/shared/lib/email/sendEmail";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { paymentCancelledParam } from "@/shared/routes";

// C5. Rendered per request, like C4: pickup dates depend on the time of day,
// and the cart (with its prices) is only in the browser. `?payment=cancelled`
// is where the payment page's back link returns (routes.checkoutPaymentCancelled).
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const { [paymentCancelledParam.name]: payment } = await searchParams;
  const queryClient = getQueryClient();
  await prefetchBranches(queryClient, new Date());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CheckoutScreen
        onlinePayments={onlinePaymentsEnabled()}
        testPayments={paymentsTestMode()}
        paymentCancelled={payment === paymentCancelledParam.value}
        emailed={emailDeliveryEnabled()}
      />
    </HydrationBoundary>
  );
}
