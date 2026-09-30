import type {
  BranchSchedule,
  Cents,
  IsoDate,
  PaymentStatus,
  VisibleOrderStatus,
  Weekday,
} from "@/shared/domain";
import {
  availablePickupDates,
  melbourneDateOf,
  startOfMonth,
  toTimeOfDay,
} from "@/shared/utils/pickup-dates";
import { devComponentsContent } from "../content/devComponents";

// Sample data for the /dev/components preview. Dates come from the real
// pickup-date rules at render time; people and numbers are fictional.

const MONDAY: Weekday = 1;

/** The schedule every seeded branch uses: 2pm cutoff, closed Mondays. */
const sampleSchedule: BranchSchedule = {
  orderCutoffTime: toTimeOfDay("14:00"),
  closedDays: [MONDAY],
};

export interface SampleDates {
  /** Today in Melbourne. */
  today: IsoDate;
  /** The first day that can still be ordered for. */
  earliest: IsoDate;
  /** The day shown as already chosen. */
  chosen: IsoDate;
  /** A day a product is sold out for. */
  soldOutDay: IsoDate;
  monthStart: IsoDate;
  closedWeekdays: Weekday[];
  /** A cafe's standing order: Tuesday, Thursday, Saturday. */
  recurringDays: Weekday[];
}

export function buildSampleDates(now: Date): SampleDates {
  const [earliest, second, third] = availablePickupDates(sampleSchedule, now, 3);
  const today = melbourneDateOf(now);
  return {
    today,
    earliest,
    chosen: second,
    soldOutDay: third,
    monthStart: startOfMonth(today),
    closedWeekdays: sampleSchedule.closedDays,
    recurringDays: [2, 4, 6],
  };
}

export interface SampleOrder {
  orderNumber: string;
  status: VisibleOrderStatus;
  payment: PaymentStatus | null;
  customerName: string;
  /** Digits, as stored. */
  phone: string;
  items: Array<{ name: string; quantity: number }>;
  totalCents: Cents;
  recurring?: boolean;
  notes?: string;
  generationNote?: string;
  selected?: boolean;
}

const copy = devComponentsContent.orderRow;

/** One row per status and payment combination the admin list can show. */
export const sampleOrders: SampleOrder[] = [
  {
    orderNumber: "MS-1042",
    status: "placed",
    payment: "unpaid",
    customerName: "Priya Nair",
    phone: "0491570157",
    items: [
      { quantity: 1, name: "Sourdough rye loaf" },
      { quantity: 2, name: "Plain bagel" },
    ],
    totalCents: 1510,
    notes: copy.notes,
  },
  {
    orderNumber: "MS-1044",
    status: "placed",
    payment: "paid",
    customerName: "Corner Cup Cafe",
    phone: "0370101120",
    items: [
      { quantity: 12, name: "Butter croissant" },
      { quantity: 6, name: "Almond croissant" },
    ],
    totalCents: 9360,
    recurring: true,
    notes: copy.cafeNotes,
    generationNote: copy.generationNote,
  },
  {
    orderNumber: "MS-1043",
    status: "ready",
    payment: "paid",
    customerName: "Tom Walsh",
    phone: "0491570158",
    items: [{ quantity: 2, name: "Seeded sandwich loaf" }],
    totalCents: 1700,
    selected: true,
  },
  {
    orderNumber: "MS-1045",
    status: "ready",
    payment: "unpaid",
    customerName: "Sam Carter",
    phone: "0491570156",
    items: [{ quantity: 4, name: "Cinnamon scroll" }],
    totalCents: 2000,
  },
  {
    orderNumber: "MS-1040",
    status: "collected",
    payment: "paid",
    customerName: "Mei Lin",
    phone: "0491570159",
    items: [{ quantity: 1, name: "White sourdough" }],
    totalCents: 800,
  },
  {
    orderNumber: "MS-1039",
    status: "cancelled",
    payment: null,
    customerName: "Ava Brooks",
    phone: "0491570110",
    items: [{ quantity: 3, name: "Apple turnover" }],
    totalCents: 1650,
  },
  {
    orderNumber: "MS-1038",
    status: "cancelled",
    payment: "paid",
    customerName: "Little Fox Espresso",
    phone: "0370102200",
    items: [{ quantity: 10, name: "Sesame bagel" }],
    totalCents: 3000,
    recurring: true,
  },
  {
    orderNumber: "MS-1037",
    status: "cancelled",
    payment: "refunded",
    customerName: "Jo Bell",
    phone: "0491570313",
    items: [{ quantity: 2, name: "Fruit loaf" }],
    totalCents: 1500,
  },
];
