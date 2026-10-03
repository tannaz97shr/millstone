import { directionsUrl } from "@/shared/utils/directions";
import { escapeHtml } from "@/shared/utils/escapeHtml";
import { formatCents } from "@/shared/utils/money";
import { formatPhone } from "@/shared/utils/phone";
import { formatPickupDay, formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { confirmationContent } from "../../content/confirmationContent";
import type { OrderConfirmation } from "../../types/orderConfirmation";
import { emailColors as c, emailFonts as f } from "./emailTheme";

// The confirmation email (C13, AC-C11), following design/customer/Email.dc.html,
// EmailPickup and EmailWide. Table-based with inline styles, because mail apps
// drop <style> blocks and flexbox. Pure: the order view in, the email out.

const content = confirmationContent;

export interface ConfirmationEmail {
  fromName: string;
  subject: string;
  /** The line mail apps show after the subject. */
  preheader: string;
  html: string;
  text: string;
}

/** Inline style text from a list of declarations. */
const css = (...rules: string[]) => rules.join("; ");

const BODY = css(`font-family: ${f.sans}`, "font-size: 16px", "line-height: 24px", `color: ${c.ink}`);
const MUTED_SMALL = css("font-size: 14px", "line-height: 20px", `color: ${c.inkMuted}`);
const HEADING = css(
  "margin: 0 0 8px",
  `font-family: ${f.serif}`,
  "font-size: 22px",
  "line-height: 28px",
  "font-weight: 600",
  `color: ${c.ink}`,
);
const LINK = css(`color: ${c.link}`, "font-weight: 700");

/** One block of the email's body, with the design's 24px gap above it. */
const block = (html: string, first = false) =>
  `<tr><td style="${css(first ? "padding: 0" : "padding: 24px 0 0")}">${html}</td></tr>`;

const p = (html: string, style = "") => `<p style="${css("margin: 0", style)}">${html}</p>`;

function details(order: OrderConfirmation) {
  const paid = order.paymentStatus === "paid";
  const total = formatCents(order.totalCents);
  return {
    paid,
    total,
    day: formatPickupDay(order.pickupDate),
    readyFrom: formatTimeOfDay(order.branch.opensAt),
    phone: formatPhone(order.branch.phone),
    directions: directionsUrl(order.branch.address),
    payLabel: paid ? content.payment.paid.label : content.payment.unpaid.label,
    payNote: paid ? content.payment.paid.note() : content.payment.unpaid.note(total),
  };
}

function buildHtml(order: OrderConfirmation, preheader: string): string {
  const d = details(order);
  const e = escapeHtml;

  const tag = css(
    "display: inline-block",
    "padding: 4px 8px",
    "border-radius: 4px",
    "border: 1.5px solid",
    "font-size: 14px",
    "line-height: 18px",
    "font-weight: 700",
    "letter-spacing: 0.04em",
    "text-transform: uppercase",
    "white-space: nowrap",
    d.paid
      ? css(`background: ${c.sageSoft}`, `color: ${c.sage}`, `border-color: ${c.sage}`)
      : css(`background: ${c.wheat}`, `color: ${c.ink}`, `border-color: ${c.ink}`),
  );

  const lines = order.lines
    .map(
      (line) =>
        `<tr><td style="${css("padding: 8px 12px 8px 0", `border-bottom: 1px solid ${c.line}`)}">${e(
          content.items.line(line.quantity, line.name),
        )}</td><td align="right" style="${css(
          "padding: 8px 0",
          `border-bottom: 1px solid ${c.line}`,
          "white-space: nowrap",
        )}">${formatCents(line.lineTotalCents)}</td></tr>`,
    )
    .join("");

  const sections = [
    block(
      `<h1 style="${css(HEADING, "font-size: 28px", "line-height: 34px", "font-weight: 700")}">${e(content.title)}</h1>` +
        p(e(content.intro(order.contactFirstName, order.branch.name, d.readyFrom, d.day))),
      true,
    ),
    block(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${css(
        `background: ${c.sunk}`,
        "border-radius: 8px",
      )}"><tr><td style="padding: 16px">` +
        p(e(content.orderNumber.label), MUTED_SMALL) +
        p(
          e(order.orderNumber),
          css("margin: 4px 0", "font-size: 32px", "line-height: 36px", "font-weight: 700", "letter-spacing: 0.02em"),
        ) +
        p(e(content.orderNumber.hint), MUTED_SMALL) +
        `</td></tr></table>`,
    ),
    block(
      `<h2 style="${HEADING}">${e(content.pickup.title)}</h2>` +
        p(e(d.day), "font-weight: 700") +
        p(e(content.pickup.branchName(order.branch.name))) +
        p(e(order.branch.address), `color: ${c.inkMuted}`) +
        p(`<a href="${e(d.directions)}" style="${LINK}">${e(content.pickup.directions)}</a>`, "margin-top: 8px"),
    ),
    block(
      `<h2 style="${HEADING}">${e(content.items.title)}</h2>` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${BODY}">${lines}` +
        `<tr><td style="${css("padding: 12px 12px 0 0", "font-size: 18px", "font-weight: 700")}">${e(
          content.items.total,
        )}</td><td align="right" style="${css("padding: 12px 0 0", "font-size: 18px", "font-weight: 700")}">${e(
          d.total,
        )}</td></tr></table>`,
    ),
    block(`<span style="${tag}">${e(d.payLabel)}</span>&nbsp;&nbsp; ${e(d.payNote)}`),
    block(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${css(
        `border: 1.5px solid ${c.lineStrong}`,
        "border-radius: 8px",
      )}"><tr><td style="padding: 16px">` +
        p(e(content.change.title), css("margin: 0 0 4px", "font-weight: 700")) +
        p(
          `${e(content.change.call(order.branch.name))}<a href="tel:${e(order.branch.phone)}" style="${css(
            LINK,
            "white-space: nowrap",
          )}">${e(d.phone)}</a>${e(content.change.after)}`,
        ) +
        `</td></tr></table>`,
    ),
  ].join("");

  // Padding after the preheader stops mail apps filling the preview with the body text.
  const preheaderPad = "&#847;&zwnj;&nbsp;".repeat(40);

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${e(content.email.subject(order.orderNumber, d.day))}</title>
</head>
<body style="${css("margin: 0", "padding: 0", `background: ${c.page}`)}">
<div style="${css("display: none", "max-height: 0", "overflow: hidden", "mso-hide: all", "font-size: 1px", "line-height: 1px", `color: ${c.page}`, "opacity: 0")}">${e(preheader)}${preheaderPad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${css(`background: ${c.page}`)}">
<tr><td align="center" style="padding: 16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${css(
    "max-width: 600px",
    `background: ${c.card}`,
    `border: 1px solid ${c.line}`,
    "border-radius: 8px",
    BODY,
  )}">
<tr><td style="${css("padding: 20px 24px 16px", `border-bottom: 1px solid ${c.line}`)}"><span style="${css(
    `font-family: ${f.serif}`,
    "font-weight: 700",
    "font-size: 24px",
    "line-height: 30px",
  )}">${e(content.email.wordmark)}</span></td></tr>
