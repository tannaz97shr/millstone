import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { logError } from "@/shared/utils/logError";
import { ApiError, type ApiErrorBody } from "./apiError";

// Every API route goes through this: known ApiErrors become their 4xx JSON,
// anything else is logged and returned as a plain 500 (no internals leak).

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonResponse<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function routeHandler<Context>(
  context: string,
  handler: (request: Request, ctx: Context) => Promise<Response>,
): (request: Request, ctx: Context) => Promise<Response> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status >= 500) logError(error, context);
        return jsonResponse(error.toBody(), error.status);
      }
      logError(error, context);
      const body: ApiErrorBody = {
        error: { code: "server_error", message: "Something went wrong on our side" },
      };
      return jsonResponse(body, 500);
    }
  };
}

/** Validates route params or search params; a mismatch is a 400 that names the fields. */
export function parseParams<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".") || "params");
    throw new ApiError(400, "invalid_params", `Invalid ${[...new Set(fields)].join(", ")}`);
  }
  return result.data;
}
