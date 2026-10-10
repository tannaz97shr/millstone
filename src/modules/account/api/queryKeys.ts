export const accountKeys = {
  all: ["account"] as const,
  /** Who's signed in (null for a guest or staff). */
  session: () => [...accountKeys.all, "session"] as const,
  orders: () => [...accountKeys.all, "orders"] as const,
  order: (orderId: string) => [...accountKeys.all, "orders", orderId] as const,
};
