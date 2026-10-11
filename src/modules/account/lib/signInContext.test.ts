import { describe, expect, test } from "bun:test";
import { signInPlace } from "./signInContext";

describe("signInPlace", () => {
  test("from checkout: back to checkout, and back there afterwards", () => {
    expect(signInPlace("/checkout")).toEqual({ context: "checkout", returnTo: "/checkout", backHref: "/checkout" });
  });

  test("from a menu: back to that menu with its day", () => {
    expect(signInPlace("/menu/fitzroy?date=2026-10-10")).toEqual({
      context: "menu",
      returnTo: "/menu/fitzroy?date=2026-10-10",
      backHref: "/menu/fitzroy?date=2026-10-10",
    });
  });

  test("from home: back home, then home again", () => {
    expect(signInPlace("/")).toEqual({ context: "home", returnTo: "/", backHref: "/" });
  });

  test("a recurring-order page says why an account is needed, returns there, with Home as the back link", () => {
    for (const path of ["/account/recurring", "/account/recurring/new", "/account/recurring/abc123/edit"]) {
      expect(signInPlace(path)).toEqual({ context: "recurring", returnTo: path, backHref: "/" });
    }
  });

  test("a path that only starts like the recurring pages isn't one", () => {
    expect(signInPlace("/account/recurringx").context).toBe("home");
  });

  test("a gated account page returns there, with Home as the back link", () => {
    expect(signInPlace("/account/orders/abc")).toEqual({
      context: "home",
      returnTo: "/account/orders/abc",
      backHref: "/",
    });
  });

  test("nothing, or anything unsafe, goes to My account with Home as the back link", () => {
    for (const value of [null, undefined, "", "https://evil.example/checkout", "/admin"]) {
      expect(signInPlace(value)).toEqual({ context: "home", returnTo: "/account", backHref: "/" });
    }
  });
});
