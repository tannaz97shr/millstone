import type { BranchId, CancellationReason, OrderStatus, PaymentMethod, PaymentStatus, ProductId } from "@/shared/domain";
import { BRUNSWICK, FITZROY, NORTHCOTE } from "./branches";
import { PRODUCT_IDS } from "./products";

// Orders for the admin (A2/A3), after design/admin/Main.dc.html: the same
// numbers, people and states, moved onto real days. Days are relative to the
// clock at seed time, per branch (see lib/seedOrders.ts):
//   D0 today, or the next open day if the branch is closed today
//   D1, D2 the open days after D0
//   P1 the open day before D0
// Times are Melbourne wall-clock times, `daysFrom` calendar days from that day.

export type SeedDay = "P1" | "D0" | "D1" | "D2";

export interface SeedStamp {
  day: SeedDay;
  /** Calendar days from `day`, e.g. -1 for the evening before. */
  daysFrom: number;
  /** "HH:mm", Melbourne. */
  time: string;
}

const at = (day: SeedDay, daysFrom: number, time: string): SeedStamp => ({ day, daysFrom, time });

export interface SeedOrder {
  number: number;
  branchId: BranchId;
  pickup: SeedDay;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Matches a seed customer's email (data/people.ts). */
  email: string;
  items: [quantity: number, productId: ProductId][];
  notes?: string;
  paymentRef?: string;
  cancellationReason?: CancellationReason;
  cancellationNote?: string;
  placedAt: SeedStamp;
  paidAt?: SeedStamp;
  readyAt?: SeedStamp;
  collectedAt?: SeedStamp;
  cancelledAt?: SeedStamp;
  refundedAt?: SeedStamp;
}

const P = {
  ...PRODUCT_IDS,
  white: "white-sourdough" as ProductId,
  butterCroissant: "butter-croissant" as ProductId,
  appleTurnover: "apple-turnover" as ProductId,
  plainBagel: "plain-bagel" as ProductId,
  sesameBagel: "sesame-bagel" as ProductId,
};

/** The first and last numbers the seed owns; the counter is moved past them. */
export const SEED_ORDER_NUMBERS = { first: 1027, last: 1046 } as const;

