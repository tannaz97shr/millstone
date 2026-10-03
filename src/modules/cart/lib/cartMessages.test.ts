import { afterEach, describe, expect, test } from "bun:test";
import {
  cartMessageScope,
  clearCartMessages,
  getCartMessages,
  messagesFor,
  pushCartMessage,
} from "./cartMessages";

const menuNorthcote = cartMessageScope.menu("northcote");
const cartNorthcote = cartMessageScope.cart("northcote");
const cartFitzroy = cartMessageScope.cart("fitzroy");

afterEach(clearCartMessages);

describe("cart messages", () => {
  test("shown only in the scope they were pushed for", () => {
    pushCartMessage(cartNorthcote, "A");
    expect(messagesFor(getCartMessages(), cartNorthcote)).toEqual(["A"]);
    // The menu for the same branch doesn't repeat what C4 said.
    expect(messagesFor(getCartMessages(), menuNorthcote)).toEqual([]);
  });

  test("the same sentence twice shows once", () => {
    pushCartMessage(cartNorthcote, "A");
    pushCartMessage(cartNorthcote, "A");
    pushCartMessage(cartNorthcote, "B");
    expect(messagesFor(getCartMessages(), cartNorthcote)).toEqual(["A", "B"]);
  });

  test("a message for another scope replaces the old ones", () => {
    pushCartMessage(cartNorthcote, "A");
    pushCartMessage(cartFitzroy, "B");
    expect(messagesFor(getCartMessages(), cartNorthcote)).toEqual([]);
    expect(messagesFor(getCartMessages(), cartFitzroy)).toEqual(["B"]);
  });

  test("clearing empties every scope", () => {
    pushCartMessage(cartFitzroy, "B");
    clearCartMessages();
    expect(messagesFor(getCartMessages(), cartFitzroy)).toEqual([]);
  });
});
