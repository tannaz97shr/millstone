"use client";

import { useEffect, useRef, useState } from "react";
import { devTokensContent } from "../content/devTokens";

export interface MeasuredHeightProps {
  /** Expected height, e.g. "48px". */
  expected: string;
  children: React.ReactNode;
}

/** Shows the rendered height of its child next to the token's expected value. */
export function MeasuredHeight({ expected, children }: MeasuredHeightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(Math.round(entry.borderBoxSize[0].blockSize));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div ref={ref} className="flex">
        {children}
      </div>
      <p className="caption text-ink-muted">
        {devTokensContent.expected} {expected} · {devTokensContent.measured}{" "}
        <span data-testid="measured">{height === null ? "…" : `${height}px`}</span>
      </p>
    </div>
  );
}
