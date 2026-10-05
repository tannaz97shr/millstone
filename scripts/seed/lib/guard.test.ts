import { describe, expect, test } from "bun:test";
import type { FirebaseEnv } from "@/shared/lib/firebase/env";
import { resolveSeedTarget } from "./guard";

const LIVE = "millstone-dc47f";
const EMULATOR = "127.0.0.1:8080";

function firebaseEnv(projectId: string, emulatorHost?: string): FirebaseEnv {
  return {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
    FIRESTORE_EMULATOR_HOST: emulatorHost,
  } as FirebaseEnv;
}

describe("resolveSeedTarget on the emulator", () => {
  test("a demo- project seeds the emulator", () => {
    expect(resolveSeedTarget([], firebaseEnv("demo-millstone", EMULATOR), {})).toEqual({
      projectId: "demo-millstone",
      emulatorHost: EMULATOR,
      reset: false,
    });
  });

  test("--reset is allowed on the emulator", () => {
    expect(resolveSeedTarget(["--reset"], firebaseEnv("demo-millstone", EMULATOR), {}).reset).toBe(true);
  });

  test("a non-demo project ID on the emulator is refused", () => {
    expect(() => resolveSeedTarget([], firebaseEnv(LIVE, EMULATOR), {})).toThrow(/demo-/);
  });

  test("no emulator and no --project is refused", () => {
    expect(() => resolveSeedTarget([], firebaseEnv(LIVE), {})).toThrow(/FIRESTORE_EMULATOR_HOST is not set/);
  });
});

describe("resolveSeedTarget on a real project", () => {
  test("--project=millstone-dc47f seeds the live project", () => {
    expect(resolveSeedTarget([`--project=${LIVE}`], firebaseEnv(LIVE), {})).toEqual({
      projectId: LIVE,
      emulatorHost: null,
      reset: false,
    });
  });

  test("--reset is refused on the live project, before anything else is checked", () => {
    expect(() => resolveSeedTarget([`--project=${LIVE}`, "--reset"], firebaseEnv(LIVE), {})).toThrow(
      /Refusing to reset: millstone-dc47f is a real project/,
    );
    expect(() =>
      resolveSeedTarget(["--reset", `--project=${LIVE}`], firebaseEnv(LIVE), { FIRESTORE_EMULATOR_HOST: EMULATOR }),
    ).toThrow(/Refusing to reset/);
    expect(() => resolveSeedTarget(["--project=millstone-prod", "--reset"], firebaseEnv("millstone-prod"), {})).toThrow(
      /Refusing to reset/,
    );
  });

  test("any other project is refused, even when it matches the env", () => {
    expect(() => resolveSeedTarget(["--project=millstone-prod"], firebaseEnv("millstone-prod"), {})).toThrow(
      /isn't the live project/,
    );
    expect(() => resolveSeedTarget(["--project="], firebaseEnv(LIVE), {})).toThrow(
      /isn't the live project/,
    );
  });

  test("--project that doesn't match FIREBASE_PROJECT_ID is refused", () => {
    expect(() => resolveSeedTarget([`--project=${LIVE}`], firebaseEnv("demo-millstone"), {})).toThrow(
      /doesn't match FIREBASE_PROJECT_ID/,
    );
  });

  test("--project with any emulator variable set is refused", () => {
    expect(() =>
      resolveSeedTarget([`--project=${LIVE}`], firebaseEnv(LIVE, EMULATOR), { FIRESTORE_EMULATOR_HOST: EMULATOR }),
    ).toThrow(/FIRESTORE_EMULATOR_HOST is set/);
    expect(() =>
      resolveSeedTarget([`--project=${LIVE}`], firebaseEnv(LIVE), { FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199" }),
    ).toThrow(/FIREBASE_STORAGE_EMULATOR_HOST is set/);
  });

  test("blank emulator variables count as unset", () => {
    const raw = { FIRESTORE_EMULATOR_HOST: "", FIREBASE_STORAGE_EMULATOR_HOST: "" };
    expect(resolveSeedTarget([`--project=${LIVE}`], firebaseEnv(LIVE), raw).projectId).toBe(LIVE);
  });
});

test("NODE_ENV=production is always refused", () => {
  expect(() => resolveSeedTarget([], firebaseEnv("demo-millstone", EMULATOR), { NODE_ENV: "production" })).toThrow(
    /production/,
  );
  expect(() =>
    resolveSeedTarget([`--project=${LIVE}`], firebaseEnv(LIVE), { NODE_ENV: "production" }),
  ).toThrow(/production/);
});
