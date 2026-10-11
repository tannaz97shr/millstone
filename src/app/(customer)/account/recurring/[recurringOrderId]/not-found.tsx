import { RecurringNotFound } from "@/modules/recurring-orders/components/RecurringNotFound";

// A recurring-order ID that isn't this account's, or doesn't exist: said in
// the account's terms (undesigned), still a 404.
export default function RecurringOrderNotFound() {
  return <RecurringNotFound />;
}
