// Branded ID and date strings. A BranchId can't be passed where a ProductId is
// expected, and a pickup date can't be confused with an instant.

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type BranchId = Brand<string, "BranchId">;
export type ProductId = Brand<string, "ProductId">;
export type CustomerId = Brand<string, "CustomerId">;
export type StaffUserId = Brand<string, "StaffUserId">;
export type OrderId = Brand<string, "OrderId">;
export type RecurringOrderId = Brand<string, "RecurringOrderId">;

/** A bakery day, "YYYY-MM-DD". Not an instant; no time zone attached. */
export type IsoDate = Brand<string, "IsoDate">;

/** An instant as an ISO 8601 string, e.g. "2026-09-30T04:00:00.000Z". */
export type IsoInstant = Brand<string, "IsoInstant">;

/** A time of day in the branch's local time, "HH:mm" (24-hour). */
export type TimeOfDay = Brand<string, "TimeOfDay">;

/** Weekday number, 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Money in integer cents (AUD). Formatted to dollars only for display. */
export type Cents = number;
