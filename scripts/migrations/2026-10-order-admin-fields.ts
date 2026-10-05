import { toOrder } from "@/modules/orders/lib/toOrder";
import { buildSearchTokens } from "@/modules/orders/lib/search/orderSearch";
import { CANCELLATION_NOTE_MAX, CANCELLATION_REASONS, type CancellationReason } from "@/shared/domain";
import { ordersRef } from "@/shared/lib/firebase/collections";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";

// bun run migrate:orders            (emulator)
// bun run migrate:orders:staging    (millstone-dc47f, .env.staging.local)
// Step 6 Batch B (4 Oct 2026): adds the admin fields to orders saved before
// them: searchTokens, cancellationNote and collectUndo, and turns a free-text
// cancellationReason into a reason code (anything unknown becomes "other"
// with the old text as its note). Idempotent: a second run changes nothing.
// Same safety rules as the seed: the emulator, or an allow-listed staging project.

const KNOWN_WORDS: Record<string, CancellationReason> = {
  "not collected": "not_collected",
  "customer request": "customer_request",
};

type Raw = Record<string, unknown>;

function reasonFields(raw: Raw): { cancellationReason: CancellationReason | null; cancellationNote: string | null } {
  const reason = raw.cancellationReason;
  const note = typeof raw.cancellationNote === "string" ? raw.cancellationNote : null;
  if (reason === null || reason === undefined) return { cancellationReason: null, cancellationNote: null };
  if (typeof reason === "string" && (CANCELLATION_REASONS as readonly string[]).includes(reason)) {
    const code = reason as CancellationReason;
    return { cancellationReason: code, cancellationNote: code === "other" ? note : null };
  }
  const text = String(reason).trim();
  const known = KNOWN_WORDS[text.toLowerCase()];
  if (known) return { cancellationReason: known, cancellationNote: null };
  return { cancellationReason: "other", cancellationNote: text.slice(0, CANCELLATION_NOTE_MAX) || "Not recorded" };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env);
  if (target.reset) throw new Error("Refusing to migrate: --reset is a seed option.");
  console.log(`Migrating orders in ${target.projectId}${target.emulatorHost ? ` (emulator ${target.emulatorHost})` : ""}`);

  const snapshot = await ordersRef().get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const raw = doc.data() as Raw;
    const desired = {
      searchTokens: buildSearchTokens({
        orderNumber: String(raw.orderNumber ?? ""),
        contactName: String(raw.contactName ?? ""),
        contactPhone: String(raw.contactPhone ?? ""),
      }),
      ...reasonFields(raw),
      collectUndo: raw.collectUndo ?? null,
    };
    const stale = (Object.keys(desired) as (keyof typeof desired)[]).filter((key) => !same(raw[key], desired[key]));
    if (stale.length > 0) {
      await doc.ref.update(desired);
      updated += 1;
      console.log(`  ${doc.id} (${String(raw.orderNumber)}): ${stale.join(", ")}`);
    }
  }

  // Everything must now read back through the mapper.
  const after = await ordersRef().get();
  after.docs.forEach(toOrder);
  console.log(updated === 0 ? `No changes: ${after.size} orders already migrated.` : `${updated} of ${after.size} orders updated.`);
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "migrate:orders");
    process.exit(1);
  },
);
