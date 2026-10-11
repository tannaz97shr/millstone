import "server-only";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { z } from "zod";
import type { BranchId, IsoDate } from "@/shared/domain";
import { getDb } from "@/shared/lib/firebase/admin";
import { generationRunsRef } from "@/shared/lib/firebase/collections";
import { isoDateField, timestampField } from "@/shared/lib/firebase/fieldSchemas";
import { FIRESTORE_READ_DEADLINE_MS, firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { withDeadline } from "@/shared/utils/withDeadline";

// generationRuns/{branchId}_{pickupDate}: one branch's generation run for its
// last locked date. A lease, so two triggers (the cron and a tablet's A2)
// don't work through the same branch at once, and a completion mark, so A2's
// catch-up check is one doc read. It isn't what prevents duplicates: the
// cursor and the deterministic order IDs do that (planGeneration).

/** How long a run holds a branch. Longer than any trigger's budget. */
const LEASE_MS = 90_000;
/** Kept for a while as an audit line, then removed by the TTL policy. */
const KEEP_MS = 60 * 24 * 60 * 60 * 1000;

const generationRunDocSchema = z.object({
  branchId: z.string().min(1),
  pickupDate: isoDateField,
  startedAt: timestampField,
  leaseUntil: timestampField,
  completedAt: timestampField.nullable(),
  generated: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  expiresAt: timestampField,
});

export interface RunCounts {
  generated: number;
  failed: number;
}

const runRef = (branchId: BranchId, pickupDate: IsoDate) => generationRunsRef().doc(`${branchId}_${pickupDate}`);

/** Whether this branch's run for the date has finished with nothing failed. */
export async function isRunComplete(branchId: BranchId, pickupDate: IsoDate): Promise<boolean> {
  const snapshot = await firestoreRead(runRef(branchId, pickupDate).get(), "generationRuns");
  return snapshot.exists && parseDoc(generationRunDocSchema, snapshot).completedAt !== null;
}

export type LeaseResult = { kind: "leased"; ref: DocumentReference } | { kind: "complete" | "running" };

/** Takes the branch's run for the date, unless it's complete or another run holds it. */
export async function takeLease(branchId: BranchId, pickupDate: IsoDate, now: Date): Promise<LeaseResult> {
  const ref = runRef(branchId, pickupDate);
  const transaction = getDb().runTransaction(async (tx): Promise<LeaseResult> => {
    const snapshot = await tx.get(ref);
    const existing = snapshot.exists ? parseDoc(generationRunDocSchema, snapshot) : null;
    if (existing?.completedAt) return { kind: "complete" };
    if (existing && existing.leaseUntil.toMillis() > now.getTime()) return { kind: "running" };
    tx.set(ref, {
      branchId,
      pickupDate,
      startedAt: Timestamp.fromDate(now),
      leaseUntil: Timestamp.fromMillis(now.getTime() + LEASE_MS),
      completedAt: null,
      generated: existing?.generated ?? 0,
      failed: 0,
      expiresAt: Timestamp.fromMillis(now.getTime() + KEEP_MS),
    });
    return { kind: "leased", ref };
  });
  return withDeadline(transaction, FIRESTORE_READ_DEADLINE_MS, () => new Error(`Generation lease for ${ref.id} took over ${FIRESTORE_READ_DEADLINE_MS}ms`));
}

/**
 * Ends the run and releases the lease. `complete` only when every recurring
 * order was done with nothing failed; otherwise the next trigger runs it again.
 */
export async function finishRun(ref: DocumentReference, counts: RunCounts, complete: boolean): Promise<void> {
  const now = Timestamp.now();
  await ref.update({
    leaseUntil: now,
    completedAt: complete ? now : null,
    generated: FieldValue.increment(counts.generated),
    failed: counts.failed,
  });
}
