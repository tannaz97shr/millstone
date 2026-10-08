import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { ProductInputRequest, ProductPhotoRemoveRequest, ProductUpdateRequest } from "../lib/productSchemas";
import type { AdminProductResult, AdminProductsResponse } from "../types/adminProduct";

/** A save gets 8s on the server (PRODUCT_SAVE_DEADLINE_MS); the rest is network. */
const SAVE_TIMEOUT_MS = 15_000;
/** Up to 10 MB up a shop's connection, then the conversion. */
const PHOTO_TIMEOUT_MS = 90_000;

export async function fetchAdminProducts(): Promise<AdminProductsResponse> {
  const response = await apiClient.get<AdminProductsResponse>(apiRoutes.admin.products);
  return response.data;
}

export async function createProduct(body: ProductInputRequest): Promise<AdminProductResult> {
  const response = await apiClient.post<AdminProductResult>(apiRoutes.admin.products, body, {
    timeout: SAVE_TIMEOUT_MS,
  });
  return response.data;
}

export async function updateProduct(productId: string, body: ProductUpdateRequest): Promise<AdminProductResult> {
  const response = await apiClient.patch<AdminProductResult>(apiRoutes.admin.product(productId), body, {
    timeout: SAVE_TIMEOUT_MS,
  });
  return response.data;
}

export async function uploadProductPhoto(productId: string, file: File, expectedVersion: number): Promise<AdminProductResult> {
  const form = new FormData();
  form.set("file", file);
  form.set("expectedVersion", String(expectedVersion));
  const response = await apiClient.post<AdminProductResult>(apiRoutes.admin.productPhoto(productId), form, {
    timeout: PHOTO_TIMEOUT_MS,
  });
  return response.data;
}

export async function removeProductPhoto(productId: string, expectedVersion: number): Promise<AdminProductResult> {
  const body: ProductPhotoRemoveRequest = { expectedVersion };
  const response = await apiClient.delete<AdminProductResult>(apiRoutes.admin.productPhoto(productId), {
    data: body,
    timeout: SAVE_TIMEOUT_MS,
  });
  return response.data;
}
