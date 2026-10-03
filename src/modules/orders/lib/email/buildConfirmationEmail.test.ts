import { describe, expect, test } from "bun:test";
import type { BranchId, OrderId } from "@/shared/domain";
import { toIsoDate, toTimeOfDay } from "@/shared/utils/pickup-dates";
import type { OrderConfirmation } from "../../types/orderConfirmation";
import { buildConfirmationEmail } from "./buildConfirmationEmail";

const order: OrderConfirmation = {
  orderId: "6f1c2a9e-3b7d-4c41-9a2e-8d5f0b7c1e23" as OrderId,
  orderNumber: "MS-1048",
  pickupDate: toIsoDate("2026-09-30"),
  branch: {
    id: "northcote" as BranchId,
    name: "Northcote",
    address: "214 High Street, Northcote",
    phone: "0370102140",
    opensAt: toTimeOfDay("07:00"),
  },
  lines: [
    { name: "Sourdough rye loaf", quantity: 1, lineTotalCents: 950 },
    { name: "Plain bagel", quantity: 4, lineTotalCents: 1120 },
  ],
  totalCents: 2070,
  paymentMethod: "at_pickup",
  paymentStatus: "unpaid",
  contactFirstName: "Ben",
  contactEmail: "ben.okafor@example.com",
};

describe("buildConfirmationEmail", () => {
  test("AC-C11 subject, sender and pay-at-pickup preview", () => {
    const email = buildConfirmationEmail(order);
    expect(email.subject).toBe("Your Millstone order MS-1048 for Wed 30 Sep");
    expect(email.fromName).toBe("Millstone Northcote");
    expect(email.preheader).toBe("Pickup at Northcote. Pay $20.70 when you collect.");
  });

  test("a paid order's preview says nothing is owed", () => {
    const email = buildConfirmationEmail({ ...order, paymentMethod: "online", paymentStatus: "paid" });
    expect(email.preheader).toBe("Pickup at Northcote. Paid online, nothing to pay at the counter.");
    expect(email.html).toContain(">Paid<");
    expect(email.text).toContain("Paid: Paid online. Nothing to pay at the counter.");
  });

  test("the plain text has every detail C7 shows", () => {
    const { text } = buildConfirmationEmail(order);
    for (const expected of [
      "Your order is in",
      "Thanks, Ben. We'll have it ready at Northcote from 7am on Wed 30 Sep.",
      "Order number: MS-1048",
      "Say this number at the counter when you pick up.",
      "Millstone Northcote",
      "214 High Street, Northcote",
      "Get directions: https://www.google.com/maps/search/?api=1&query=214+High+Street%2C+Northcote+VIC",
      "1 × Sourdough rye loaf  $9.50",
      "4 × Plain bagel  $11.20",
      "Total  $20.70",
      "Pay at pickup: Pay $20.70 at the counter when you collect.",
      "Need to change or cancel?",
      "Call Northcote on 03 7010 2140. Orders can't be changed online.",
      "placed order MS-1048",
    ]) {
      expect(text).toContain(expected);
    }
  });

  test("the HTML is table-based with inline styles, a hidden preview and the same details", () => {
    const { html } = buildConfirmationEmail(order);
    expect(html).not.toContain("<style");
    expect(html).not.toContain("display: flex");
    expect(html).toContain('role="presentation"');
    expect(html).toMatch(/display: none[^"]*">Pickup at Northcote\. Pay \$20\.70 when you collect\./);
    expect(html).toContain("MS-1048");
    expect(html).toContain('href="tel:0370102140"');
    expect(html).toContain(">03 7010 2140</a>");
    expect(html).toContain(">Pay at pickup<");
    expect(html).toContain("Georgia");
    expect(html).toContain("Arial");
  });

  test("colours are the design tokens", () => {
    const { html } = buildConfirmationEmail(order);
    expect(html).toContain("background: #e2b458"); // wheat: the Pay at pickup tag
    expect(html).toContain("background: #fffbf4"); // flour-raised: the card
  });

  test("customer-typed and catalog text is escaped", () => {
    const { html } = buildConfirmationEmail({
      ...order,
      contactFirstName: "<script>",
      lines: [{ name: `Rye & "seeded"`, quantity: 1, lineTotalCents: 950 }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("Thanks, &lt;script&gt;.");
    expect(html).toContain("1 × Rye &amp; &quot;seeded&quot;");
  });

  test("the ready-from time follows the branch", () => {
    const { text } = buildConfirmationEmail({
      ...order,
      branch: { ...order.branch, opensAt: toTimeOfDay("07:30") },
    });
    expect(text).toContain("from 7:30am on Wed 30 Sep");
  });
});
