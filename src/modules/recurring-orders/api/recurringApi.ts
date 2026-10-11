import type { z } from "zod";
import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type {
  createRecurringRequestSchema,
  recurringActionRequestSchema,
  updateRecurringRequestSchema,
} from "../lib/recurringSchemas";
import type { RecurringOrderDetail, RecurringOrdersResponse } from "../types/recurringOrderView";

export type CreateRecurringInput = z.input<typeof createRecurringRequestSchema>;
export type UpdateRecurringInput = z.input<typeof updateRecurringRequestSchema>;
export type RecurringActionInput = z.input<typeof recurringActionRequestSchema>;

export async function fetchRecurringOrders(): Promise<RecurringOrdersResponse> {
  const response = await apiClient.get<RecurringOrdersResponse>(apiRoutes.account.recurringOrders);
  return response.data;
}

export async function fetchRecurringOrder(recurringOrderId: string): Promise<RecurringOrderDetail> {
  const response = await apiClient.get<RecurringOrderDetail>(apiRoutes.account.recurringOrder(recurringOrderId));
  return response.data;
}

export async function postRecurringOrder(request: CreateRecurringInput): Promise<RecurringOrderDetail> {
  const response = await apiClient.post<RecurringOrderDetail>(apiRoutes.account.recurringOrders, request);
  return response.data;
}

export async function patchRecurringOrder(
  recurringOrderId: string,
  request: UpdateRecurringInput,
): Promise<RecurringOrderDetail> {
  const response = await apiClient.patch<RecurringOrderDetail>(apiRoutes.account.recurringOrder(recurringOrderId), request);
  return response.data;
}

export async function postRecurringAction(
  recurringOrderId: string,
  request: RecurringActionInput,
): Promise<RecurringOrderDetail> {
  const response = await apiClient.post<RecurringOrderDetail>(
    apiRoutes.account.recurringOrderAction(recurringOrderId),
    request,
  );
  return response.data;
}
