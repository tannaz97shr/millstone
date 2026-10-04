import type { CustomerId } from "@/shared/domain";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { logError } from "@/shared/utils/logError";
import { seedCustomers, seedStaffUsers } from "./data/people";
import { resetEmulator, resolveSeedTarget } from "./lib/guard";
import { seedBranchesAndCatalog, seedOrderCounter } from "./lib/seedCatalog";
import { seedOrdersAndRecurring } from "./lib/seedOrders";
import { readSeedEnv } from "./lib/seedEnv";
import { seedCustomer, seedStaffUser } from "./lib/seedPeople";
import { printSeedSummary } from "./lib/summary";
import { WriteTally } from "./lib/upsert";

// bun run seed [--reset] [--project=<id>]
// Idempotent: a second run reports no changes.

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env.NODE_ENV);
  const passwords = readSeedEnv();
  const now = new Date();

  console.log(
    `Seeding ${target.projectId} ${target.emulatorHost ? `(emulator ${target.emulatorHost})` : "(real project)"}`,
  );
  if (target.reset) {
    await resetEmulator(target);
    console.log("Emulator Firestore wiped.");
  }

  const tally = new WriteTally();
  await seedBranchesAndCatalog(now, tally);
  await seedOrderCounter(tally);
  for (const user of seedStaffUsers) {
    await seedStaffUser(user, passwords.SEED_STAFF_PASSWORD, tally);
  }
  const customers = new Map<string, { id: CustomerId; name: string; email: string; phone: string }>();
  for (const customer of seedCustomers) {
    const id = await seedCustomer(customer, passwords.SEED_CUSTOMER_PASSWORD, now, tally);
    customers.set(customer.email, { id, name: customer.name, email: customer.email, phone: customer.phone });
  }
  await seedOrdersAndRecurring(now, customers, tally);

  console.log("\nWrites:");
  console.table(tally.rows());
  console.log(tally.changes === 0 ? "No changes: data was already seeded." : `${tally.changes} docs written.`);

  await printSeedSummary(now);
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "seed");
    process.exit(1);
  },
);
