import { describe, expect, test } from "bun:test";
import type { FirebaseEnv } from "@/shared/lib/firebase/env";
import { resolveSeedTarget } from "./guard";

const STAGING = "millstone-dc47f";
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
    expect(() => resolveSeedTarget([], firebaseEnv(STAGING, EMULATOR), {})).toThrow(/demo-/);
  });

  test("no emulator and no --project is refused", () => {
    expect(() => resolveSeedTarget([], firebaseEnv(STAGING), {})).toThrow(/FIRESTORE_EMULATOR_HOST is not set/);
  });
});

describe("resolveSeedTarget on a real project", () => {
  test("--project=millstone-dc47f seeds staging", () => {
    expect(resolveSeedTarget([`--project=${STAGING}`], firebaseEnv(STAGING), {})).toEqual({
      projectId: STAGING,
      emulatorHost: null,
      reset: false,
    });
  });

  test("--reset is allowed on staging", () => {
    expect(resolveSeedTarget([`--project=${STAGING}`, "--reset"], firebaseEnv(STAGING), {}).reset).toBe(true);
  });

  test("any other project is refused, even when it matches the env", () => {
    expect(() => resolveSeedTarget(["--project=millstone-prod"], firebaseEnv("millstone-prod"), {})).toThrow(
      /isn't an allowed staging project/,
    );
    expect(() => resolveSeedTarget(["--project="], firebaseEnv(STAGING), {})).toThrow(
      /isn't an allowed staging project/,
    );
  });

  test("--project that doesn't match FIREBASE_PROJECT_ID is refused", () => {
    expect(() => resolveSeedTarget([`--project=${STAGING}`], firebaseEnv("demo-millstone"), {})).toThrow(
      /doesn't match FIREBASE_PROJECT_ID/,
    );
  });

  test("--project with any emulator variable set is refused", () => {
    expect(() =>
      resolveSeedTarget([`--project=${STAGING}`], firebaseEnv(STAGING, EMULATOR), { FIRESTORE_EMULATOR_HOST: EMULATOR }),
    ).toThrow(/FIRESTORE_EMULATOR_HOST is set/);
    expect(() =>
      resolveSeedTarget([`--project=${STAGING}`], firebaseEnv(STAGING), { FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199" }),
    ).toThrow(/FIREBASE_STORAGE_EMULATOR_HOST is set/);
  });

  test("blank emulator variables count as unset", () => {
    const raw = { FIRESTORE_EMULATOR_HOST: "", FIREBASE_STORAGE_EMULATOR_HOST: "" };
    expect(resolveSeedTarget([`--project=${STAGING}`], firebaseEnv(STAGING), raw).projectId).toBe(STAGING);
  });
});

test("NODE_ENV=production is always refused", () => {
  expect(() => resolveSeedTarget([], firebaseEnv("demo-millstone", EMULATOR), { NODE_ENV: "production" })).toThrow(
    /production/,
  );
  expect(() =>
    resolveSeedTarget([`--project=${STAGING}`], firebaseEnv(STAGING), { NODE_ENV: "production" }),
  ).toThrow(/production/);
});
