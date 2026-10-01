import {
  branchRouteParamsSchema,
  menuSearchParamsSchema,
} from "@/modules/branches/lib/branchParams";
import { getBranchMenu } from "@/modules/menu/lib/getBranchMenu";
import { jsonResponse, parseParams, routeHandler } from "@/shared/lib/api/routeHandler";

// Public: a branch's menu isn't private. No session needed.
// 400 bad params, 404 unknown branch, 422 a date that can't be ordered.
export const GET = routeHandler(
  "GET /api/branches/[branchId]/menu",
  async (request, { params }: { params: Promise<{ branchId: string }> }) => {
    const { branchId } = parseParams(branchRouteParamsSchema, await params);
    const { date } = parseParams(
      menuSearchParamsSchema,
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonResponse(await getBranchMenu(branchId, date, new Date()));
  },
);
