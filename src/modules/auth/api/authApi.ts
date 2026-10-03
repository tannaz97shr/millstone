import { apiRoutes } from "@/shared/api-routes";
import { apiClient } from "@/shared/lib/http/apiClient";
import type { SignInRequest, SignInResponse } from "../lib/signInSchema";

/** scrypt plus a few Firestore reads; the rest is network headroom. */
const SIGN_IN_TIMEOUT_MS = 15_000;

export async function postSignIn(request: SignInRequest): Promise<SignInResponse> {
  const response = await apiClient.post<SignInResponse>(apiRoutes.admin.signIn, request, {
    timeout: SIGN_IN_TIMEOUT_MS,
  });
  return response.data;
}

export async function postSignOut(): Promise<void> {
  await apiClient.post(apiRoutes.admin.signOut);
}
