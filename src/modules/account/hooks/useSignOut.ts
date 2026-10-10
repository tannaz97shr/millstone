"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";
import { postCustomerSignOut } from "../api/accountApi";

/**
 * C9 "Sign out". The browser then loads C1 with a full navigation, so every
 * query and the cart's owner start again as a guest. The account's cart
 * stays saved for next time.
 */
export function useSignOut() {
  const mutation = useMutation({ mutationFn: postCustomerSignOut, retry: false });
  const [failed, setFailed] = useState(false);

  const signOut = useCallback(async () => {
    setFailed(false);
    try {
      await mutation.mutateAsync();
      window.location.assign(routes.home);
    } catch (error) {
      logError(error, "useSignOut");
      setFailed(true);
    }
  }, [mutation]);

  return { signOut, failed, pending: mutation.isPending || mutation.isSuccess };
}
