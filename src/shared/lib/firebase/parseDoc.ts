import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { z } from "zod";
import { logError } from "@/shared/utils/logError";

/**
 * Validates a snapshot's data against the entity's stored-doc schema.
 * Missing docs and bad data are logged with the doc path, then thrown.
 */
export function parseDoc<Schema extends z.ZodType>(
  schema: Schema,
  snapshot: DocumentSnapshot,
): z.output<Schema> {
  const context = `parseDoc ${snapshot.ref.path}`;
  if (!snapshot.exists) {
    const error = new Error(`Document not found: ${snapshot.ref.path}`);
    logError(error, context);
    throw error;
  }
  const result = schema.safeParse(snapshot.data());
  if (!result.success) {
    const error = new Error(`Invalid document ${snapshot.ref.path}`, { cause: result.error });
    logError(error, context);
    throw error;
  }
  return result.data;
}
