import { isUsingEmulator, type FirebaseEnv } from "@/shared/lib/firebase/env";

// The seed writes and can wipe data, so it only runs against the local
// emulator (a "demo-" project that can't exist in the cloud) or an explicitly
// named dev project.

export interface SeedTarget {
  projectId: string;
  emulatorHost: string | null;
  reset: boolean;
}

const DEMO_PROJECT_PREFIX = "demo-";

export function resolveSeedTarget(
  argv: string[],
  env: FirebaseEnv,
  nodeEnv: string | undefined,
): SeedTarget {
  const reset = argv.includes("--reset");
  const projectFlag = argv.find((arg) => arg.startsWith("--project="))?.split("=")[1];
  const projectId = env.FIREBASE_PROJECT_ID;

  if (nodeEnv === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  if (isUsingEmulator(env) && env.FIRESTORE_EMULATOR_HOST) {
    if (!projectId.startsWith(DEMO_PROJECT_PREFIX)) {
      throw new Error(
        `Refusing to seed: emulator runs should use a "${DEMO_PROJECT_PREFIX}" project ID, got "${projectId}".`,
      );
    }
    return { projectId, emulatorHost: env.FIRESTORE_EMULATOR_HOST, reset };
  }

  if (!projectFlag) {
    throw new Error(
      "Refusing to seed: FIRESTORE_EMULATOR_HOST is not set. Start the emulator " +
        "(bun run emulators), or pass --project=<id> to seed a real dev project on purpose.",
    );
  }
  if (projectFlag !== projectId) {
    throw new Error(
      `Refusing to seed: --project=${projectFlag} doesn't match FIREBASE_PROJECT_ID (${projectId}).`,
    );
  }
  if (reset) {
    throw new Error("Refusing to seed: --reset only works against the emulator.");
  }
  return { projectId, emulatorHost: null, reset: false };
}

/** Deletes every Firestore document in the emulator (emulator-only endpoint). */
export async function resetEmulator(target: SeedTarget): Promise<void> {
  if (!target.emulatorHost) throw new Error("Reset is only allowed against the emulator.");
  const url = `http://${target.emulatorHost}/emulator/v1/projects/${target.projectId}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Emulator reset failed: ${response.status} ${response.statusText}`);
  }
}
