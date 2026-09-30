import type { CustomerId, IsoInstant } from "./ids";

/** A guest is a Customer with no password. */
export interface Customer {
  id: CustomerId;
  name: string;
  /** Lowercased and trimmed; unique. */
  email: string;
  /** Digits only. */
  phone: string;
  passwordHash: string | null;
  createdAt: IsoInstant;
}
