import { describeBackend, readFirebaseEnv } from "@/shared/lib/firebase/env";
import { isStagingTarget } from "@/shared/lib/firebase/firebaseTarget";
import { logError } from "@/shared/utils/logError";

/**
 * Names the Firebase backend in one line, and stops a staging run whose
 * environment would reach an emulator (see scripts/staging/dev.ts).
 */
export function checkFirebaseBackend(): void {
  try {
    console.log(describeBackend(readFirebaseEnv()));
  } catch (error) {
    logError(error, "instrumentation: Firebase environment");
    if (isStagingTarget(process.env)) process.exit(1);
  }
}
