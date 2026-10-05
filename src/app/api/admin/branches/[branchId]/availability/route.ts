import { requireStaffSession } from "@/modules/auth/lib/requireSession";
import { getBranchAvailability } from "@/modules/availability/lib/getBranchAvailability";
import { branchRouteParamsSchema } from "@/modules/branches/lib/branchParams";
import { jsonResponse, parseParams, routeHandler } from "@/shared/lib/api/routeHandler";

// A4: every active product with its row at one branch. 401 signed out, 403
// not a staff session or (staff) another branch, 404 an unknown branch.
export const GET = routeHandler(
  "GET /api/admin/branches/[branchId]/availability",
  async (_request, { params }: { params: Promise<{ branchId: string }> }) => {
    const actor = await requireStaffSession();
    const { branchId } = parseParams(branchRouteParamsSchema, await params);
    return jsonResponse(await getBranchAvailability(actor, branchId, new Date()));
  },
);
