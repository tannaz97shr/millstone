import { anyOrderIdParam, anyOrderRouteParamsSchema } from "@/modules/orders/lib/orderParams";

/** Staff open any kind of order: checkout, generated or seeded. */
export const adminOrderIdParam = anyOrderIdParam;

export const adminOrderRouteParamsSchema = anyOrderRouteParamsSchema;
