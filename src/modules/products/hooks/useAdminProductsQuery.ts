"use client";

import { useQuery } from "@tanstack/react-query";
import { adminProductsQueryOptions } from "../api/productsQueries";

/** A5's catalogue. Saves patch it, then refetch it. */
export function useAdminProductsQuery() {
  return useQuery(adminProductsQueryOptions());
}
