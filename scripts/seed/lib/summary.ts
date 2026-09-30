import { toBranch } from "@/modules/branches/lib/toBranch";
import { toBranchProduct } from "@/modules/catalog/lib/toBranchProduct";
import { toProduct } from "@/modules/catalog/lib/toProduct";
import { toCustomer, toCustomerIdFromEmailLock } from "@/modules/customers/lib/toCustomer";
import { orderCounterRef } from "@/modules/orders/lib/orderIds";
import { orderCounterDocSchema } from "@/modules/orders/lib/orderSchema";
import { toOrder } from "@/modules/orders/lib/toOrder";
import { toRecurringOrder } from "@/modules/recurring-orders/lib/toRecurringOrder";
import { toStaffUser, toStaffUserIdFromEmailLock } from "@/modules/staff/lib/toStaffUser";
import {
  branchProductsRef,
  branchesRef,
  customerEmailsRef,
  customersRef,
  ordersRef,
  productsRef,
  recurringOrdersRef,
  staffEmailsRef,
  staffUsersRef,
} from "@/shared/lib/firebase/collections";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import { earliestPickupDate, formatPickupDay } from "@/shared/utils/pickup-dates";

// Reads everything back through the mappers (so bad data fails loudly) and
// prints counts plus one example per entity. Password hashes are shortened.

const redactHash = (hash: string | null) => (hash ? `${hash.split("$").slice(0, 4).join("$")}$…` : null);

export async function printSeedSummary(now: Date): Promise<void> {
  const branches = (await branchesRef().get()).docs.map(toBranch);
  const products = (await productsRef().get()).docs.map(toProduct);
  const branchProducts = (
    await Promise.all(branches.map((branch) => branchProductsRef(branch.id).get()))
  ).flatMap((snapshot) => snapshot.docs.map(toBranchProduct));
  const customers = (await customersRef().get()).docs.map(toCustomer);
  const staffUsers = (await staffUsersRef().get()).docs.map(toStaffUser);
  const customerLocks = (await customerEmailsRef().get()).docs;
  const staffLocks = (await staffEmailsRef().get()).docs;
  const orders = (await ordersRef().get()).docs.map(toOrder);
  const recurringOrders = (await recurringOrdersRef().get()).docs.map(toRecurringOrder);
  const counter = parseDoc(orderCounterDocSchema, await orderCounterRef().get());

  // Every lock must point at a user with that exact email.
  const badLocks = [
    ...customerLocks.filter((lock) => {
      const id = toCustomerIdFromEmailLock(lock);
      return customers.find((c) => c.id === id)?.email !== lock.id;
    }),
    ...staffLocks.filter((lock) => {
      const id = toStaffUserIdFromEmailLock(lock);
      return staffUsers.find((s) => s.id === id)?.email !== lock.id;
    }),
  ];
  if (badLocks.length > 0) {
    throw new Error(`Email locks out of sync: ${badLocks.map((lock) => lock.ref.path).join(", ")}`);
  }

  console.log("\nRead back through mappers:");
  console.table({
    branches: branches.length,
    products: products.length,
    "branches/*/products": branchProducts.length,
    customers: customers.length,
    customerEmails: customerLocks.length,
    staffUsers: staffUsers.length,
    staffEmails: staffLocks.length,
    orders: orders.length,
    recurringOrders: recurringOrders.length,
    "counters/orders.next": counter.next,
  });

  console.log("\nAvailability by branch:");
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  for (const branch of branches) {
    const rows = branchProducts.filter((bp) => bp.branchId === branch.id);
    const off = rows.filter((bp) => !bp.isAvailable).map((bp) => productName(bp.productId));
    const soldOut = rows
      .filter((bp) => bp.soldOutOn)
      .map((bp) => `${productName(bp.productId)} (${bp.soldOutOn && formatPickupDay(bp.soldOutOn)})`);
    console.log(
      `  ${branch.name}: earliest pickup ${formatPickupDay(earliestPickupDate(branch, now))}` +
        ` · off: ${off.join(", ") || "none"} · sold out: ${soldOut.join(", ") || "none"}`,
    );
  }
  const inactive = products.filter((p) => !p.isActive).map((p) => p.name);
  console.log(`  Hidden from every menu (inactive): ${inactive.join(", ") || "none"}`);

  const examples = {
    Branch: branches.find((b) => b.id === "northcote"),
    Product: products.find((p) => p.id === "sourdough-rye-loaf"),
    BranchProduct: branchProducts.find((bp) => bp.soldOutOn !== null),
    Customer: customers[0] && { ...customers[0], passwordHash: redactHash(customers[0].passwordHash) },
    StaffUser: staffUsers
      .filter((s) => s.role === "staff")
      .map((s) => ({ ...s, passwordHash: redactHash(s.passwordHash) }))[0],
    Order: orders[0] ?? "none yet (seeded in the admin step)",
    RecurringOrder: recurringOrders[0] ?? "none yet",
  };
  console.log("\nOne example per entity:");
  console.log(JSON.stringify(examples, null, 2));
}
