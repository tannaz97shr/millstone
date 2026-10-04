import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { adminProductKeys } from "../api/queryKeys";
import { listAdminProducts } from "./listAdminProducts";

/** Server-side fill of the query A5 makes through GET /api/admin/products. The page checks it's the owner. */
export async function prefetchAdminProducts(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({ queryKey: adminProductKeys.list(), queryFn: listAdminProducts });
}
