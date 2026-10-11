import "server-only";
import { listBranches } from "@/modules/branches/lib/listBranches";
import type { Branch, BranchId, IsoDate, RecurringOrderId } from "@/shared/domain";
import { recurringOrdersRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import { lockedThrough } from "@/shared/utils/pickup-dates";
import { toRecurringOrder } from "../toRecurringOrder";
import { generateForRecurringOrder, type GenerationResult } from "./generateForRecurringOrder";
import { finishRun, takeLease } from "./generationRuns";
import { hasDueOrders } from "./planGeneration";

// One generation pass over the branches (spec 8, AC-R8): the cron's daily
// run, A2's catch-up and the local script all call this. Each branch is
// worked through up to its last locked date, one recurring order (one
// transaction) at a time; they serialise on the order counter anyway.

export interface RunGenerationOptions {
  now: Date;
  /** Only these branches; all of them when left out. */
  branchIds?: readonly BranchId[];
  /** Stop starting new work after this long; the next trigger carries on. */
  budgetMs: number;
  /** Plan only: no lease, no orders, no cursor (the local script without --yes). */
  dryRun?: boolean;
  /** Names the trigger in the log. */
  source: "cron" | "admin" | "script";
}

export interface BranchRunSummary {
  branchId: BranchId;
  /** The last locked date: everything up to it has been looked at once the run is done. */
  through: IsoDate;
  outcome: "done" | "partial" | "already_complete" | "running_elsewhere";
  /** Recurring orders with something to make. */
  due: number;
  generated: number;
  failed: number;
  /** Per recurring order, for the script's dry run and the log. */
  results: GenerationResult[];
}

export interface RunGenerationSummary {
  done: boolean;
  branches: BranchRunSummary[];
}

async function runBranch(
  branch: Branch,
  through: IsoDate,
  options: RunGenerationOptions,
  deadline: number,
): Promise<BranchRunSummary> {
  const branchId = branch.id;
  const summary: BranchRunSummary = { branchId, through, outcome: "done", due: 0, generated: 0, failed: 0, results: [] };

  const lease = options.dryRun ? null : await takeLease(branchId, through, options.now);
  if (lease?.kind === "complete") return { ...summary, outcome: "already_complete" };
  if (lease?.kind === "running") return { ...summary, outcome: "running_elsewhere" };

  // Active orders only. Paused, skipped and ended ones make nothing; their
  // cursor catches up on the customer's next change (generate-before-write).
  const snapshot = await firestoreRead(
    recurringOrdersRef().where("branchId", "==", branchId).where("status", "==", "active").get(),
    `recurringOrders at ${branchId}`,
  );
  const due: RecurringOrderId[] = [];
  for (const doc of snapshot.docs) {
    try {
      if (hasDueOrders(toRecurringOrder(doc), branch, options.now)) due.push(doc.id as RecurringOrderId);
    } catch (error) {
      // A doc that doesn't parse: log it and carry on with the others.
      logError(error, `recurring generation (${options.source}): ${doc.id}`);
      summary.failed += 1;
    }
  }
  summary.due = due.length;

  for (const recurringOrderId of due) {
    if (Date.now() > deadline) {
      summary.outcome = "partial";
      break;
    }
    try {
      const result = await generateForRecurringOrder(recurringOrderId, options.now, { dryRun: options.dryRun });
      summary.results.push(result);
      if (result.outcome === "failed") {
        logError(new Error(result.reason), `recurring generation (${options.source}): ${recurringOrderId}`);
        summary.failed += 1;
      } else if (result.outcome === "generated") {
        summary.generated += result.dates.filter((date) => date.outcome === "created").length;
      }
    } catch (error) {
      logError(error, `recurring generation (${options.source}): ${recurringOrderId}`);
      summary.failed += 1;
    }
  }

  if (lease?.kind === "leased") {
    const complete = summary.outcome === "done" && summary.failed === 0;
    await finishRun(lease.ref, { generated: summary.generated, failed: summary.failed }, complete);
  }
  return summary;
}

/** Generates every due recurring order, branch by branch, within the time budget. */
export async function runGeneration(options: RunGenerationOptions): Promise<RunGenerationSummary> {
  const deadline = Date.now() + options.budgetMs;
  const branches = (await listBranches()).filter(
    (branch) => !options.branchIds || options.branchIds.includes(branch.id),
  );

  const summaries: BranchRunSummary[] = [];
  for (const branch of branches) {
    const through = lockedThrough(branch, options.now);
    try {
      summaries.push(await runBranch(branch, through, options, deadline));
    } catch (error) {
      // The lease (if taken) runs out by itself, so the next trigger retries.
      logError(error, `recurring generation (${options.source}): branch ${branch.id}`);
      summaries.push({ branchId: branch.id, through, outcome: "partial", due: 0, generated: 0, failed: 1, results: [] });
    }
  }

  const summary: RunGenerationSummary = {
    done: summaries.every((branch) => branch.outcome !== "partial" && branch.failed === 0),
    branches: summaries,
  };
  console.info(
    `[recurring generation] ${options.source}${options.dryRun ? " (dry run)" : ""}: ` +
      summaries.map((b) => `${b.branchId} through ${b.through} ${b.outcome}, ${b.generated} made, ${b.failed} failed`).join("; "),
  );
  return summary;
}
