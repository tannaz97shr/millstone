export const recurringKeys = {
  all: ["recurring-orders"] as const,
  /** C10 and C9's section. */
  list: () => [...recurringKeys.all, "list"] as const,
  /** C12 and C11 edit. */
  detail: (recurringOrderId: string) => [...recurringKeys.all, "detail", recurringOrderId] as const,
};
