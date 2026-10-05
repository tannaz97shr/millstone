import { signInThrottleDocId } from "@/modules/auth/lib/signInThrottle";
import { productToDoc, toProduct } from "@/modules/catalog/lib/toProduct";
import { getDb } from "@/shared/lib/firebase/admin";
import {
  customerEmailsRef,
  customersRef,
  ordersRef,
  productsRef,
  rateLimitsRef,
  signInThrottleRef,
} from "@/shared/lib/firebase/collections";
import { readFirebaseEnv } from "@/shared/lib/firebase/env";
import { liveDataWarning } from "@/shared/lib/firebase/firebaseTarget";
import { deleteStoredFile } from "@/shared/lib/firebase/storage";
import { logError } from "@/shared/utils/logError";
import { resolveSeedTarget } from "../seed/lib/guard";

// bun run cleanup:smoke:live -- --order=MS-1047 [--product=fruit-loaf] [--yes]
// (or `bun --conditions=react-server scripts/live/cleanupSmoke.ts …` on the emulator)
//
// Removes what the post-deploy smoke test (README, Deploying) leaves behind:
// - its order, only if the contact email is the smoke test's
// - that guest customer and its email lock, if it has no other orders and no password
// - the photo the smoke test put on --product (the product goes back to its letter)
// - every rateLimits doc (they only last an hour anyway)
// - the sign-in throttle records of the smoke test's made-up emails
// Without --yes it only says what it would do. Same guard as the seed: the
// emulator, or the live project named on purpose; never --reset.

const SMOKE_EMAIL = "smoke-test@example.com";
/** The made-up emails the smoke test signs in with to reach the per-IP limit. */
const SMOKE_SIGN_IN_EMAILS = [
  ...Array.from({ length: 21 }, (_, i) => `smoke-limit-${i}@example.com`),
  "smoke-limit-x@example.com",
];

function flag(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
}

async function main(): Promise<void> {
  const target = resolveSeedTarget(process.argv.slice(2), readFirebaseEnv(), process.env);
  const write = process.argv.includes("--yes");
  const orderNumber = flag("order");
  const productId = flag("product");
  if (!orderNumber || !/^MS-\d{4,}$/.test(orderNumber)) throw new Error("Pass --order=MS-NNNN (the smoke test's order).");

  if (!target.emulatorHost) console.warn(`\n${liveDataWarning(target.projectId)}\n`);
  console.log(`Smoke cleanup on ${target.projectId}${write ? "" : " (dry run: add --yes to delete)"}`);
  const plan: string[] = [];
  const db = getDb();
  const batch = db.batch();

  // The order, only if it's the smoke test's.
  const orders = await ordersRef().where("orderNumber", "==", orderNumber).limit(2).get();
  if (orders.size !== 1) throw new Error(`Expected one order ${orderNumber}, found ${orders.size}.`);
  const order = orders.docs[0];
  if (order.get("contactEmail") !== SMOKE_EMAIL) {
    throw new Error(`${orderNumber} isn't the smoke test's (its contact email isn't ${SMOKE_EMAIL}). Nothing deleted.`);
  }
  batch.delete(order.ref);
  plan.push(`order ${orderNumber} (${order.id})`);

  // The guest the order created, unless it has anything else.
  const lock = await customerEmailsRef().doc(SMOKE_EMAIL).get();
  const customerId = lock.get("customerId") as string | undefined;
  if (customerId) {
    const [customer, others] = await Promise.all([
      customersRef().doc(customerId).get(),
      ordersRef().where("customerId", "==", customerId).limit(2).get(),
    ]);
    const otherOrders = others.docs.filter((doc) => doc.id !== order.id).length;
    if (otherOrders === 0 && customer.exists && customer.get("passwordHash") === null) {
      batch.delete(customer.ref);
      batch.delete(lock.ref);
      plan.push(`guest customer ${customerId} and its email lock`);
    } else {
      plan.push(`kept customer ${customerId} (other orders or a password)`);
    }
  }

  // The rate-limit counters, and the made-up emails' sign-in records.
  const limits = await rateLimitsRef().get();
  for (const doc of limits.docs) batch.delete(doc.ref);
  plan.push(`${limits.size} rateLimits docs`);
  const throttles = await db.getAll(...SMOKE_SIGN_IN_EMAILS.map((email) => signInThrottleRef().doc(signInThrottleDocId(email))));
  const found = throttles.filter((doc) => doc.exists);
  for (const doc of found) batch.delete(doc.ref);
  plan.push(`${found.length} signInThrottle docs for the smoke emails`);

  // The smoke photo on --product: the product loses it (and bumps its version, as any save does).
  let photoPath: string | null = null;
  if (productId) {
    const snapshot = await productsRef().doc(productId).get();
    if (!snapshot.exists) throw new Error(`No product ${productId}.`);
    const product = toProduct(snapshot);
    if (product.image) {
      photoPath = product.image.path;
      batch.set(snapshot.ref, productToDoc({ ...product, image: null, version: product.version + 1 }));
      plan.push(`photo of ${product.name} (${photoPath})`);
    } else {
      plan.push(`${product.name} has no photo; left as is`);
    }
  }

  console.log(plan.map((line) => `  - ${line}`).join("\n"));
  if (!write) return;
  await batch.commit();
  if (photoPath && !(await deleteStoredFile(photoPath, "smoke cleanup"))) {
    console.warn(`  The file ${photoPath} couldn't be deleted; remove it in the console.`);
  }
  console.log("Done. The order counter stays where it is.");
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    logError(error, "cleanupSmoke");
    process.exit(1);
  },
);
