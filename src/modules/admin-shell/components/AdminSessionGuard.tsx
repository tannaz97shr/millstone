"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";

function toSignIn(): void {
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.assign(routes.admin.signIn(here));
}

/**
 * The session can end mid-service (12 hours from sign-in, or signed out on
 * another tab). Any admin request answered 401 sends the tablet to A1, which
 * comes straight back to this page, filters and open order included, as they
 * live in the URL.
 */
export function AdminSessionGuard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const isUnauthenticated = (error: unknown) => toApiFailure(error).status === 401;
    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && isUnauthenticated(event.action.error)) {
        toSignIn();
      }
    });
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && isUnauthenticated(event.action.error)) {
        toSignIn();
      }
    });
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient]);

  return null;
}
