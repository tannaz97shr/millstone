import { describe, expect, test } from "bun:test";
import { formatPhone, parseAuMobile } from "./phone";

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

describe("parseAuMobile", () => {
  test("a mobile typed with spaces, dashes or brackets is stored as digits", () => {
    expect(parseAuMobile("0491 570 156")).toBe("0491570156");
    expect(parseAuMobile(" 0491-570-156 ")).toBe("0491570156");
    expect(parseAuMobile("(0491) 570.156")).toBe("0491570156");
  });

  test("+61 and 61 become a leading 0", () => {
    expect(parseAuMobile("+61 491 570 156")).toBe("0491570156");
    expect(parseAuMobile("61491570156")).toBe("0491570156");
  });

  test("landlines, short or long numbers, and letters are refused", () => {
    expect(parseAuMobile("03 7010 2140")).toBeNull();
    expect(parseAuMobile("+61 3 7010 2140")).toBeNull();
    expect(parseAuMobile("0491 570")).toBeNull();
    expect(parseAuMobile("0491 570 1566")).toBeNull();
    expect(parseAuMobile("0491 570 15a")).toBeNull();
    expect(parseAuMobile("")).toBeNull();
  });
});
