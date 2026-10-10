import { describe, expect, test } from "bun:test";
import type { CustomerId, IsoDate, Order } from "@/shared/domain";
import { planAccountFromOrder, type AccountFromOrderInput } from "./planAccountFromOrder";

// Instants are written in UTC. Melbourne is +10 (AEST) until 02:00 on
// Sun 4 Oct 2026, then +11 (AEDT).

const at = (utc: string) => new Date(utc);
const guest = { passwordHash: null, ownsEmail: true };
const customerId = "cust-1" as CustomerId;

function input(
  order: Partial<AccountFromOrderInput["order"]> = {},
  customer: AccountFromOrderInput["customer"] = guest,
  now = at("2026-10-07T00:00:00Z"),
): AccountFromOrderInput {
  return {
    order: {
      status: "placed",
      accountId: null,
      customerId,
      pickupDate: "2026-10-08" as IsoDate,
      ...order,
    },
    customer,
    now,
  };
}

describe("planAccountFromOrder", () => {
  test("a guest's placed order before its pickup day gets the offer", () => {
    expect(planAccountFromOrder(input())).toEqual({ kind: "offer" });
  });

  test.each(["placed", "ready", "collected"] as Order["status"][])("%s orders get the offer", (status) => {
    expect(planAccountFromOrder(input({ status })).kind).toBe("offer");
  });

  test.each(["awaiting_payment", "expired", "cancelled"] as Order["status"][])("%s orders don't", (status) => {
    expect(planAccountFromOrder(input({ status }))).toEqual({ kind: "refuse", reason: "not_eligible" });
  });

  test("an order already in an account is refused first", () => {
    expect(planAccountFromOrder(input({ accountId: customerId }, { passwordHash: "scrypt$…", ownsEmail: true }))).toEqual({
      kind: "refuse",
      reason: "already_linked",
    });
  });

  test("an email that already has an account is refused", () => {
    expect(planAccountFromOrder(input({}, { passwordHash: "scrypt$…", ownsEmail: true }))).toEqual({
      kind: "refuse",
      reason: "account_exists",
    });
  });

  test("a guest record whose email an account has since taken is refused as the account's", () => {
    expect(planAccountFromOrder(input({}, { passwordHash: null, ownsEmail: false }))).toEqual({
      kind: "refuse",
      reason: "account_exists",
    });
  });

  test("no customer record (or no link to one) isn't eligible", () => {
    expect(planAccountFromOrder(input({}, null))).toEqual({ kind: "refuse", reason: "not_eligible" });
    expect(planAccountFromOrder(input({ customerId: null }))).toEqual({ kind: "refuse", reason: "not_eligible" });
  });

  describe("the offer lasts until the end of the pickup day, Melbourne time", () => {
    const pickup = { pickupDate: "2026-10-01" as IsoDate };
    test("23:59 on the pickup day (AEST, +10) still counts", () => {
      expect(planAccountFromOrder(input(pickup, guest, at("2026-10-01T13:59:00Z"))).kind).toBe("offer");
    });
    test("midnight after it is too late", () => {
      expect(planAccountFromOrder(input(pickup, guest, at("2026-10-01T14:00:00Z")))).toEqual({
        kind: "refuse",
        reason: "window_closed",
      });
    });
  });

  describe("across the daylight-saving change (Sun 4 Oct 2026, +10 → +11)", () => {
    const pickup = { pickupDate: "2026-10-04" as IsoDate };
    test("23:59 AEDT on the pickup day still counts", () => {
      expect(planAccountFromOrder(input(pickup, guest, at("2026-10-04T12:59:00Z"))).kind).toBe("offer");
    });
    test("midnight AEDT (13:00 UTC) is too late, an hour earlier in UTC than the day before", () => {
      expect(planAccountFromOrder(input(pickup, guest, at("2026-10-04T13:00:00Z"))).kind).toBe("refuse");
    });
  });
});
