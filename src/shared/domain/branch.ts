import type { BranchId, TimeOfDay, Weekday } from "./ids";

export interface Branch {
  id: BranchId;
  name: string;
  address: string;
  /** Digits only, e.g. "0370102140". */
  phone: string;
  /** Orders for a pickup date close at this time on the day before. */
  orderCutoffTime: TimeOfDay;
  /** Orders are ready from this time on the pickup date. */
  opensAt: TimeOfDay;
  closedDays: Weekday[];
  notificationsEnabled: boolean;
  /** Where the branch appears in customer and admin lists, lowest first. */
  displayOrder: number;
}

/** The parts of a branch the pickup-date rules need. */
export type BranchSchedule = Pick<Branch, "orderCutoffTime" | "closedDays">;
