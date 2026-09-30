import type { BranchId, StaffRole } from "@/shared/domain";
import { BRUNSWICK, FITZROY, NORTHCOTE } from "./branches";

// Made-up people. Emails on example.com; the mobile is from the ACMA
// fictional 0491 570 range. Passwords come from the environment.

export interface SeedStaffUser {
  name: string;
  email: string;
  role: StaffRole;
  branchId: BranchId | null;
}

export interface SeedCustomer {
  name: string;
  email: string;
  phone: string;
}

export const seedStaffUsers: SeedStaffUser[] = [
  { name: "Rosa Whitlock", email: "owner@example.com", role: "owner", branchId: null },
  { name: "Ned Park", email: "northcote@example.com", role: "staff", branchId: NORTHCOTE },
  { name: "Frankie Doyle", email: "fitzroy@example.com", role: "staff", branchId: FITZROY },
  { name: "Bea Moreno", email: "brunswick@example.com", role: "staff", branchId: BRUNSWICK },
];

/** The sample customer from the checkout designs, with an account. */
export const seedCustomers: SeedCustomer[] = [
  { name: "Sam Carter", email: "sam.carter@example.com", phone: "0491570156" },
];
