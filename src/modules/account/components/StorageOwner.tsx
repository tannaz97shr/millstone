"use client";

import { GUEST_CART_OWNER, setStorageOwner } from "@/modules/cart/lib/cartStorage";
import { useAccountSession } from "../hooks/useAccountSession";

/**
 * Points the cart and checkout draft at the signed-in customer's storage, or
 * the guest's. It sets the owner while rendering, ahead of the page, so the
 * cart's first read is already the right one; signing in carries the guest
 * cart over (mergeCartOnSignIn). While the session is still unknown (its
 * prefetch failed), the guest's is used until it arrives. Renders nothing.
 */
export function StorageOwner() {
  const session = useAccountSession();
  setStorageOwner(session.data?.customer?.id ?? GUEST_CART_OWNER);
  return null;
}
