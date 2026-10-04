"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { routes } from "@/shared/routes";
import { type AvailabilityView, availabilityViewFromUrl, availabilityViewToQuery } from "../lib/availabilityView";

/**
 * A4's branch (owner) and "Mark sold out for" day, kept in the URL with
 * history.replaceState: no new history entry, no server round trip. Staff
 * never get a branch: theirs is the only one.
 */
export function useAvailabilityView(owner: boolean) {
  const params = useSearchParams();

  const view = useMemo<AvailabilityView>(() => {
    const read = availabilityViewFromUrl(params);
    return owner ? read : { ...read, branch: null };
  }, [params, owner]);

  const setView = useCallback(
    (changes: Partial<AvailabilityView>) => {
      window.history.replaceState(null, "", routes.admin.availability(availabilityViewToQuery({ ...view, ...changes })));
    },
    [view],
  );

  return { view, setView };
}
