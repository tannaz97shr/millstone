// Which orders on the live site are test leftovers (scripts/live/cleanupTestOrders.ts).
// Pure, so the rules are unit-tested. A match says why, for the dry run's list.

export interface OrderSummary {
  id: string;
  orderNumber: string;
  contactName: string;
  contactEmail: string;
}

/** Seed, generated-from-seed and demo orders have their own scripts; never these. */
const PROTECTED_ID = /^(seed-|demo-)/;

const TEST_EMAILS: { pattern: RegExp; why: string }[] = [
  { pattern: /^smoke-test@example\.com$/, why: "smoke test email" },
  { pattern: /^smoke-limit-[^@]*@example\.com$/, why: "smoke test email" },
  { pattern: /^batch\.[^@]*@example\.com$/, why: "QA batch email" },
  { pattern: /^stripe\.test[^@]*@example\.com$/, why: "Stripe test email" },
];

/** Why a name looks typed to test, or null for a plausible name. */
export function junkNameReason(name: string): string | null {
  const letters = name.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2) return "name has under 2 letters";
  if (/^(\p{L})\1+$/iu.test(letters)) return "name is one letter repeated";
  if (!/[aeiouy]/i.test(letters) && /^[a-z]+$/i.test(letters)) return "name has no vowels";
  if (/\btest\b/i.test(name)) return 'name says "test"';
  return null;
}

/**
 * Why `order` is a test order, or null. `extraNumbers` are order numbers
 * named on the command line (--order=MS-1047), for anything the rules miss.
 */
export function testOrderReason(order: OrderSummary, extraNumbers: ReadonlySet<string>): string | null {
  if (PROTECTED_ID.test(order.id)) return null;
  if (extraNumbers.has(order.orderNumber)) return "named with --order";
  const email = order.contactEmail.toLowerCase();
  const byEmail = TEST_EMAILS.find(({ pattern }) => pattern.test(email));
  if (byEmail) return byEmail.why;
  return junkNameReason(order.contactName);
}
