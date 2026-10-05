import { createPrivateKey } from "node:crypto";
import { describeBackend, privateKeyPem, readFirebaseEnv } from "@/shared/lib/firebase/env";
import { LIVE_MARKER, LIVE_TARGET } from "@/shared/lib/firebase/firebaseTarget";
import { logError } from "@/shared/utils/logError";

/**
 * Names the Firebase backend in one line, and stops a `dev:live` run whose
 * environment would reach an emulator (see scripts/live/dev.ts). On Vercel
 * the same problem is logged; the first Firestore call then fails as well.
 */
export function checkFirebaseBackend(): void {
  try {
    const env = readFirebaseEnv();
    console.log(describeBackend(env));
    checkPrivateKey(env);
  } catch (error) {
    logError(error, "instrumentation: Firebase environment");
    // Only the local launcher exits; a Vercel function keeps serving the error pages.
    if (process.env[LIVE_MARKER] === LIVE_TARGET) process.exit(1);
  }
}

/** A badly pasted key fails here with its name, instead of on the first request. Never logs the value. */
function checkPrivateKey(env: ReturnType<typeof readFirebaseEnv>): void {
  const pem = privateKeyPem(env);
  if (!pem) return;
  try {
    createPrivateKey(pem);
  } catch (error) {
    throw new Error(
      `FIREBASE_PRIVATE_KEY isn't a readable PEM key (${(error as NodeJS.ErrnoException).code ?? "unreadable"}). ` +
        'Paste the JSON\'s private_key value without its quotes, keeping each "\\n".',
    );
  }
}
