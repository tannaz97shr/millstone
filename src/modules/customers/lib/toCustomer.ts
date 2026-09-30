import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { Customer, CustomerId } from "@/shared/domain";
import { timestampToIso } from "@/shared/lib/firebase/fieldSchemas";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { CustomerDoc, CustomerEmailLockDoc } from "../types/customerDocs";
import { customerDocSchema, customerEmailLockSchema } from "./customerSchema";

export function toCustomer(snapshot: DocumentSnapshot): Customer {
  const doc = parseDoc(customerDocSchema, snapshot);
  return {
    id: snapshot.id as CustomerId,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    passwordHash: doc.passwordHash,
    createdAt: timestampToIso(doc.createdAt),
  };
}

export function customerToDoc(customer: Omit<Customer, "id">): CustomerDoc {
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    passwordHash: customer.passwordHash,
    createdAt: Timestamp.fromDate(new Date(customer.createdAt)),
  };
}

export function toCustomerIdFromEmailLock(snapshot: DocumentSnapshot): CustomerId {
  return parseDoc(customerEmailLockSchema, snapshot).customerId as CustomerId;
}

export function customerEmailLockToDoc(customerId: CustomerId): CustomerEmailLockDoc {
  return { customerId };
}
