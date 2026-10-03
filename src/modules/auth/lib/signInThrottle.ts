import "server-only";
import { createHash } from "node:crypto";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import { getDb } from "@/shared/lib/firebase/admin";
import { signInThrottleRef } from "@/shared/lib/firebase/collections";
import { timestampField } from "@/shared/lib/firebase/fieldSchemas";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { isLocked, recordFailure, type ThrottleState } from "./throttleRules";

// Firestore side of the sign-in throttle (rules in throttleRules.ts). The doc
// ID is a hash of the email, so the collection never holds the address.

const signInThrottleDocSchema = z.object({
  failures: z.number().int().positive(),
  windowStart: timestampField,
  lockedUntil: timestampField.nullable(),
});

type SignInThrottleDoc = z.input<typeof signInThrottleDocSchema>;

function throttleDocRef(normalizedEmail: string) {
  return signInThrottleRef().doc(createHash("sha256").update(normalizedEmail).digest("hex"));
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
  };
}

export async function isSignInLocked(normalizedEmail: string, now: Date): Promise<boolean> {
  const snapshot = await firestoreRead(throttleDocRef(normalizedEmail).get(), "signInThrottle");
  return isLocked(toThrottleState(snapshot), now.getTime());
}

export async function recordSignInFailure(normalizedEmail: string, now: Date): Promise<void> {
  const ref = throttleDocRef(normalizedEmail);
  await getDb().runTransaction(async (tx) => {
    const state = toThrottleState(await tx.get(ref));
    tx.set(ref, throttleStateToDoc(recordFailure(state, now.getTime())));
  });
}

export async function clearSignInFailures(normalizedEmail: string): Promise<void> {
  await throttleDocRef(normalizedEmail).delete();
}
