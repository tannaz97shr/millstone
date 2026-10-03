import { describe, expect, test } from "bun:test";
import { listNames } from "./listNames";

describe("listNames", () => {
  test("one name as is", () => {
    expect(listNames(["Sourdough rye loaf"])).toBe("Sourdough rye loaf");
  });

  test("two names joined with and", () => {
    expect(listNames(["Fruit loaf", "Plain bagel"])).toBe("Fruit loaf and Plain bagel");
  });

  test("three or more: no comma before and", () => {
    expect(listNames(["A", "B", "C"])).toBe("A, B and C");
  });

  test("empty list is an empty string", () => {
    expect(listNames([])).toBe("");
  });
});
