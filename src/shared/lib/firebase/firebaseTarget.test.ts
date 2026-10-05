import { describe, expect, test } from "bun:test";
import { dropBlankEmulatorVars, isLiveTarget, liveDataWarning, setEmulatorVars } from "./firebaseTarget";

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

describe("isLiveTarget", () => {
  test("needs the exact marker value", () => {
    expect(isLiveTarget({ MILLSTONE_FIREBASE_TARGET: "live" })).toBe(true);
    expect(isLiveTarget({ MILLSTONE_FIREBASE_TARGET: "staging" })).toBe(false);
    expect(isLiveTarget({ MILLSTONE_FIREBASE_TARGET: "" })).toBe(false);
    expect(isLiveTarget({})).toBe(false);
  });

  test("a Vercel production deployment is live; previews and development aren't", () => {
    expect(isLiveTarget({ VERCEL_ENV: "production" })).toBe(true);
    expect(isLiveTarget({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isLiveTarget({ VERCEL_ENV: "development" })).toBe(false);
  });
});

test("liveDataWarning names the project in a box", () => {
  const lines = liveDataWarning("millstone-dc47f").split("\n");
  expect(lines[1]).toContain("LIVE DATA: millstone-dc47f");
  expect(new Set(lines.map((line) => line.length)).size).toBe(1);
});
