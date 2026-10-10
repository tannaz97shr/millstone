import type { Customer } from "@/shared/domain";
import type { AccountProfile } from "../types/accountSession";

/** What the browser gets of an account: never the password hash. */
export function toAccountProfile(customer: Customer): AccountProfile {
  return { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email };
}
