import { describe, expect, test } from "bun:test";
import {
  buildSearchTokens,
  matchesAllTokens,
  parseSearchQuery,
  primarySearchToken,
} from "./orderSearch";

const cafe = { orderNumber: "MS-1042", contactName: "Corner Cup Cafe", contactPhone: "0370101120" };
const sam = { orderNumber: "MS-1043", contactName: "Sam Carter", contactPhone: "0491570156" };

const finds = (order: typeof cafe, query: string) => {
  const tokens = parseSearchQuery(query);
  return tokens.length > 0 && matchesAllTokens(buildSearchTokens(order), tokens);
};

describe("buildSearchTokens", () => {
  test("order number with and without the prefix", () => {
    const tokens = buildSearchTokens(cafe);
    expect(tokens).toContain("1042");
    expect(tokens).toContain("ms1042");
  });

  test("name word prefixes from two letters", () => {
    const tokens = buildSearchTokens(cafe);
    for (const token of ["co", "cor", "corner", "cu", "cup", "ca", "cafe"]) expect(tokens).toContain(token);
    expect(tokens).not.toContain("c");
    expect(tokens).not.toContain("orner");
  });

  test("phone suffixes from three digits and prefixes from four", () => {
    const tokens = buildSearchTokens(sam);
    for (const token of ["156", "0156", "570156", "0491570156", "0491", "049157"]) expect(tokens).toContain(token);
    expect(tokens).not.toContain("15");
    expect(tokens).not.toContain("049");
  });

  test("accents are dropped and there are no duplicates", () => {
    const tokens = buildSearchTokens({ orderNumber: "MS-1001", contactName: "Zoë Zoe", contactPhone: "0491570006" });
    expect(tokens).toContain("zoe");
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  test("stays small", () => {
    expect(buildSearchTokens(cafe).length).toBeLessThan(60);
  });
});

describe("parseSearchQuery", () => {
  test.each([
    ["MS-1042", ["1042"]],
    ["ms 1042", ["1042"]],
    ["ms1042", ["1042"]],
    ["1042", ["1042"]],
    ["0491 570 156", ["0491570156"]],
    ["+61 491 570 156", ["0491570156"]],
    ["+61491570156", ["0491570156"]],
    ["(03) 7010-1120", ["0370101120"]],
    ["  Priya   NAIR ", ["priya", "nair"]],
  ])("%p", (query, expected) => {
    expect(parseSearchQuery(query)).toEqual(expected);
  });

  test("too-short words are dropped", () => {
    expect(parseSearchQuery("a")).toEqual([]);
    expect(parseSearchQuery("15")).toEqual([]);
    expect(parseSearchQuery("j bell")).toEqual(["bell"]);
  });
});

describe("matching", () => {
  test.each([
    ["MS-1042", true],
    ["1042", true],
    ["corner cup", true],
    ["Cup", true],
    ["corner tea", false],
    ["03 7010 1120", true],
    ["1120", true],
    ["7010", false],
  ])("cafe by %p → %p", (query, expected) => {
    expect(finds(cafe, query)).toBe(expected);
  });

  test("phone by its last digits or the whole number", () => {
    expect(finds(sam, "156")).toBe(true);
    expect(finds(sam, "0491 570 156")).toBe(true);
    expect(finds(sam, "+61 491 570 156")).toBe(true);
    expect(finds(sam, "sam 156")).toBe(true);
    expect(finds(sam, "1042")).toBe(false);
  });

  test("the longest token goes to Firestore", () => {
    expect(primarySearchToken(["sam", "carter"])).toBe("carter");
    expect(primarySearchToken([])).toBeNull();
  });
});
