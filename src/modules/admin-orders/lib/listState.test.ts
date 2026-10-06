import { describe, expect, test } from "bun:test";
import { adminOrdersContent } from "../content/adminOrdersContent";
import { type ListStateInput, listState, staleSummary } from "./listState";

const base: ListStateInput = { hasData: true, isPlaceholderData: false, isError: false, typing: false };
const state = (changes: Partial<ListStateInput>) => listState({ ...base, ...changes });

describe("listState", () => {
  test("first load: loading, then error if it fails", () => {
    expect(state({ hasData: false })).toBe("loading");
    expect(state({ hasData: false, isError: true })).toBe("error");
  });

  test("a changed search or filter in flight: the previous rows are stale", () => {
    expect(state({ isPlaceholderData: true })).toBe("stale");
  });

  test("search text typed but not applied yet: stale", () => {
    expect(state({ typing: true })).toBe("stale");
    expect(state({ typing: true, isPlaceholderData: true })).toBe("stale");
  });

  test("the 30-second refresh of the same query keeps the list current", () => {
    // Same key: TanStack keeps the data as real data, not placeholder, while it refetches.
    expect(state({})).toBe("current");
  });

  test("a failed refresh of the same query keeps the last good list current", () => {
    expect(state({ isError: true })).toBe("current");
  });

  test("a changed query that fails drops the placeholder: error, not stale", () => {
    expect(state({ hasData: false, isError: true, isPlaceholderData: false })).toBe("error");
  });

  test("results arrived and typing settled: current", () => {
    expect(state({ isPlaceholderData: false, typing: false })).toBe("current");
  });
});

describe("staleSummary", () => {
  test("a search says Searching…", () => {
    expect(staleSummary("MS-1047")).toBe(adminOrdersContent.status.searching);
  });

  test("a filter change, or a cleared search, says Loading orders…", () => {
    expect(staleSummary("")).toBe(adminOrdersContent.load.loading);
    expect(staleSummary("   ")).toBe(adminOrdersContent.load.loading);
  });
});
