"use client";

import { useState } from "react";
import { findArrivals } from "../lib/arrivals";
import type { AdminOrderList } from "../types/adminOrder";

interface ArrivalState {
  key: string;
  generatedAt: string | null;
  seen: Set<string>;
  numbers: string[];
}

/**
 * The order numbers the latest refresh brought in (see lib/arrivals). Shown
 * until the next refresh that brings none; reset when the filters change.
 * Worked out while rendering, from the previous list kept in state.
 */
export function useArrivals(data: AdminOrderList | undefined, filterKey: string, isPlaceholder: boolean): string[] {
  const [state, setState] = useState<ArrivalState>({ key: filterKey, generatedAt: null, seen: new Set(), numbers: [] });

  if (data && !isPlaceholder && (state.key !== filterKey || state.generatedAt !== data.generatedAt)) {
    const ids = data.orders.map((order) => order.id);
    if (state.key !== filterKey || state.generatedAt === null) {
      setState({ key: filterKey, generatedAt: data.generatedAt, seen: new Set(ids), numbers: [] });
    } else {
      const arrived = findArrivals(data.orders, state.seen, state.generatedAt);
      setState({
        key: filterKey,
        generatedAt: data.generatedAt,
        seen: new Set([...state.seen, ...ids]),
        numbers: arrived.map((order) => order.orderNumber),
      });
    }
  }

  return state.key === filterKey ? state.numbers : [];
}
