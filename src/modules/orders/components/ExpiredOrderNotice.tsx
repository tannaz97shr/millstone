import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { routes } from "@/shared/routes";
import { confirmationContent as content } from "../content/confirmationContent";
import type { OrderConfirmation } from "../types/orderConfirmation";

/**
 * Undesigned: an online order whose payment page closed unpaid. It was never
 * placed (spec 7), so there's no order number to show, only what happened.
 */
export function ExpiredOrderNotice({ order }: { order: OrderConfirmation }) {
  return (
    <>
      <h1 className="page-title">{content.expired.title}</h1>
      <Notice tone="neutral" role="note">
        {content.expired.body}
      </Notice>
      <ButtonLink href={routes.menu(order.branch.id)} block>
        {content.backToMenu}
      </ButtonLink>
    </>
  );
}
