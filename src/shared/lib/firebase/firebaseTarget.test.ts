import { describe, expect, test } from "bun:test";
import { dropBlankEmulatorVars, isStagingTarget, setEmulatorVars } from "./firebaseTarget";

describe("setEmulatorVars", () => {
  test("names only the emulator variables that hold a value", () => {
    expect(
      setEmulatorVars({ FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", STORAGE_EMULATOR_HOST: "", OTHER: "x" }),
    ).toEqual(["FIRESTORE_EMULATOR_HOST"]);
  });
});

describe("dropBlankEmulatorVars", () => {
  test("removes blank emulator variables, so @google-cloud/storage never sees an empty endpoint", () => {
    const env: Record<string, string | undefined> = {
      STORAGE_EMULATOR_HOST: "",
      FIREBASE_STORAGE_EMULATOR_HOST: "",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      OTHER: "",
    };
    dropBlankEmulatorVars(env);
    expect(env).toEqual({ FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", OTHER: "" });
    expect("STORAGE_EMULATOR_HOST" in env).toBe(false);
  });
});

test("isStagingTarget needs the exact marker value", () => {
  expect(isStagingTarget({ MILLSTONE_FIREBASE_TARGET: "staging" })).toBe(true);
  expect(isStagingTarget({ MILLSTONE_FIREBASE_TARGET: "" })).toBe(false);
  expect(isStagingTarget({})).toBe(false);
});
