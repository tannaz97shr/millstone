import { describe, expect, test } from "bun:test";
import { formatPhone } from "./phone";

describe("formatPhone", () => {
  test("mobiles read 0491 570 156", () => {
    expect(formatPhone("0491570156")).toBe("0491 570 156");
  });

  test("landlines read 03 7010 2140, without parentheses", () => {
    expect(formatPhone("0370102140")).toBe("03 7010 2140");
    expect(formatPhone("0355501120")).toBe("03 5550 1120");
  });

  test("spaces and punctuation in the stored value are ignored", () => {
    expect(formatPhone("(03) 7010 1120")).toBe("03 7010 1120");
    expect(formatPhone("0491 570 006")).toBe("0491 570 006");
  });

  test("anything that isn't a 10-digit local number is shown as stored", () => {
    expect(formatPhone("+61 491 570 156")).toBe("+61 491 570 156");
    expect(formatPhone("049157015")).toBe("049157015");
    expect(formatPhone("1370102140")).toBe("1370102140");
    expect(formatPhone("")).toBe("");
  });
});
