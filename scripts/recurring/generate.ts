import { runGeneration } from "@/modules/recurring-orders/lib/generation/runGeneration";
import type { BranchId } from "@/shared/domain";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { formatCents } from "@/shared/utils/money";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";

// bun run recurring:generate                       dry run: what would be made now
// bun run recurring:generate -- --yes              makes the orders
// bun run recurring:generate -- --now=2026-10-13T04:30:00Z [--branch=northcote]
//
// The same generation the daily cron runs (runGeneration), against the local
// emulator only. Without --yes nothing is written: no orders, no cursor, no
// run record. --now pretends the clock says that instant (for cutoff and
// daylight-saving checks); orders made with it are still real emulator orders.

function argValue(argv: readonly string[], name: string): string | undefined {
  return argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.some((arg) => arg.startsWith("--project"))) {
    throw new Error("Refusing to run: recurring:generate is for the emulator only. On the live site the daily cron runs it.");
  }
  // The seed's guard: the emulator with a demo- project, never production.
  const target = resolveSeedTarget([], readFirebaseEnv(), process.env);

  const write = argv.includes("--yes");
  const nowArg = argValue(argv, "now");
  const now = nowArg ? new Date(nowArg) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`--now isn't an instant: "${nowArg}"`);
  const branchArg = argValue(argv, "branch");

  console.log(
    `Recurring generation on ${target.projectId} (emulator ${target.emulatorHost}) at ${now.toISOString()}` +
      `${branchArg ? `, ${branchArg} only` : ""}: ${write ? "WRITING" : "dry run, nothing is written"}\n`,
  );

  const summary = await runGeneration({
    now,
    branchIds: branchArg ? [branchArg as BranchId] : undefined,
    budgetMs: 5 * 60 * 1000,
    dryRun: !write,
    source: "script",
  });

  for (const branch of summary.branches) {
    console.log(
      `${branch.branchId}: through ${branch.through}, ${branch.outcome}, ${branch.due} with something due, ` +
        `${branch.generated} ${write ? "made" : "would be made"}, ${branch.failed} failed`,
    );
    for (const result of branch.results) {
      if (result.outcome === "failed") {
        console.log(`  ${result.recurringOrderId}: FAILED (${result.reason})`);
        continue;
      }
      if (result.outcome === "nothing_due") {
        console.log(`  ${result.recurringOrderId}: nothing due`);
        continue;
      }
      for (const date of result.dates) {
        const head = `  ${result.recurringOrderId} ${date.date}:`;
        if (date.outcome === "created") {
          const dropped = date.dropped.map((item) => `${item.name} (${item.reason})`).join(", ");
          console.log(
            `${head} ${write ? `made ${date.orderNumber}` : "would make an order"}, ${date.itemCount} line(s), ` +
              `${formatCents(date.totalCents)}${dropped ? `, left out: ${dropped}` : ""}`,
          );
        } else if (date.outcome === "exists") {
          console.log(`${head} already made`);
        } else {
          console.log(`${head} no order (${date.reason})`);
        }
      }
      console.log(`  ${result.recurringOrderId}: cursor ${write ? "now" : "would be"} ${result.generatedThrough}`);
    }
  }
  console.log(`\n${summary.done ? "Done." : "Not finished: run it again."}${write ? "" : " Add --yes to make the orders."}`);
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "recurring:generate");
    process.exit(1);
  },
);
