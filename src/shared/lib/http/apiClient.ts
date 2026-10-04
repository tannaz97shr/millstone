import axios, { isAxiosError } from "axios";
import type { ApiErrorBody, ApiErrorCode, ApiErrorDetails } from "@/shared/lib/api/apiError";

// The browser's one HTTP client. Paths always come from api-routes.ts.

// The server gives Firestore 5s (FIRESTORE_READ_DEADLINE_MS) before it answers
// 503; the rest is headroom for a slow network or a first compile in dev.
export const apiClient = axios.create({
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

export interface ApiFailure extends ApiErrorDetails {
  /** 0 when the request never got a response (offline, timeout). */
  status: number;
  code: ApiErrorCode | "network_error";
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as ApiErrorBody).error?.code === "string"
  );
}

/** What a failed request means for the screen, whatever threw. */
export function toApiFailure(error: unknown): ApiFailure {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data: unknown = error.response?.data;
    if (isApiErrorBody(data)) {
      const {
        code,
        earliest,
        fields,
        items,
        totalCents,
        existingOrder,
        orderNumber,
        currentStatus,
        currentAvailability,
      } = data.error;
      return {
        status,
        code,
        earliest,
        fields,
        items,
        totalCents,
        existingOrder,
        orderNumber,
        currentStatus,
        currentAvailability,
      };
    }
    return { status, code: status === 0 ? "network_error" : "server_error" };
  }
  return { status: 0, code: "network_error" };
}

/**
 * Retry network trouble and 5xx a couple of times; a 4xx won't change by
 * asking again. Nor is "unavailable" retried: the server already waited its
 * full Firestore deadline, so the screen shows the error and its Try again.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const { status, code } = toApiFailure(error);
  if (code === "unavailable") return false;
  return failureCount < 2 && (status === 0 || status >= 500);
}
