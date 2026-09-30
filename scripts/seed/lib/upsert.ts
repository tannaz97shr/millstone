import { Timestamp, type DocumentData, type DocumentReference } from "firebase-admin/firestore";

// Writes a doc only when it differs from what's stored, and reports what
// happened, so a second seed run can prove it changed nothing.

export type WriteOutcome = "created" | "updated" | "unchanged";

export class WriteTally {
  private readonly counts = new Map<string, Record<WriteOutcome, number>>();

  record(collection: string, outcome: WriteOutcome): void {
    const entry = this.counts.get(collection) ?? { created: 0, updated: 0, unchanged: 0 };
    entry[outcome] += 1;
    this.counts.set(collection, entry);
  }

  rows(): { collection: string; created: number; updated: number; unchanged: number }[] {
    return [...this.counts].map(([collection, counts]) => ({ collection, ...counts }));
  }

  get changes(): number {
    return this.rows().reduce((sum, row) => sum + row.created + row.updated, 0);
  }
}

function isSameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Timestamp || b instanceof Timestamp) {
    return a instanceof Timestamp && b instanceof Timestamp && a.isEqual(b);
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => isSameValue(item, b[index]))
    );
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bRecord = b as Record<string, unknown>;
    return (
      aKeys.length === Object.keys(b).length &&
      aKeys.every((key) => isSameValue((a as Record<string, unknown>)[key], bRecord[key]))
    );
  }
  return a === b;
}

export async function upsertDoc(
  ref: DocumentReference,
  desired: DocumentData,
): Promise<WriteOutcome> {
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set(desired);
    return "created";
  }
  if (isSameValue(snapshot.data(), desired)) return "unchanged";
  await ref.set(desired);
  return "updated";
}
