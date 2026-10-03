import { describe, expect, test } from "bun:test";
import type { Weekday } from "@/shared/domain";
import { toIsoDate } from "@/shared/utils/pickup-dates";
import { branchDateMovedMessage, removalMessages } from "./removalMessages";

describe("branchDateMovedMessage", () => {
  const TUE = toIsoDate("2026-10-06");
  const WED = toIsoDate("2026-10-07");
  const fitzroy = (closedDays: Weekday[]) => ({ name: "Fitzroy", closedDays });

  test("the new branch is closed that day", () => {
    expect(branchDateMovedMessage(fitzroy([1, 2]), TUE, WED)).toBe(
      "Fitzroy is closed on Tue 6 Oct, so your pickup is now Wed 7 Oct.",
    );
  });

  test("open that day but past its cutoff: orders have closed", () => {
    expect(branchDateMovedMessage(fitzroy([1]), TUE, WED)).toBe(
      "Orders for Tue 6 Oct have closed, so your pickup is now Wed 7 Oct.",
    );
  });
});

const none = { notMadeHere: [], soldOut: [], noLongerOffered: [] };

describe("removalMessages", () => {
  test("nothing removed, nothing said", () => {
    expect(removalMessages(none, "Fitzroy", "Wed 30 Sep")).toEqual([]);
  });

  test("AC-C2: the design's sentence for an item the branch doesn't make", () => {
    expect(
      removalMessages({ ...none, notMadeHere: ["Sourdough rye loaf"] }, "Fitzroy", "Wed 30 Sep"),
    ).toEqual(["We took Sourdough rye loaf out of your order because Fitzroy doesn't make it."]);
  });

  test("one sentence per reason, in a fixed order", () => {
    const messages = removalMessages(
      {
        noLongerOffered: ["Fruit loaf"],
        soldOut: ["Cinnamon scroll", "Plain bagel"],
        notMadeHere: ["Sourdough rye loaf"],
      },
      "Fitzroy",
      "Thu 1 Oct",
    );
    expect(messages).toEqual([
      "We took Sourdough rye loaf out of your order because Fitzroy doesn't make it.",
      "Cinnamon scroll and Plain bagel are sold out for Thu 1 Oct, so we took them out of your order. Pick another day if you need them.",
      "We took Fruit loaf out of your order because it's no longer on the Fitzroy menu.",
    ]);
  });
});
