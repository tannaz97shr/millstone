import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EMULATOR_ENV_VARS,
  LIVE_MARKER,
  LIVE_PROJECT_ID,
  LIVE_TARGET,
  liveDataWarning,
  setEmulatorVars,
} from "@/shared/lib/firebase/firebaseTarget";

// bun run dev:live
// `next dev` against the live Firebase project (the public site's data), with
// settings from .env.live.local (loaded by `bun --env-file`, see package.json).
//
// Next still loads .env.local (and .env.development*) in every dev run, but a
// variable already in the environment wins, even an empty one. So every
// emulator variable is passed blank, which shadows the emulator settings in
// those files. src/instrumentation.ts checks again once Next has loaded them.

const LIVE_FILE = ".env.live.local";
/** Files Next loads in dev, which live values override but don't replace. */
const NEXT_DEV_FILES = [".env.development.local", ".env.local", ".env.development", ".env"];

function fail(message: string): never {
  console.error(`dev:live refused: ${message}`);
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
const livePath = join(root, LIVE_FILE);
if (!existsSync(livePath)) {
  fail(`${LIVE_FILE} is missing. Copy .env.live.local.example and fill it in.`);
}

const emulatorVars = setEmulatorVars(process.env);
if (emulatorVars.length > 0) {
  fail(`${emulatorVars.join(", ")} set (in the shell or ${LIVE_FILE}). Live mode never uses the emulator.`);
}

const liveNames = new Set(namesIn(livePath));
const blanked = new Set<string>(EMULATOR_ENV_VARS);
const inherited = NEXT_DEV_FILES.flatMap((file) =>
  namesIn(join(root, file)).filter((name) => !liveNames.has(name) && !blanked.has(name)),
);
if (inherited.length > 0) {
  console.warn(`dev:live: also from the dev env files: ${[...new Set(inherited)].join(", ")}`);
}

console.warn(`\n${liveDataWarning(process.env.FIREBASE_PROJECT_ID ?? LIVE_PROJECT_ID)}\n`);

const env: NodeJS.ProcessEnv = { ...process.env, [LIVE_MARKER]: LIVE_TARGET };
for (const name of EMULATOR_ENV_VARS) env[name] = "";

const next = spawn(join(root, "node_modules", ".bin", "next"), ["dev", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => process.exit(code ?? 1));
