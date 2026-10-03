"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { postSignOut } from "@/modules/auth/api/authApi";
import { routes } from "@/shared/routes";
import { logError } from "@/shared/utils/logError";

/** Sign out, then a full load of A1 so nothing from the session stays in memory. */
export function useSignOut() {
  const mutation = useMutation({ mutationFn: postSignOut, retry: false });
  const [failed, setFailed] = useState(false);

  const signOut = useCallback(async () => {
    if (mutation.isPending || mutation.isSuccess) return;
    setFailed(false);
    try {
      await mutation.mutateAsync();
      window.location.assign(routes.admin.signIn());
    } catch (error) {
      logError(error, "useSignOut");
      setFailed(true);
    }
  }, [mutation]);

  return {
    signOut,
    signingOut: mutation.isPending || mutation.isSuccess,
    failed,
    dismissFailure: () => setFailed(false),
  };
}
