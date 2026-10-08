import "server-only";
import { createHash } from "node:crypto";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import { getDb } from "@/shared/lib/firebase/admin";
import { signInThrottleRef } from "@/shared/lib/firebase/collections";
import { timestampField } from "@/shared/lib/firebase/fieldSchemas";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { isLocked, recordFailure, throttleExpiresAtMs, type ThrottleState } from "./throttleRules";

// Firestore side of the sign-in throttle (rules in throttleRules.ts). The doc
// ID is a hash of the email, so the collection never holds the address.
// Staff and customers count separately: a customer's failures can't lock a
// staff member with the same email, or the other way round.

const signInThrottleDocSchema = z.object({
  failures: z.number().int().positive(),
  windowStart: timestampField,
  lockedUntil: timestampField.nullable(),
  /** For the Firestore TTL policy that prunes old records. Missing on records saved before step 9. */
  expiresAt: timestampField.optional(),
});

type SignInThrottleDoc = z.input<typeof signInThrottleDocSchema>;

/** Whose sign-in is counted: A1's staff, or C8's customers. */
export type ThrottleNamespace = "staff" | "customer";

/**
 * The doc ID for an email's record; the address itself is never stored.
 * Staff records keep the plain hash they've had since step 6.
 */
export function signInThrottleDocId(namespace: ThrottleNamespace, normalizedEmail: string): string {
  const input = namespace === "staff" ? normalizedEmail : `${namespace}:${normalizedEmail}`;
  return createHash("sha256").update(input).digest("hex");
}

function throttleDocRef(namespace: ThrottleNamespace, normalizedEmail: string) {
  return signInThrottleRef().doc(signInThrottleDocId(namespace, normalizedEmail));
}

function toThrottleState(snapshot: DocumentSnapshot): ThrottleState | null {
  if (!snapshot.exists) return null;
  const doc = parseDoc(signInThrottleDocSchema, snapshot);
  return {
    failures: doc.failures,
    windowStartMs: doc.windowStart.toMillis(),
    lockedUntilMs: doc.lockedUntil ? doc.lockedUntil.toMillis() : null,
  };
}

function throttleStateToDoc(state: ThrottleState): SignInThrottleDoc {
  return {
    failures: state.failures,
    windowStart: Timestamp.fromMillis(state.windowStartMs),
    lockedUntil: state.lockedUntilMs === null ? null : Timestamp.fromMillis(state.lockedUntilMs),
    expiresAt: Timestamp.fromMillis(throttleExpiresAtMs(state)),
  };
}

export async function isSignInLocked(
  namespace: ThrottleNamespace,
  normalizedEmail: string,
  now: Date,
): Promise<boolean> {
  const snapshot = await firestoreRead(throttleDocRef(namespace, normalizedEmail).get(), "signInThrottle");
  return isLocked(toThrottleState(snapshot), now.getTime());
}

export async function recordSignInFailure(
  namespace: ThrottleNamespace,
  normalizedEmail: string,
  now: Date,
): Promise<void> {
  const ref = throttleDocRef(namespace, normalizedEmail);
  await getDb().runTransaction(async (tx) => {
    const state = toThrottleState(await tx.get(ref));
    tx.set(ref, throttleStateToDoc(recordFailure(state, now.getTime())));
  });
}

export async function clearSignInFailures(namespace: ThrottleNamespace, normalizedEmail: string): Promise<void> {
  await throttleDocRef(namespace, normalizedEmail).delete();
}
