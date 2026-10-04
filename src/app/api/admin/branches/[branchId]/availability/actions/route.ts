import { branchScope, requireStaffSession } from "@/modules/auth/lib/requireSession";
import { availabilityActionSchema } from "@/modules/availability/lib/availabilityActionSchema";
import { applyAvailabilityAction } from "@/modules/availability/lib/applyAvailabilityAction";
import { branchRouteParamsSchema } from "@/modules/branches/lib/branchParams";
import { jsonResponse, parseBody, parseParams, routeHandler } from "@/shared/lib/api/routeHandler";
import { assertSameOrigin } from "@/shared/lib/api/sameOrigin";

// A4 actions (AC-P4, P5): switch on or off, sold out for a date, back on sale.
// 401 signed out; 403 not a staff session, a cross-site request, or (staff)
// another branch; 400 a bad body; 404 an unknown branch or a product that is
// missing or hidden; 409 when the row isn't what the staff member saw; 422 a
// sold-out date that can't be ordered.
export const POST = routeHandler(
  "POST /api/admin/branches/[branchId]/availability/actions",
  async (request, { params }: { params: Promise<{ branchId: string }> }) => {
    const actor = await requireStaffSession();
    assertSameOrigin(request);
    const { branchId } = parseParams(branchRouteParamsSchema, await params);
    branchScope(actor, branchId);
    const action = await parseBody(availabilityActionSchema, request);
    return jsonResponse(await applyAvailabilityAction(actor, branchId, action, new Date()));
  },
);
