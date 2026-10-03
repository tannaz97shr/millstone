import type { IsoDate } from "@/shared/domain";

// The error shape every API route returns, shared by the route handlers and
// the browser's API client. Messages are for developers; screens show their
// own copy based on `code`.

export type ApiErrorCode =
  | "invalid_params"
  | "unknown_branch"
  | "closed_day"
  | "past_cutoff"
  | "out_of_range"
  /** Firestore didn't answer in time (503). */
  | "unavailable"
  | "server_error";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** On pickup-date errors: the earliest date that can be ordered. */
    earliest?: IsoDate;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: Omit<ApiErrorBody["error"], "code" | "message"> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, ...this.details } };
  }
}
