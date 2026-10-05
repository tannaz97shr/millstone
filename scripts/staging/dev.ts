import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EMULATOR_ENV_VARS,
  setEmulatorVars,
  STAGING_MARKER,
  STAGING_TARGET,
} from "@/shared/lib/firebase/firebaseTarget";

// bun run dev:staging
// `next dev` against the real Firebase project, with settings from
// .env.staging.local (loaded by `bun --env-file`, see package.json).
//
// Next still loads .env.local (and .env.development*) in every dev run, but a
// variable already in the environment wins, even an empty one. So every
// emulator variable is passed blank, which shadows the emulator settings in
// those files. src/instrumentation.ts checks again once Next has loaded them.

const STAGING_FILE = ".env.staging.local";
/** Files Next loads in dev, which staging values override but don't replace. */
const NEXT_DEV_FILES = [".env.development.local", ".env.local", ".env.development", ".env"];

function fail(message: string): never {
  console.error(`dev:staging refused: ${message}`);
  process.exit(1);
}

/** Variable names in an env file. Values are never read into anything. */
function namesIn(path: string): string[] {
  if (!existsSync(path)) return [];
  const names = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => /^\s*(?:export\s+)?([\w.-]+)\s*=/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

const root = process.cwd();
const stagingPath = join(root, STAGING_FILE);
if (!existsSync(stagingPath)) {
  fail(`${STAGING_FILE} is missing. Copy .env.staging.local.example and fill it in.`);
}

const emulatorVars = setEmulatorVars(process.env);
if (emulatorVars.length > 0) {
  fail(`${emulatorVars.join(", ")} set (in the shell or ${STAGING_FILE}). Staging never uses the emulator.`);
}

const stagingNames = new Set(namesIn(stagingPath));
const blanked = new Set<string>(EMULATOR_ENV_VARS);
const inherited = NEXT_DEV_FILES.flatMap((file) =>
  namesIn(join(root, file)).filter((name) => !stagingNames.has(name) && !blanked.has(name)),
);
if (inherited.length > 0) {
  console.warn(`dev:staging: also from the dev env files: ${[...new Set(inherited)].join(", ")}`);
}

const env: NodeJS.ProcessEnv = { ...process.env, [STAGING_MARKER]: STAGING_TARGET };
for (const name of EMULATOR_ENV_VARS) env[name] = "";

const next = spawn(join(root, "node_modules", ".bin", "next"), ["dev", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => process.exit(code ?? 1));
