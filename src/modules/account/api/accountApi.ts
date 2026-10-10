import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type {
  AccountRedirectResponse,
  CustomerSignInRequest,
  FromOrderRequest,
  ProfileFormValues,
  SignUpRequest,
} from "../lib/accountSchemas";
import type { AccountOrder, AccountOrdersResponse } from "../types/accountOrder";
import type { AccountProfile, AccountSessionResponse } from "../types/accountSession";

/** scrypt (twice when a password is set, then checked) plus a few Firestore round trips. */
const PASSWORD_TIMEOUT_MS = 15_000;

export async function fetchAccountSession(): Promise<AccountSessionResponse> {
  const response = await apiClient.get<AccountSessionResponse>(apiRoutes.account.session);
  return response.data;
}

export async function postCustomerSignIn(request: CustomerSignInRequest): Promise<AccountRedirectResponse> {
  const response = await apiClient.post<AccountRedirectResponse>(apiRoutes.account.signIn, request, {
    timeout: PASSWORD_TIMEOUT_MS,
  });
  return response.data;
}

export async function postSignUp(request: SignUpRequest): Promise<AccountRedirectResponse> {
  const response = await apiClient.post<AccountRedirectResponse>(apiRoutes.account.signUp, request, {
    timeout: PASSWORD_TIMEOUT_MS,
  });
  return response.data;
}

export async function postAccountFromOrder(request: FromOrderRequest): Promise<AccountRedirectResponse> {
  const response = await apiClient.post<AccountRedirectResponse>(apiRoutes.account.fromOrder, request, {
    timeout: PASSWORD_TIMEOUT_MS,
  });
  return response.data;
}

export async function postCustomerSignOut(): Promise<void> {
  await apiClient.post(apiRoutes.account.signOut);
}

export async function patchProfile(profile: ProfileFormValues): Promise<AccountProfile> {
  const response = await apiClient.patch<AccountProfile>(apiRoutes.account.profile, profile);
  return response.data;
}

export async function fetchAccountOrders(): Promise<AccountOrdersResponse> {
  const response = await apiClient.get<AccountOrdersResponse>(apiRoutes.account.orders);
  return response.data;
}

export async function fetchAccountOrder(orderId: string): Promise<AccountOrder> {
  const response = await apiClient.get<AccountOrder>(apiRoutes.account.order(orderId));
  return response.data;
}
