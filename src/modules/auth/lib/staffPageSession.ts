import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "@/shared/lib/api/apiError";
import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";
import { requireStaffSession, type StaffActor } from "./requireSession";

/**
 * For admin pages and layouts: the signed-in staff member, or a redirect to
 * A1. proxy.ts normally redirects first (with the page to come back to); this
 * catches a session that ended or an account removed since.
 */
export async function getStaffPageSession(): Promise<StaffActor> {
  try {
    return await requireStaffSession();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      logError(error, "getStaffPageSession", { level: "warn" });
      redirect(routes.admin.signIn());
    }
    throw error;
  }
}
