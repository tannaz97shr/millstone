import "server-only";
import { createHmac } from "node:crypto";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import { ApiError } from "@/shared/lib/api/apiError";
import { getDb } from "@/shared/lib/firebase/admin";
import { rateLimitsRef } from "@/shared/lib/firebase/collections";
import { timestampField } from "@/shared/lib/firebase/fieldSchemas";
import { FIRESTORE_READ_DEADLINE_MS } from "@/shared/lib/firebase/firestoreRead";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { logError } from "@/shared/utils/logError";
import { withDeadline } from "@/shared/utils/withDeadline";
import {
  clientIp,
  decideRateLimit,
  ipBucket,
  rateLimitExpiresAtMs,
  type RateLimitPolicy,
  type RateLimitState,
} from "./rateLimitRules";

// Firestore side of the per-IP limits (rules in rateLimitRules.ts). The doc
// ID holds a keyed hash of the address, never the address itself: a plain
// SHA-256 of an IPv4 address could be reversed by trying all of them.

const rateLimitDocSchema = z.object({
  count: z.number().int().positive(),
  windowStart: timestampField,
  expiresAt: timestampField,
});

/** Used when a request carries no address at all, so those still share one limit. */
const UNKNOWN_ADDRESS = "unknown";

function addressKey(ip: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set, so addresses can't be hashed");
  return createHmac("sha256", secret).update(`rate-limit:${ipBucket(ip)}`).digest("hex");
}

function toState(snapshot: DocumentSnapshot): RateLimitState | null {
  if (!snapshot.exists) return null;
  const doc = parseDoc(rateLimitDocSchema, snapshot);
  return { count: doc.count, windowStartMs: doc.windowStart.toMillis() };
}

/**
 * Counts this request against the policy for its address; 429 `rate_limited`
 * with Retry-After once over. If the count itself fails (e.g. Firestore is
 * slow), the request is let through and the failure logged: a fault here
 * must never block checkout or sign-in.
 */
export async function enforceRateLimit(request: Request, policy: RateLimitPolicy): Promise<void> {
  let decision: ReturnType<typeof decideRateLimit>;
  try {
    const ref = rateLimitsRef().doc(`${policy.id}_${addressKey(clientIp(request.headers) ?? UNKNOWN_ADDRESS)}`);
    const transaction = getDb().runTransaction(async (tx) => {
      const result = decideRateLimit(toState(await tx.get(ref)), policy, Date.now());
      if (result.allowed) {
        tx.set(ref, {
          count: result.next.count,
          windowStart: Timestamp.fromMillis(result.next.windowStartMs),
          expiresAt: Timestamp.fromMillis(rateLimitExpiresAtMs(result.next, policy)),
        });
      }
      return result;
    });
    decision = await withDeadline(
      transaction,
      FIRESTORE_READ_DEADLINE_MS,
      () => new Error(`Rate limit "${policy.id}" took over ${FIRESTORE_READ_DEADLINE_MS}ms`),
    );
  } catch (error) {
    logError(error, `rateLimit ${policy.id}: let through`);
    return;
  }
  if (!decision.allowed) {
    throw new ApiError(
      429,
      "rate_limited",
      `Over the "${policy.id}" limit for this address`,
      {},
      { "Retry-After": String(decision.retryAfterSeconds) },
    );
  }
}
