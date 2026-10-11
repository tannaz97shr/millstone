import { runGeneration } from "@/modules/recurring-orders/lib/generation/runGeneration";
import { ApiError } from "@/shared/lib/api/apiError";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";
import { decideCronAuth } from "@/shared/lib/cron/cronAuth";

// Daily recurring-order generation (spec 8, AC-R8), called by Vercel Cron
// (vercel.json) at 04:00 UTC: 2pm AEST / 3pm AEDT, after the 2pm cutoff in
// both seasons even when Hobby runs it late in the hour. It's the backstop:
// A2 and customer changes also generate (see runGeneration).
//
// No session and no rate limit: `Authorization: Bearer $CRON_SECRET` is the
// credential. 200 the run's counts (no personal data), 401 a missing or
// wrong header, 503 CRON_SECRET not set (the job is off).

export const maxDuration = 60;

/** Stops starting new work well inside maxDuration; the next trigger carries on. */
const BUDGET_MS = 45_000;

export const GET = routeHandler("GET /api/cron/recurring-orders", async (request) => {
  const decision = decideCronAuth(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (decision === "not_configured") {
    throw new ApiError(503, "unavailable", "Recurring generation is off: CRON_SECRET is not set");
  }
  if (decision === "denied") throw new ApiError(401, "unauthenticated", "Missing or wrong cron secret");

  const summary = await runGeneration({ now: new Date(), budgetMs: BUDGET_MS, source: "cron" });
  return jsonResponse({
    done: summary.done,
    branches: summary.branches.map(({ branchId, through, outcome, due, generated, failed }) => ({
      branchId,
      through,
      outcome,
      due,
      generated,
      failed,
    })),
  });
});
