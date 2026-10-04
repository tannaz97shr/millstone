import type { BranchId, StaffRole } from "@/shared/domain";
import { BRUNSWICK, FITZROY, NORTHCOTE } from "./branches";

// Made-up people. Emails on example.com; mobiles from the ACMA fictional
// 0491 570 range, landlines from 03 7010. Passwords come from the environment.

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
  /** False for a guest (no password), as checkout creates them. */
  hasAccount: boolean;
}

export const seedStaffUsers: SeedStaffUser[] = [
  { name: "Rosa Whitlock", email: "owner@example.com", role: "owner", branchId: null },
  { name: "Ned Park", email: "northcote@example.com", role: "staff", branchId: NORTHCOTE },
  { name: "Frankie Doyle", email: "fitzroy@example.com", role: "staff", branchId: FITZROY },
  { name: "Bea Moreno", email: "brunswick@example.com", role: "staff", branchId: BRUNSWICK },
];

/**
 * The sample customer from the checkout designs, the cafe behind the seeded
 * recurring order (accounts), and the guests from the admin canvases
 * (design/admin/Main.dc.html) who placed the seeded orders.
 */
export const seedCustomers: SeedCustomer[] = [
  { name: "Sam Carter", email: "sam.carter@example.com", phone: "0491570156", hasAccount: true },
  { name: "Corner Cup Cafe", email: "orders@cornercup.example.com", phone: "0370101120", hasAccount: true },
  { name: "Priya Nair", email: "priya.nair@example.com", phone: "0491570157", hasAccount: false },
  { name: "Tom Walsh", email: "tom.walsh@example.com", phone: "0491570158", hasAccount: false },
  { name: "Mei Lin", email: "mei.lin@example.com", phone: "0491570159", hasAccount: false },
  { name: "Little Fox Espresso", email: "hello@littlefox.example.com", phone: "0370102200", hasAccount: false },
  { name: "Ava Brooks", email: "ava.brooks@example.com", phone: "0491570110", hasAccount: false },
  { name: "Jo Bell", email: "jo.bell@example.com", phone: "0491570313", hasAccount: false },
  { name: "Lena Fischer", email: "lena.fischer@example.com", phone: "0491570737", hasAccount: false },
  { name: "Bean There Cafe", email: "orders@beanthere.example.com", phone: "0370105530", hasAccount: false },
];
