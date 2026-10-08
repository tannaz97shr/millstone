import type { BranchId, PaymentMethod, ProductId } from "@/shared/domain";
import { BRUNSWICK, FITZROY, NORTHCOTE } from "../../seed/data/branches";
import type { DemoStamp, DemoStep } from "../lib/demoTimeline";

// A believable day of orders for the walkthrough video (scripts/live/demoOrders.ts).
// Made-up Melbourne customers, none of them the seed's. Phones are ACMA
// fictional mobiles the seed doesn't use; several are shared, as they're few.
// Emails are @example.com. Prices always come from the live catalogue.
//
// D0 is each branch's "today" (or its next open day), D1 the open day after.
// D0 orders were placed the day before, before the 2pm cutoff; staff steps
// happen on D0 at the times given, once those times have passed.

export type DemoDay = "D0" | "D1";

export interface DemoOrder {
  /** Short and stable: with the pickup date it makes the doc ID. */
  key: string;
  branchId: BranchId;
  day: DemoDay;
  name: string;
  email: string;
  phone: string;
  items: [quantity: number, productId: ProductId][];
  notes?: string;
  /** Online orders are paid as they're placed (a test pi_ ref, no real Stripe payment). */
  payment: PaymentMethod;
  placed: DemoStamp;
  steps: DemoStep[];
}

const P = {
  rye: "sourdough-rye-loaf",
  seeded: "seeded-sandwich-loaf",
  white: "white-sourdough",
  almond: "almond-croissant",
  butter: "butter-croissant",
  scroll: "cinnamon-scroll",
  turnover: "apple-turnover",
  plainBagel: "plain-bagel",
  sesameBagel: "sesame-bagel",
  everythingBagel: "everything-bagel",
} as const satisfies Record<string, string>;

const item = (quantity: number, product: keyof typeof P): [number, ProductId] => [quantity, P[product] as ProductId];
const dayBefore = (time: string): DemoStamp => ({ daysFrom: -1, time });

export const demoOrders: DemoOrder[] = [
  // Northcote, today.
  {
    key: "nc-1", branchId: NORTHCOTE, day: "D0", payment: "at_pickup",
    name: "Hannah Okoye", email: "hannah.okoye@example.com", phone: "0491570006",
    items: [item(1, "rye"), item(2, "almond")], placed: dayBefore("11:42"),
    steps: [{ action: "ready", at: "07:05" }, { action: "collect", at: "08:12" }],
  },
  {
    key: "nc-2", branchId: NORTHCOTE, day: "D0", payment: "online",
    name: "Luca Romano", email: "luca.romano@example.com", phone: "0491571266",
    items: [item(1, "white"), item(4, "plainBagel")], placed: dayBefore("09:18"),
    steps: [],
  },
  {
    key: "nc-3", branchId: NORTHCOTE, day: "D0", payment: "at_pickup",
    name: "Grace Nguyen", email: "grace.nguyen@example.com", phone: "0491571491",
    items: [item(2, "scroll"), item(1, "seeded")], notes: "Collecting after 3pm.", placed: dayBefore("13:05"),
    steps: [],
  },
  {
    key: "nc-4", branchId: NORTHCOTE, day: "D0", payment: "at_pickup",
    name: "Daniel Kowalski", email: "daniel.kowalski@example.com", phone: "0491571804",
    items: [item(6, "butter")], placed: dayBefore("08:47"),
    steps: [{ action: "ready", at: "07:40" }],
  },
  {
    key: "nc-5", branchId: NORTHCOTE, day: "D0", payment: "online",
    name: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "0491572549",
    items: [item(1, "rye"), item(2, "turnover")], placed: dayBefore("12:31"),
    steps: [{ action: "cancel", at: "09:05", reason: "customer_request" }],
  },

  // Fitzroy, today.
  {
    key: "fz-1", branchId: FITZROY, day: "D0", payment: "at_pickup",
    name: "Oliver Brennan", email: "oliver.brennan@example.com", phone: "0491572665",
    items: [item(1, "white"), item(2, "butter")], placed: dayBefore("10:02"),
    steps: [{ action: "ready", at: "07:10" }, { action: "collect", at: "08:40" }],
  },
  {
    key: "fz-2", branchId: FITZROY, day: "D0", payment: "at_pickup",
    name: "Chloe Tan", email: "chloe.tan@example.com", phone: "0491572983",
    items: [item(3, "sesameBagel"), item(3, "everythingBagel")], placed: dayBefore("12:56"),
    steps: [{ action: "ready", at: "07:30" }],
  },
  {
    key: "fz-3", branchId: FITZROY, day: "D0", payment: "at_pickup",
    name: "Marcus Webb", email: "marcus.webb@example.com", phone: "0491573770",
    items: [item(1, "seeded"), item(1, "almond")], placed: dayBefore("13:40"),
    steps: [],
  },
  {
    key: "fz-4", branchId: FITZROY, day: "D0", payment: "at_pickup",
    name: "Isla Murphy", email: "isla.murphy@example.com", phone: "0491573087",
    items: [item(2, "white")], placed: dayBefore("09:55"),
    steps: [{ action: "cancel", at: "08:05", reason: "other", note: "Called to move it to Saturday." }],
  },

  // Brunswick, today.
  {
    key: "bw-1", branchId: BRUNSWICK, day: "D0", payment: "at_pickup",
    name: "Raj Patel", email: "raj.patel@example.com", phone: "0491574118",
    items: [item(1, "rye"), item(1, "scroll")], placed: dayBefore("11:15"),
    steps: [{ action: "ready", at: "07:15" }, { action: "collect", at: "10:40" }],
  },
  {
    key: "bw-2", branchId: BRUNSWICK, day: "D0", payment: "at_pickup",
    name: "Sophie Laurent", email: "sophie.laurent@example.com", phone: "0491574632",
    items: [item(4, "almond"), item(4, "butter")], notes: "For a morning tea, boxed if you can.",
    placed: dayBefore("10:48"),
    steps: [{ action: "ready", at: "07:50" }],
  },

  // Tomorrow, at all three.
  {
    key: "nc-t1", branchId: NORTHCOTE, day: "D1", payment: "at_pickup",
    name: "Noah Castellano", email: "noah.castellano@example.com", phone: "0491575254",
    items: [item(1, "seeded")], notes: "Sliced, please.", placed: dayBefore("08:20"),
    steps: [],
  },
  {
    key: "fz-t1", branchId: FITZROY, day: "D1", payment: "at_pickup",
    name: "Mia Haddad", email: "mia.haddad@example.com", phone: "0491575789",
    items: [item(2, "scroll"), item(2, "turnover")], placed: dayBefore("09:35"),
    steps: [],
  },
  {
    key: "bw-t1", branchId: BRUNSWICK, day: "D1", payment: "at_pickup",
    name: "Ben Ashworth", email: "ben.ashworth@example.com", phone: "0491570006",
    items: [item(1, "rye"), item(6, "plainBagel")], placed: dayBefore("10:10"),
    steps: [],
  },
];
