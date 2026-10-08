import { ordersRef, rateLimitsRef } from "@/shared/lib/firebase/collections";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { liveDataWarning } from "@/shared/lib/firebase/firebaseTarget";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";
import { deleteAll, planOrderRemoval } from "./lib/removeOrders";
import { testOrderReason } from "./lib/testOrderMatch";

// bun run cleanup:test-orders:live [-- --order=MS-1047 --order=MS-1052] [-- --yes]
// (or `bun --conditions=react-server scripts/live/cleanupTestOrders.ts …` on the emulator)
//
// Lists the test orders left on the live site and, with --yes, deletes them:
// - smoke-test / smoke-limit-*, batch.* and stripe.test* @example.com orders
// - orders whose name looks typed to test ("Ttt", "x", "Test Batch A")
// - any order named with --order=MS-NNNN
// - the guest customers those orders leave with nothing else (no password)
// - every rateLimits doc (they only last an hour anyway)
// Never seed-*, generated or demo-* orders. The order counter stays where it is.
// Without --yes it only says what it would do. Same guard as the seed.

function flags(name: string): string[] {
  return process.argv.filter((arg) => arg.startsWith(`--${name}=`)).map((arg) => arg.split("=")[1]);
}

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env);
  const write = process.argv.includes("--yes");
  const named = new Set(flags("order"));
  for (const number of named) {
    if (!/^MS-\d{4,}$/.test(number)) throw new Error(`--order=${number} isn't an order number like MS-1047.`);
  }

  if (!target.emulatorHost) console.warn(`\n${liveDataWarning(target.projectId)}\n`);
  console.log(`Test-order cleanup on ${target.projectId}${write ? "" : " (dry run: add --yes to delete)"}`);

  const all = await ordersRef().get();
  const matches = all.docs.flatMap((doc) => {
    const why = testOrderReason(
      {
        id: doc.id,
        orderNumber: String(doc.get("orderNumber")),
        contactName: String(doc.get("contactName") ?? ""),
        contactEmail: String(doc.get("contactEmail") ?? ""),
      },
      named,
    );
    return why ? [{ doc, why }] : [];
  });
  const missing = [...named].filter((number) => !matches.some(({ doc }) => doc.get("orderNumber") === number));
  if (missing.length > 0) console.warn(`  Not found, or a seed/demo order (never removed here): ${missing.join(", ")}`);

  console.log(`  ${matches.length} of ${all.size} orders match:`);
  for (const { doc, why } of matches.sort((a, b) => String(a.doc.get("orderNumber")).localeCompare(String(b.doc.get("orderNumber"))))) {
    const line = [
      doc.get("orderNumber"),
      `"${doc.get("contactName")}"`,
      doc.get("contactEmail"),
      doc.get("branchId"),
      doc.get("pickupDate"),
      doc.get("status"),
    ].join("  ");
    console.log(`    - ${line}  [${why}]`);
  }

  const removal = await planOrderRemoval(matches.map(({ doc }) => doc));
  const limits = await rateLimitsRef().get();
  console.log([...removal.lines, `${limits.size} rateLimits docs`].map((line) => `  - ${line}`).join("\n"));

  if (!write) return;
  await deleteAll([...removal.refs, ...limits.docs.map((doc) => doc.ref)]);
  console.log("Done. The order counter stays where it is.");
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "cleanupTestOrders");
    process.exit(1);
  },
);
