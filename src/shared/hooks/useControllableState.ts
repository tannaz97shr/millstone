"use client";

import { useCallback, useState } from "react";

export interface ControllableStateOptions<T> {
  /** Controlled value. When not undefined, the component follows it. */
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** One state for components that can be controlled (value + onChange) or uncontrolled (defaultValue). */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
