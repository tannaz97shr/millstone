import type { Branch, BranchId, TimeOfDay, Weekday } from "@/shared/domain";

// Spec section 4. Fictional addresses; ACMA fictional 03 7010 xxxx phones.
// displayOrder follows the C1 design: Northcote, Fitzroy, Brunswick.

const MONDAY: Weekday = 1;

const shared = {
  orderCutoffTime: "14:00" as TimeOfDay,
  opensAt: "07:00" as TimeOfDay,
  closedDays: [MONDAY],
  notificationsEnabled: false,
};

export const NORTHCOTE = "northcote" as BranchId;
export const FITZROY = "fitzroy" as BranchId;
export const BRUNSWICK = "brunswick" as BranchId;

export const seedBranches: Branch[] = [
  {
    id: NORTHCOTE,
    name: "Northcote",
    address: "214 High Street, Northcote",
    phone: "0370102140",
    displayOrder: 1,
    ...shared,
  },
  {
    id: FITZROY,
    name: "Fitzroy",
    address: "87 Gertrude Street, Fitzroy",
    phone: "0370100870",
    displayOrder: 2,
    ...shared,
  },
  {
    id: BRUNSWICK,
    name: "Brunswick",
    address: "402 Sydney Road, Brunswick",
    phone: "0370104020",
    displayOrder: 3,
    ...shared,
  },
];
