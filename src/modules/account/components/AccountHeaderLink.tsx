"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";
import { accountContent } from "../content/accountContent";
import { useAccountSession } from "../hooks/useAccountSession";

/** The designs put it on C1 and C2 only; other screens have their own way in. */
function showsOn(pathname: string): boolean {
  return pathname === routes.home || pathname.startsWith(routes.menu(""));
}

/**
 * C1/C2 header: "Sign in" for a guest (back to this page afterwards), "My
 * account" once signed in. Nothing until the session is known, so it never
 * flips from one to the other.
 */
export function AccountHeaderLink() {
  const pathname = usePathname();
  const session = useAccountSession();
  if (!showsOn(pathname) || !session.data) return null;
  const signedIn = session.data.customer !== null;
  return (
    // -mr-2: the quiet button's text lines up with the page gutter, as in the design.
    <ButtonLink
      href={signedIn ? routes.account.home : routes.account.signIn(pathname)}
      variant="quiet"
      className="-mr-2"
    >
      {signedIn ? accountContent.header.myAccount : accountContent.header.signIn}
    </ButtonLink>
  );
}
