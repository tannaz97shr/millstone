export const orderKeys = {
  all: ["orders"] as const,
  confirmation: (orderId: string) => [...orderKeys.all, "confirmation", orderId] as const,
};
