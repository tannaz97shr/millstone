import "server-only";
import { ApiError } from "@/shared/lib/api/apiError";
import { withDeadline } from "@/shared/utils/withDeadline";

// The Admin SDK keeps retrying an unreachable Firestore for a long time and
// has no per-call deadline. Every read goes through this so an outage is a
// quick 503 instead of a hanging request.

export const FIRESTORE_READ_DEADLINE_MS = 5_000;

/** `what` names the read in the log, e.g. "branches". */
export function firestoreRead<T>(read: Promise<T>, what: string): Promise<T> {
  return withDeadline(
    read,
    FIRESTORE_READ_DEADLINE_MS,
    () =>
      new ApiError(503, "unavailable", `Firestore read "${what}" took over ${FIRESTORE_READ_DEADLINE_MS}ms`),
  );
}
