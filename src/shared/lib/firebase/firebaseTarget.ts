// Which Firebase backend a process talks to. Plain module (no "server-only")
// so the live launcher in scripts/ can share it with the app.

/** Every variable that sends a Firebase or Google Cloud SDK to an emulator. */
export const EMULATOR_ENV_VARS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
  "STORAGE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_DATABASE_EMULATOR_HOST",
  "FIREBASE_EMULATOR_HUB",
] as const;

/** Set by `bun run dev:live`; never written in an env file. */
export const LIVE_MARKER = "MILLSTONE_FIREBASE_TARGET";
export const LIVE_TARGET = "live";

/** The one live project: the public site's data. */
export const LIVE_PROJECT_ID = "millstone-dc47f";

/** The emulator variables that hold a value. An empty string counts as unset, as it does for the SDKs. */
export function setEmulatorVars(env: Record<string, string | undefined>): string[] {
  return EMULATOR_ENV_VARS.filter((name) => Boolean(env[name]));
}

/**
 * Removes emulator variables that are set but blank. `dev:live` passes them
 * blank to shadow .env.local, but @google-cloud/storage treats any string in
 * STORAGE_EMULATOR_HOST, even "", as its endpoint. Called before Firebase starts.
 */
export function dropBlankEmulatorVars(env: Record<string, string | undefined>): void {
  for (const name of EMULATOR_ENV_VARS) {
    if (env[name] === "") delete env[name];
  }
}

/**
 * True for a process that must reach the live project and never an emulator:
 * `bun run dev:live`, or a Vercel production deployment.
 */
export function isLiveTarget(env: Record<string, string | undefined>): boolean {
  return env[LIVE_MARKER] === LIVE_TARGET || env.VERCEL_ENV === "production";
}

/** The warning `dev:live` and `seed:live` print before they start. */
export function liveDataWarning(projectId: string): string {
  const lines = [
    `LIVE DATA: ${projectId}`,
    "Orders, edits and photos you make here are real",
    "and visible on the public site.",
  ];
  const width = Math.max(...lines.map((line) => line.length));
  const rule = `+${"-".repeat(width + 2)}+`;
  return [rule, ...lines.map((line) => `| ${line.padEnd(width)} |`), rule].join("\n");
}
