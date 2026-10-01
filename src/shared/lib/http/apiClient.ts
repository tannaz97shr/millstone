import axios, { isAxiosError } from "axios";
import type { IsoDate } from "@/shared/domain";
import type { ApiErrorBody, ApiErrorCode } from "@/shared/lib/api/apiError";

// The browser's one HTTP client. Paths always come from api-routes.ts.

export const apiClient = axios.create({
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

export interface ApiFailure {
  /** 0 when the request never got a response (offline, timeout). */
  status: number;
  code: ApiErrorCode | "network_error";
  earliest?: IsoDate;
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
      return { status, code: data.error.code, earliest: data.error.earliest };
    }
    return { status, code: status === 0 ? "network_error" : "server_error" };
  }
  return { status: 0, code: "network_error" };
}

/** Retry network trouble and 5xx a couple of times; a 4xx won't change by asking again. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const { status } = toApiFailure(error);
  return failureCount < 2 && (status === 0 || status >= 500);
}
