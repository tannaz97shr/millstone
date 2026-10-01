"use client";

import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";
import { cartContent } from "../content/cartContent";
import { useCart } from "../hooks/useCart";

const content = cartContent.placeholder;

/** Stands in for C4 until the cart step. Leads back to the menu the cart is for. */
export function CartPlaceholder() {
  const cartState = useCart();
  const cart = cartState.status === "ready" ? cartState.cart : null;

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="page-title">{content.title}</h1>
      <p className="text-ink-muted">{content.body}</p>
      <ButtonLink href={cart ? routes.menu(cart.branchId, cart.pickupDate) : routes.home} icon="left">
        {content.back}
      </ButtonLink>
    </section>
  );
}