export const seedOrders: SeedOrder[] = [
  // Northcote, D0: the default list.
  {
    number: 1038, branchId: NORTHCOTE, pickup: "D0", status: "ready",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "priya.nair@example.com",
    items: [[1, P.seeded]],
    placedAt: at("D0", -2, "15:02"), readyAt: at("D0", 0, "08:05"),
  },
  {
    number: 1040, branchId: NORTHCOTE, pickup: "D0", status: "ready",
    paymentMethod: "online", paymentStatus: "paid", email: "tom.walsh@example.com",
    items: [[2, P.rye], [4, P.plainBagel]], paymentRef: "PAY-7Q2M81",
    placedAt: at("D0", -1, "18:40"), paidAt: at("D0", -1, "18:41"), readyAt: at("D0", 0, "08:20"),
  },
  {
    number: 1043, branchId: NORTHCOTE, pickup: "D0", status: "placed",
    paymentMethod: "online", paymentStatus: "paid", email: "sam.carter@example.com",
    items: [[1, P.rye], [2, P.cinnamonScroll]], notes: "Sliced, please", paymentRef: "PAY-3KD9X4",
    placedAt: at("D0", -1, "20:14"), paidAt: at("D0", -1, "20:15"),
  },
  {
    number: 1044, branchId: NORTHCOTE, pickup: "D0", status: "placed",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "mei.lin@example.com",
    items: [[1, P.almondCroissant], [1, P.plainBagel]],
    placedAt: at("D0", -1, "09:30"),
  },
  // Northcote, D1.
  {
    number: 1045, branchId: NORTHCOTE, pickup: "D1", status: "placed",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "hello@littlefox.example.com",
    items: [[24, P.plainBagel]],
    placedAt: at("D0", -1, "07:15"),
  },
  {
    number: 1046, branchId: NORTHCOTE, pickup: "D1", status: "placed",
    paymentMethod: "online", paymentStatus: "paid", email: "ava.brooks@example.com",
    items: [[1, P.seeded]], notes: "Picking up after 4pm", paymentRef: "PAY-9WB2T7",
    placedAt: at("D0", -1, "09:02"), paidAt: at("D0", -1, "09:03"),
  },
  // Northcote, cancelled: refunded, refund still owed, and a no-show.
  {
    number: 1031, branchId: NORTHCOTE, pickup: "D0", status: "cancelled",
    paymentMethod: "online", paymentStatus: "refunded", email: "jo.bell@example.com",
    items: [[2, P.almondCroissant]], paymentRef: "PAY-1HX7C2", cancellationReason: "customer_request",
    placedAt: at("D0", -2, "17:10"), paidAt: at("D0", -2, "17:11"),
    cancelledAt: at("D0", 0, "07:50"), refundedAt: at("D0", 0, "08:02"),
  },
  {
    number: 1037, branchId: NORTHCOTE, pickup: "D0", status: "cancelled",
    paymentMethod: "online", paymentStatus: "paid", email: "lena.fischer@example.com",
    items: [[1, P.almondCroissant], [2, P.cinnamonScroll]], paymentRef: "PAY-6TR4N8",
    cancellationReason: "customer_request",
    placedAt: at("D0", -2, "19:48"), paidAt: at("D0", -2, "19:49"), cancelledAt: at("D0", 0, "08:30"),
  },
  {
    number: 1034, branchId: NORTHCOTE, pickup: "P1", status: "cancelled",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "mei.lin@example.com",
    items: [[2, P.seeded]], cancellationReason: "not_collected",
    placedAt: at("P1", -2, "13:15"), readyAt: at("P1", 0, "07:30"), cancelledAt: at("P1", 0, "15:55"),
  },
  // Northcote, collected.
  {
    number: 1035, branchId: NORTHCOTE, pickup: "D0", status: "collected",
    paymentMethod: "at_pickup", paymentStatus: "paid", email: "sam.carter@example.com",
    items: [[1, P.rye]],
    placedAt: at("D0", -2, "16:25"), readyAt: at("D0", 0, "07:40"),
    collectedAt: at("D0", 0, "07:58"), paidAt: at("D0", 0, "07:58"),
  },
  {
    number: 1029, branchId: NORTHCOTE, pickup: "P1", status: "collected",
    paymentMethod: "at_pickup", paymentStatus: "paid", email: "priya.nair@example.com",
    items: [[1, P.seeded]],
    placedAt: at("P1", -1, "11:20"), readyAt: at("P1", 0, "07:35"),
    collectedAt: at("P1", 0, "09:12"), paidAt: at("P1", 0, "09:12"),
  },
  // Fitzroy (rye is off there, so Tom's loaves are white sourdough).
  {
    number: 1039, branchId: FITZROY, pickup: "D0", status: "placed",
    paymentMethod: "online", paymentStatus: "paid", email: "tom.walsh@example.com",
    items: [[2, P.white]], paymentRef: "PAY-2ZL5H3",
    placedAt: at("D0", -1, "19:05"), paidAt: at("D0", -1, "19:06"),
  },
  {
    number: 1036, branchId: FITZROY, pickup: "D1", status: "placed",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "orders@beanthere.example.com",
    items: [[10, P.plainBagel]],
    placedAt: at("D0", -2, "16:55"),
  },
  {
    number: 1032, branchId: FITZROY, pickup: "D1", status: "cancelled",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "tom.walsh@example.com",
    items: [[1, P.appleTurnover]], cancellationReason: "other", cancellationNote: "Booked for the wrong day",
    placedAt: at("D0", -2, "11:00"), cancelledAt: at("D0", -1, "16:30"),
  },
  {
    number: 1033, branchId: FITZROY, pickup: "P1", status: "collected",
    paymentMethod: "at_pickup", paymentStatus: "paid", email: "priya.nair@example.com",
    items: [[1, P.butterCroissant]],
    placedAt: at("P1", -1, "18:00"), collectedAt: at("P1", 0, "08:45"), paidAt: at("P1", 0, "08:45"),
  },
  // Brunswick.
  {
    number: 1041, branchId: BRUNSWICK, pickup: "D0", status: "ready",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "jo.bell@example.com",
    items: [[6, P.plainBagel], [1, P.almondCroissant]],
    placedAt: at("D0", -1, "12:40"), readyAt: at("D0", 0, "08:10"),
  },
  {
    number: 1030, branchId: BRUNSWICK, pickup: "D2", status: "placed",
    paymentMethod: "at_pickup", paymentStatus: "unpaid", email: "mei.lin@example.com",
    items: [[2, P.sesameBagel], [1, P.butterCroissant]],
    placedAt: at("D0", -1, "10:20"),
  },
  // Never shown to staff: an abandoned online checkout, and one still waiting for payment.
  {
    number: 1027, branchId: NORTHCOTE, pickup: "D0", status: "expired",
    paymentMethod: "online", paymentStatus: "unpaid", email: "jo.bell@example.com",
    items: [[1, P.cinnamonScroll]],
    placedAt: at("P1", -1, "20:00"),
  },
  {
    number: 1028, branchId: NORTHCOTE, pickup: "D1", status: "awaiting_payment",
    paymentMethod: "online", paymentStatus: "unpaid", email: "lena.fischer@example.com",
    items: [[1, P.rye]],
    placedAt: at("D0", -1, "21:30"),
  },
];

/** The cafe's recurring order, and the order generated from it for D0 (MS-1042). */
export const seedRecurring = {
  id: "seed-corner-cup",
  branchId: NORTHCOTE,
  email: "orders@cornercup.example.com",
  /** Every day but Monday, when the branches are closed. */
  daysOfWeek: [0, 2, 3, 4, 5, 6] as const,
  notes: "Back door on Elm Lane, before 7am",
  items: [
    [12, P.plainBagel],
    [6, P.almondCroissant],
    [4, P.rye],
  ] as [number, ProductId][],
  generated: {
    number: 1042,
    /** Left out at generation; the note says why (AC-R9). */
    skipped: P.rye,
    generationNote: "Sourdough rye loaf ×4 skipped: sold out",
    /** Generated when the cutoff passed the day before. */
    placedAt: at("D0", -1, "14:00"),
  },
};
