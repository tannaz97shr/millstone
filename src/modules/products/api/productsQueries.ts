import { queryOptions } from "@tanstack/react-query";
import { fetchAdminProducts } from "./productsApi";
import { adminProductKeys } from "./queryKeys";

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryKey: adminProductKeys.list(),
    queryFn: fetchAdminProducts,
  });
