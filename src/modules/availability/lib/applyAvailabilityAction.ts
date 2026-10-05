import "server-only";
import { branchScope, type StaffActor } from "@/modules/auth/lib/requireSession";
import { getBranchOrThrow } from "@/modules/branches/lib/listBranches";
import { branchProductToDoc, toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import type { BranchId } from "@/shared/domain";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { branchProductsRef, productsRef } from "@/shared/lib/firebase/collections";
import { logError } from "@/shared/utils/logError";
import { melbourneDateOf, pickupCalendar } from "@/shared/utils/pickup-dates";
import { withDeadline } from "@/shared/utils/withDeadline";
import type { AvailabilityActionResult } from "../types/availability";
import type { AvailabilityAction } from "./availabilityActionSchema";
import { availabilityState, planAvailabilityAction, sameAvailability } from "./availabilityRules";
import { type AffectedDays, findOrdersIncluding } from "./findOrdersIncluding";

/** As for order actions: a transaction can retry on contention. */
export const AVAILABILITY_ACTION_DEADLINE_MS = 8_000;

const DATE_MESSAGES = {
  closed_day: "The branch is closed that day",
  past_cutoff: "Orders for that day have closed",
  out_of_range: "That day is too far ahead",
} as const;

const productNotFound = () => new ApiError(404, "not_found", "That product isn't on this list");

/**
 * One A4 action (AC-P4, P5) in a transaction that re-reads the product and
 * the branch's row, so the check and the write see the same data. A missing
 * row reads as on the menu; writing one creates it. If the row isn't what the
 * staff member saw, it's a 409 and nothing is written.
 */
export async function applyAvailabilityAction(
  actor: StaffActor,
  branchId: BranchId,
  action: AvailabilityAction,
  now: Date,
): Promise<AvailabilityActionResult> {
  branchScope(actor, branchId);
  const branch = await getBranchOrThrow(branchId);
  const calendar = pickupCalendar(branch, now);
  const today = melbourneDateOf(now);
  const { productId } = action;
  const productRef = productsRef().doc(productId);
  const rowRef = branchProductsRef(branchId).doc(productId);

  const transaction = getDb().runTransaction(async (tx) => {
    const [productSnapshot, rowSnapshot] = await Promise.all([tx.get(productRef), tx.get(rowRef)]);
    if (!productSnapshot.exists || !toProduct(productSnapshot).isActive) throw productNotFound();

    const current = availabilityState(rowSnapshot.exists ? toBranchProduct(rowSnapshot) : undefined, today);
    if (!sameAvailability(current, action.expected)) {
      throw new ApiError(409, "availability_changed", "Changed on another screen", { currentAvailability: current });
    }

    const plan = planAvailabilityAction(current, action, calendar);
    if (!plan.ok) {
      if (plan.problem === "not_allowed") {
        throw new ApiError(409, "not_allowed", `Can't ${action.action} from this state`, {
          currentAvailability: current,
        });
      }
      throw new ApiError(422, plan.problem, DATE_MESSAGES[plan.problem], { earliest: calendar.earliest });
    }

    tx.set(rowRef, branchProductToDoc({ branchId, productId, ...plan.state }));
    return plan.state;
  });

  // A commit that lands after the deadline did happen: the refetch shows it,
  // and a repeat tap gets "already changed".
  const state = await withDeadline(
    transaction,
    AVAILABILITY_ACTION_DEADLINE_MS,
    () => new ApiError(503, "unavailable", `Availability action took over ${AVAILABILITY_ACTION_DEADLINE_MS}ms`),
  );

  const days: AffectedDays | null =
    action.action === "mark_sold_out" ? { date: action.date } : action.action === "switch_off" ? { from: today } : null;
  if (!days) return { productId, state, affectedOrders: null, affectedOrdersUnknown: false };

  try {
    const affectedOrders = await findOrdersIncluding(branchId, productId, days);
    return { productId, state, affectedOrders, affectedOrdersUnknown: false };
  } catch (error) {
    // The change is saved; only the warning is missing. The screen says so.
    logError(error, `applyAvailabilityAction orders check ${branchId}/${productId}`, { level: "warn" });
    return { productId, state, affectedOrders: null, affectedOrdersUnknown: true };
  }
}
