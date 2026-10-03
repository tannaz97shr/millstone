import { getBranchesResponse } from "@/modules/branches/lib/listBranches";
import { jsonResponse, routeHandler } from "@/shared/lib/api/routeHandler";

// Public: the branch list and pickup dates aren't private. No session needed.
export const GET = routeHandler("GET /api/branches", async () =>
  jsonResponse(await getBranchesResponse(new Date())),
);
