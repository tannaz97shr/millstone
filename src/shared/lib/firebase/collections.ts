import "server-only";
import type { BranchId } from "@/shared/domain";
import { getDb } from "./admin";

// Every Firestore collection name lives here. Nothing else types a collection
// path by hand.

export const COLLECTIONS = {
  branches: "branches",
  /** Subcollection of a branch: branches/{branchId}/products/{productId}. */
  branchProducts: "products",
  products: "products",
  customers: "customers",
  customerEmails: "customerEmails",
  staffUsers: "staffUsers",
  staffEmails: "staffEmails",
  orders: "orders",
  recurringOrders: "recurringOrders",
  counters: "counters",
  /** signInThrottle/{sha256(normalizedEmail)}: failed staff sign-ins (A1). */
  signInThrottle: "signInThrottle",
  settings: "settings",
} as const;

export const COUNTER_IDS = {
  orders: "orders",
} as const;

export const SETTINGS_IDS = {
  catalog: "catalog",
} as const;

export const branchesRef = () => getDb().collection(COLLECTIONS.branches);
export const branchProductsRef = (branchId: BranchId) =>
  branchesRef().doc(branchId).collection(COLLECTIONS.branchProducts);
export const productsRef = () => getDb().collection(COLLECTIONS.products);
export const customersRef = () => getDb().collection(COLLECTIONS.customers);
export const customerEmailsRef = () => getDb().collection(COLLECTIONS.customerEmails);
export const staffUsersRef = () => getDb().collection(COLLECTIONS.staffUsers);
export const staffEmailsRef = () => getDb().collection(COLLECTIONS.staffEmails);
export const ordersRef = () => getDb().collection(COLLECTIONS.orders);
export const recurringOrdersRef = () => getDb().collection(COLLECTIONS.recurringOrders);
export const countersRef = () => getDb().collection(COLLECTIONS.counters);
export const signInThrottleRef = () => getDb().collection(COLLECTIONS.signInThrottle);
export const catalogSettingsRef = () =>
  getDb().collection(COLLECTIONS.settings).doc(SETTINGS_IDS.catalog);
