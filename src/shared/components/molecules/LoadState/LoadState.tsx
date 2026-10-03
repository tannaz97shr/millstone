"use client";

import { Button } from "../../atoms/Button/Button";
import { Notice } from "../Notice/Notice";

// What a screen shows while its data loads or after it failed. No skeletons
// or shimmer (design/system/README.md): plain words, and a way to try again.

export function LoadingMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-ink-muted">
      {children}
    </p>
  );
}

export interface LoadErrorNoticeProps {
  children: React.ReactNode;
  retryLabel: string;
  onRetry: () => void;
  /** True while the retry is running. */
  retrying?: boolean;
}

/** The failure itself is logged where it was caught (the query cache). */
export function LoadErrorNotice({ children, retryLabel, onRetry, retrying }: LoadErrorNoticeProps) {
  return (
    <Notice
      tone="error"
      action={
        <Button onClick={onRetry} disabled={retrying}>
          {retryLabel}
        </Button>
      }
    >
      {children}
    </Notice>
  );
}