<tr><td style="padding: 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${BODY}">${sections}</table>
</td></tr>
<tr><td style="${css("padding: 16px 24px 24px", `border-top: 1px solid ${c.line}`, MUTED_SMALL, `font-family: ${f.sans}`)}">${p(
    e(content.email.footer.branches),
    "margin: 0 0 8px",
  )}${p(e(content.email.footer.why(order.orderNumber)))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildText(order: OrderConfirmation): string {
  const d = details(order);
  const lines = order.lines.map(
    (line) => `${content.items.line(line.quantity, line.name)}  ${formatCents(line.lineTotalCents)}`,
  );
  return [
    content.title,
    "",
    content.intro(order.contactFirstName, order.branch.name, d.readyFrom, d.day),
    "",
    `${content.orderNumber.label}: ${order.orderNumber}`,
    content.orderNumber.hint,
    "",
    content.pickup.title,
    d.day,
    content.pickup.branchName(order.branch.name),
    order.branch.address,
    `${content.pickup.directions}: ${d.directions}`,
    "",
    content.items.title,
    ...lines,
    `${content.items.total}  ${d.total}`,
    "",
    `${d.payLabel}: ${d.payNote}`,
    "",
    content.change.title,
    `${content.change.call(order.branch.name)}${d.phone}${content.change.after}`,
    "",
    "--",
    content.email.footer.branches,
    content.email.footer.why(order.orderNumber),
    "",
  ].join("\n");
}

export function buildConfirmationEmail(order: OrderConfirmation): ConfirmationEmail {
  const d = details(order);
  const preheader = d.paid
    ? content.email.preheader.paid(order.branch.name)
    : content.email.preheader.unpaid(d.total);
  return {
    fromName: content.email.fromName(order.branch.name),
    subject: content.email.subject(order.orderNumber, d.day),
    preheader,
    html: buildHtml(order, preheader),
    text: buildText(order),
  };
}
