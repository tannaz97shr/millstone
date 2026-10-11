import "server-only";
import { listBranches } from "@/modules/branches/lib/listBranches";
import type { BranchId } from "@/shared/domain";
import { logError } from "@/shared/utils/logError";
import { lockedThrough } from "@/shared/utils/pickup-dates";
import { isRunComplete } from "./generationRuns";
import { runGeneration } from "./runGeneration";

/** A2's catch-up stays well inside a function's time after its response. */
const CATCH_UP_BUDGET_MS = 20_000;

/**
 * A2's catch-up (decided in step 12): Vercel Hobby runs the daily cron
 * some time in its hour, so staff could wait up to two hours after the
 * cutoff to see tomorrow's recurring orders. Each A2 list request checks
 * its branches' run records (one read each) and, for any not complete,
 * generates in the background. The next 30s refresh shows the orders.
 *
 * Call it from `after()`: it never throws and never slows the response.
 * `branchId` null means every branch (the owner's "All branches").
 */
export async function catchUpGeneration(branchId: BranchId | null, now: Date): Promise<void> {
  try {
    const branches = (await listBranches()).filter((branch) => branchId === null || branch.id === branchId);
    const behind: BranchId[] = [];
    for (const branch of branches) {
      if (!(await isRunComplete(branch.id, lockedThrough(branch, now)))) behind.push(branch.id);
    }
    if (behind.length === 0) return;
    await runGeneration({ now, branchIds: behind, budgetMs: CATCH_UP_BUDGET_MS, source: "admin" });
  } catch (error) {
    logError(error, "recurring generation (admin catch-up)");
  }
}
