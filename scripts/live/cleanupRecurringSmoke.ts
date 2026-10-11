import type { DocumentReference } from "firebase-admin/firestore";
import { signInThrottleDocId } from "@/modules/auth/lib/signInThrottle";
import {
  customerEmailsRef,
  customersRef,
  ordersRef,
  rateLimitsRef,
  recurringOrdersRef,
  signInThrottleRef,
} from "@/shared/lib/firebase/collections";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { liveDataWarning } from "@/shared/lib/firebase/firebaseTarget";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";
import { deleteAll } from "./lib/removeOrders";

// bun run cleanup:recurring-smoke:live [-- --yes]
// (or `bun --conditions=react-server scripts/live/cleanupRecurringSmoke.ts …` on the emulator)
//
// Removes what the recurring-orders smoke test (step 12 rollout) leaves behind,
// for its one account only, smoke-recurring@example.com:
// - its recurring orders (any status)
// - any orders it has (by customerId or accountId); normally none
// - the customer doc and its email lock
// - its customer sign-in throttle record
// - every rateLimits doc (they only last an hour anyway)
// Never generationRuns (per branch, pruned by TTL). The order counter stays.
// Without --yes it only says what it would do. Same guard as the seed.

const SMOKE_RECURRING_EMAIL = "smoke-recurring@example.com";

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env);
  const write = process.argv.includes("--yes");

  if (!target.emulatorHost) console.warn(`\n${liveDataWarning(target.projectId)}\n`);
  console.log(`Recurring smoke cleanup on ${target.projectId}${write ? "" : " (dry run: add --yes to delete)"}`);
  const refs: DocumentReference[] = [];
  const plan: string[] = [];

  const lock = await customerEmailsRef().doc(SMOKE_RECURRING_EMAIL).get();
  const customerId = lock.get("customerId") as string | undefined;
  if (customerId) {
    const customer = await customersRef().doc(customerId).get();
    if (customer.exists && customer.get("email") !== SMOKE_RECURRING_EMAIL) {
      throw new Error(`Customer ${customerId} isn't ${SMOKE_RECURRING_EMAIL}. Nothing deleted.`);
    }

    const recurring = await recurringOrdersRef().where("customerId", "==", customerId).get();
    for (const doc of recurring.docs) {
      refs.push(doc.ref);
      plan.push(`recurring order ${doc.id} (${String(doc.get("branchId"))}, ${String(doc.get("status"))}, ends ${String(doc.get("endsOn"))})`);
    }

    const [byCustomer, byAccount] = await Promise.all([
      ordersRef().where("customerId", "==", customerId).get(),
      ordersRef().where("accountId", "==", customerId).get(),
    ]);
    const orders = new Map([...byCustomer.docs, ...byAccount.docs].map((doc) => [doc.id, doc]));
    for (const doc of orders.values()) {
      refs.push(doc.ref);
      plan.push(`order ${String(doc.get("orderNumber"))} (${doc.id}, ${String(doc.get("pickupDate"))}, ${String(doc.get("status"))})`);
    }
    if (orders.size === 0) plan.push("no orders");

    if (customer.exists) {
      refs.push(customer.ref);
      plan.push(`customer ${customerId}`);
    }
  } else {
    plan.push(`no account for ${SMOKE_RECURRING_EMAIL}`);
  }
  if (lock.exists) {
    refs.push(lock.ref);
    plan.push("its email lock");
  }

  const throttle = await signInThrottleRef().doc(signInThrottleDocId("customer", SMOKE_RECURRING_EMAIL)).get();
  if (throttle.exists) {
    refs.push(throttle.ref);
    plan.push("its signInThrottle doc");
  }

  const limits = await rateLimitsRef().get();
  refs.push(...limits.docs.map((doc) => doc.ref));
  plan.push(`${limits.size} rateLimits docs`);

  console.log(plan.map((line) => `  - ${line}`).join("\n"));
  if (!write) return;
  await deleteAll(refs);
  console.log(`Done: ${refs.length} docs deleted. The order counter stays where it is.`);
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "cleanupRecurringSmoke");
    process.exit(1);
  },
);
