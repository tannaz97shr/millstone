import "server-only";
import { ApiError } from "./apiError";

/**
 * For routes that change something with the session cookie: the request must
 * come from a page on this site. Belt and braces with the SameSite=Lax cookie
 * and the JSON body (a cross-site form can't send either).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string | null = null;
  if (origin) {
    try {
      originHost = new URL(origin).host;
    } catch (error) {
      throw new ApiError(403, "forbidden", `Unreadable Origin header (${String(error)})`);
    }
  }
  if (!originHost || !host || originHost !== host) {
    throw new ApiError(403, "forbidden", "Cross-site request refused");
  }
}
