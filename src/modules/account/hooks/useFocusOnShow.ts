"use client";

import { useEffect, useRef } from "react";
import { focusWithoutTabStop } from "@/shared/utils/focusable";

/** Moves focus to the returned element whenever `value` turns truthy or changes, so a new message is read. */
export function useFocusOnShow<T extends HTMLElement>(value: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (value && ref.current) focusWithoutTabStop(ref.current);
  }, [value]);
  return ref;
}
