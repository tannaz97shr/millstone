"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/shared/routes";
import { cartContent } from "../content/cartContent";
import { cartMessageScope, pushCartMessage } from "../hooks/useCartMessages";
import { takeSignInLeftOut } from "../lib/cartStorage";

/**
 * Says what signing in left out of the cart (mergeCartOnSignIn), as a cart
 * message: on that branch's menu if that's where the customer landed,
 * otherwise on C4 (C5 sends the customer there to read it, as for any cart
 * change). Placed after the page in the layout, so its effect runs after the
 * page's own (C5 clears old messages as it opens). Renders nothing.
 */
export function SignInCartNotice() {
  const pathname = usePathname();
  useEffect(() => {
    const leftOut = takeSignInLeftOut();
    if (!leftOut) return;
    const onItsMenu = pathname.startsWith(routes.menu(leftOut.branchId));
    const scope = onItsMenu ? cartMessageScope.menu(leftOut.branchId) : cartMessageScope.cart(leftOut.branchId);
    pushCartMessage(scope, cartContent.signInLeftOut(leftOut.names));
  }, [pathname]);
  return null;
}
