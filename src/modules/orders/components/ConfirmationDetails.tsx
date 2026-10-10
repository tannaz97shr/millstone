import { SaveDetailsOffer } from "@/modules/account/components/SaveDetailsOffer";
import { accountContent } from "@/modules/account/content/accountContent";
import { Card } from "@/shared/components/atoms/Card/Card";
import { Icon } from "@/shared/components/atoms/Icon/Icon";
import { PaymentLabel } from "@/shared/components/atoms/PaymentLabel/PaymentLabel";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { formatPickupDay, formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { confirmationContent as content } from "../content/confirmationContent";
import type { OrderConfirmationView } from "../types/orderConfirmation";

export interface ConfirmationDetailsProps {
  order: OrderConfirmationView;
  /** The page heading, focused when C7 opens. */
  titleRef: React.Ref<HTMLHeadingElement>;
  /** Whether the confirmation email went anywhere; the live site has no provider yet. */
  emailed: boolean;
  /** A customer is signed in: "See your orders in My account" (ConfSignedIn.dc.html). */
  signedIn: boolean;
}

/**
 * C7's content (AC-C9), from ConfGuestPickup.dc.html. A guest may be offered
 * "Save your details" (AC-C10); a signed-in customer gets a way to My account.
 */
export function ConfirmationDetails({ order, titleRef, emailed, signedIn }: ConfirmationDetailsProps) {
  const day = formatPickupDay(order.pickupDate);
  const total = formatCents(order.totalCents);
  const paid = order.paymentStatus === "paid";
  const phone = formatPhone(order.branch.phone);

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="flex text-[40px] text-sage">
          <Icon name="check" />
        </span>
        <h1 ref={titleRef} className="page-title focus-visible:shadow-none">
          {content.title}
        </h1>
        <p>
          {content.intro(order.contactFirstName, order.branch.name, formatTimeOfDay(order.branch.opensAt), day)}
        </p>
      </div>

      <Card as="section" aria-label={content.orderNumber.regionLabel} className="flex flex-col gap-1">
        <span className="caption text-ink-muted">{content.orderNumber.label}</span>
        {/* The admin order-number style: the same 32px figures staff read out. */}
        <span className="admin-order-number">{order.orderNumber}</span>
        <span className="caption text-ink-muted">{content.orderNumber.hint}</span>
      </Card>

      <Card as="section" aria-labelledby="confirmation-pickup-title" className="flex flex-col gap-3">
        <h2 id="confirmation-pickup-title" className="section-title">
          {content.pickup.title}
        </h2>
        <div className="flex flex-col">
          <span className="body-strong">{day}</span>
          <span>{content.pickup.branchName(order.branch.name)}</span>
          <span className="text-ink-muted">{order.branch.address}</span>
        </div>
        <hr className="border-line" />
        <ul className="flex flex-col gap-1">
          {order.lines.map((line, index) => (
            <li key={index} className="flex justify-between gap-3 tabular-nums">
              <span>{content.items.line(line.quantity, line.name)}</span>
              <span>{formatCents(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="body-strong">{content.items.total}</span>
          <span className="price">{total}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PaymentLabel status={paid ? "paid" : "unpaid"}>
            {paid ? content.payment.paid.label : content.payment.unpaid.label}
          </PaymentLabel>
          <span className="caption text-ink-muted">
            {paid ? content.payment.paid.note() : content.payment.unpaid.note(total)}
          </span>
        </div>
      </Card>

      <section
        aria-labelledby="confirmation-change-title"
        className="flex flex-col gap-1 rounded-md border-(length:--control-border) border-line-strong p-4"
      >
        <h2 id="confirmation-change-title" className="body-strong">
          {content.change.title}
        </h2>
        <p>
          {content.change.call(order.branch.name)}
          <a href={`tel:${order.branch.phone}`} className="font-bold whitespace-nowrap text-crust underline underline-offset-3 hover:text-crust-deep">
            {phone}
          </a>
          {content.change.after}
        </p>
      </section>

      {emailed ? (
        <p>
          {content.emailed}
          <strong>{order.contactEmail}</strong>.
        </p>
      ) : (
        <p>{content.notEmailed}</p>
      )}

      <SaveDetailsOffer orderId={order.orderId} email={order.contactEmail} offered={order.accountOffer} />

      <div className="flex flex-col gap-2">
        <ButtonLink href={routes.menu(order.branch.id)} block>
          {content.backToMenu}
        </ButtonLink>
        {signedIn && (
          <ButtonLink href={routes.account.home} variant="quiet" block>
            {accountContent.saveDetails.seeOrders}
          </ButtonLink>
        )}
      </div>
    </>
  );
}
