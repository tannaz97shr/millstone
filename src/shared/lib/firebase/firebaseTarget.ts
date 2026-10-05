// Which Firebase backend a process talks to. Plain module (no "server-only")
// so the staging launcher in scripts/ can share it with the app.

/** Every variable that sends a Firebase or Google Cloud SDK to an emulator. */
export const EMULATOR_ENV_VARS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
  "STORAGE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_DATABASE_EMULATOR_HOST",
  "FIREBASE_EMULATOR_HUB",
] as const;

/** Set by `bun run dev:staging`; never written in an env file. */
export const STAGING_MARKER = "MILLSTONE_FIREBASE_TARGET";
export const STAGING_TARGET = "staging";

/** The emulator variables that hold a value. An empty string counts as unset, as it does for the SDKs. */
export function setEmulatorVars(env: Record<string, string | undefined>): string[] {
  return EMULATOR_ENV_VARS.filter((name) => Boolean(env[name]));
}

/**
 * Removes emulator variables that are set but blank. `dev:staging` passes them
 * blank to shadow .env.local, but @google-cloud/storage treats any string in
 * STORAGE_EMULATOR_HOST, even "", as its endpoint. Called before Firebase starts.
 */
export function dropBlankEmulatorVars(env: Record<string, string | undefined>): void {
  for (const name of EMULATOR_ENV_VARS) {
    if (env[name] === "") delete env[name];
  }
}

export function isStagingTarget(env: Record<string, string | undefined>): boolean {
  return env[STAGING_MARKER] === STAGING_TARGET;
}
